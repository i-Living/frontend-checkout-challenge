/**
 * Правила чекаута: валидация, сборка delivery для quote, разбор VALIDATION_ERROR.
 * Суммы сюда не входят — они только из quote.
 */
import type { CreateQuoteDelivery } from '@/shared/api/endpoints'
import { isApiError, toUserMessage } from '@/shared/api/errors'
import type { CheckoutDraft } from '@/shared/store/session-store'
import type { CheckoutFieldErrors } from './checkout-form'

/** Одни тексты на клиенте и на серверном VALIDATION_ERROR. Серверный message технический — не показываем. */
export const FIELD_MESSAGES = {
    name: 'Укажите имя',
    email: 'Укажите корректный email',
    phone: 'Телефон в формате + и 10–15 цифр',
    pickupPointId: 'Выберите пункт выдачи',
    city: 'Укажите город',
    street: 'Укажите улицу',
    house: 'Укажите дом',
} as const satisfies Record<keyof CheckoutFieldErrors, string>

/**
 * Клиентская проверка до POST. Пустая карта — можно собирать заказ; иначе submit не идёт.
 * @param draft Черновик из session-store, не из DOM.
 * @returns Ошибки полей; apartment не валидируется (необязательное).
 */
export function validateDraft(draft: CheckoutDraft): CheckoutFieldErrors {
    const errors: CheckoutFieldErrors = {}
    if (!draft.name.trim()) {
        errors.name = FIELD_MESSAGES.name
    }
    if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) {
        errors.email = FIELD_MESSAGES.email
    }
    if (!/^\+[1-9]\d{9,14}$/.test(draft.phone.trim())) {
        errors.phone = FIELD_MESSAGES.phone
    }
    if (draft.deliveryMethod === 'courier') {
        if (!draft.city.trim()) {
            errors.city = FIELD_MESSAGES.city
        }
        if (!draft.street.trim()) {
            errors.street = FIELD_MESSAGES.street
        }
        if (!draft.house.trim()) {
            errors.house = FIELD_MESSAGES.house
        }
    } else if (!draft.pickupPointId) {
        errors.pickupPointId = FIELD_MESSAGES.pickupPointId
    }
    return errors
}

/**
 * Тело delivery для POST /api/quotes. null = quote ещё не слать (поля пустые).
 * @param draft Черновик; для курьера пустой apartment не попадает в JSON.
 * @returns CreateQuoteDelivery или null.
 */
export function buildDelivery(draft: CheckoutDraft): CreateQuoteDelivery | null {
    if (draft.deliveryMethod === 'courier') {
        const city = draft.city.trim()
        const street = draft.street.trim()
        const house = draft.house.trim()
        const apartment = draft.apartment.trim()
        if (!city || !street || !house) {
            return null
        }
        return { method: 'courier', address: { city, street, house, ...(apartment ? { apartment } : {}) } }
    }
    if (draft.deliveryMethod === 'pickup') {
        if (!draft.pickupPointId) {
            return null
        }
        // pickupPointId в черновике — string из опций API; каст точечный,
        // только id к литеральному union контракта (те же id из API).
        type PickupId = Extract<CreateQuoteDelivery, { method: 'pickup' }>['pickupPointId']
        return { method: 'pickup', pickupPointId: draft.pickupPointId as PickupId }
    }
    return null
}

/**
 * Алерт создания заказа. Не дублировать карту кодов здесь — она в errors.ts.
 * @param error mutation.error createOrder
 * @returns Строка для MutationAlert
 */
export function toOrderErrorMessage(error: unknown): string {
    return toUserMessage(error)
}

/**
 * VALIDATION_ERROR → поля формы. Неизвестный leaf (apartment) в карту не идёт —
 * его показывает общий алерт, чтобы не потерять текст.
 * @param error mutation.error createOrder
 * @returns Карта известных полей или null, если это не VALIDATION_ERROR.
 */
export function toServerFieldErrors(error: unknown): CheckoutFieldErrors | null {
    if (!isApiError(error) || error.code !== 'VALIDATION_ERROR' || !error.fields) {
        return null
    }
    const mapped: CheckoutFieldErrors = {}
    for (const field of error.fields) {
        const leaf = field.path.split('/').pop()
        if (leaf && leaf in FIELD_MESSAGES) {
            const key = leaf as keyof typeof FIELD_MESSAGES
            mapped[key] = FIELD_MESSAGES[key]
        }
    }
    return Object.keys(mapped).length > 0 ? mapped : null
}
