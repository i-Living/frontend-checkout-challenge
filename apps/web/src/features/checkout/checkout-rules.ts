/**
 * Правила оформления: клиентская валидация, сборка доставки и разбор ошибок заказа.
 */
import type { CreateQuoteDelivery } from '@/shared/api/endpoints'
import { isApiError } from '@/shared/api/errors'
import type { CheckoutDraft } from '@/shared/store/session-store'
import type { CheckoutFieldErrors } from './checkout-form'

/**
 * Проверяет черновик формы оформления на клиенте.
 * @param draft Черновик из session-store
 * @returns Карта полевых ошибок, пустая — если всё корректно
 */
export function validateDraft(draft: CheckoutDraft): CheckoutFieldErrors {
    const errors: CheckoutFieldErrors = {}
    if (!draft.name.trim()) {
        errors.name = 'Укажите имя'
    }
    if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) {
        errors.email = 'Укажите корректный email'
    }
    if (!/^\+[1-9]\d{9,14}$/.test(draft.phone.trim())) {
        errors.phone = 'Телефон в формате + и 10–15 цифр'
    }
    if (draft.deliveryMethod === 'courier') {
        if (!draft.city.trim()) {
            errors.city = 'Укажите город'
        }
        if (!draft.street.trim()) {
            errors.street = 'Укажите улицу'
        }
        if (!draft.house.trim()) {
            errors.house = 'Укажите дом'
        }
    } else if (!draft.pickupPointId) {
        errors.pickupPointId = 'Выберите пункт выдачи'
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
 * Превращает ошибку создания заказа в текст (конфликт версий, протухший quote, пустая корзина).
 * @param error Ошибка создания заказа
 * @returns Текст сообщения пользователю
 */
export function toOrderErrorMessage(error: unknown): string {
    if (isApiError(error)) {
        if (error.code === 'CART_VERSION_CONFLICT') {
            return 'Корзина изменилась. Обновите корзину и продолжите оформление.'
        }
        if (error.code === 'QUOTE_EXPIRED') {
            return 'Расчёт устарел. Создайте новый расчёт с той же доставкой.'
        }
        if (error.code === 'CART_EMPTY') {
            return 'Корзина пуста. Вернитесь в корзину и добавьте товары.'
        }
        if (error.code === 'IDEMPOTENCY_CONFLICT') {
            return 'Запрос уже обрабатывался с другими данными. Создан новый ключ — повторите попытку.'
        }
        return error.message
    }
    return 'Попробуйте ещё раз.'
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
        if (leaf === 'name') {
            mapped.name = 'Укажите имя'
        } else if (leaf === 'email') {
            mapped.email = 'Укажите корректный email'
        } else if (leaf === 'phone') {
            mapped.phone = 'Телефон в формате + и 10–15 цифр'
        } else if (leaf === 'pickupPointId') {
            mapped.pickupPointId = 'Выберите пункт выдачи'
        } else if (leaf === 'city') {
            mapped.city = 'Укажите город'
        } else if (leaf === 'street') {
            mapped.street = 'Укажите улицу'
        } else if (leaf === 'house') {
            mapped.house = 'Укажите дом'
        }
    }
    return Object.keys(mapped).length > 0 ? mapped : null
}
