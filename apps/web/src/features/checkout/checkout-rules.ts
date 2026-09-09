/**
 * Правила оформления: клиентская валидация, сборка доставки и разбор ошибок заказа.
 */
import type { CreateQuoteDelivery } from '@/shared/api/endpoints'
import { isApiError, toUserMessage } from '@/shared/api/errors'
import type { CheckoutDraft } from '@/shared/store/session-store'
import type { CheckoutFieldErrors } from './checkout-form'

/** Тексты ошибок полей: одни и те же на клиенте и при VALIDATION_ERROR с сервера. */
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
 * Проверяет черновик формы оформления на клиенте.
 * @param draft Черновик из session-store
 * @returns Карта полевых ошибок, пустая — если всё корректно
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
 * Строит доставку для quote из черновика (курьер или самовывоз).
 * @param draft Черновик из session-store
 * @returns Доставка для quote либо null, если данных не хватает
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
 * Превращает ошибку создания заказа в текст для алерта.
 * Делегирует в общий перевод кодов API.
 * @param error Ошибка создания заказа
 * @returns Текст сообщения пользователю
 */
export function toOrderErrorMessage(error: unknown): string {
    return toUserMessage(error)
}

/**
 * Маппит серверную VALIDATION_ERROR в полевые ошибки формы.
 * Неизвестные поля (например apartment) сюда не попадают: их текст показывает
 * общий алерт через toOrderErrorMessage (error.message).
 * @param error Ошибка создания заказа
 * @returns Карта полевых ошибок либо null, если это не серверная валидация
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
