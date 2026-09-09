/**
 * Типы ошибок API, type guard и единый перевод в тексты для UI.
 * Страницы не маппят коды сами: берут toUserMessage / toErrorTitle / getErrorCode.
 */
/** Одно поле с ошибкой валидации: путь поля и сообщение. */
export interface ApiErrorField {
    path: string
    message: string
}

/** Нормализованная ошибка API клиента. */
export interface ApiError {
    name: 'ApiError'
    message: string
    code: string
    status: number
    fields?: ApiErrorField[]
    requestId?: string
}

/** Понятные заголовок и текст для известных кодов API. */
const ERROR_COPY: Record<string, { title: string; message: string }> = {
    CART_VERSION_CONFLICT: {
        title: 'Корзина изменилась',
        message: 'Обновите корзину и продолжите оформление.',
    },
    QUOTE_EXPIRED: {
        title: 'Расчёт устарел',
        message: 'Создайте новый расчёт с той же доставкой.',
    },
    CART_EMPTY: {
        title: 'Корзина пуста',
        message: 'Вернитесь в корзину и добавьте товары.',
    },
    IDEMPOTENCY_CONFLICT: {
        title: 'Конфликт повтора',
        message: 'Запрос уже обрабатывался с другими данными. Создан новый ключ — повторите попытку.',
    },
}

/**
 * Проверяет, является ли значение нормализованной ошибкой ApiError.
 * @param value Произвольное значение для проверки.
 * @returns True, если значение похоже на ApiError.
 */
export function isApiError(value: unknown): value is ApiError {
    if (typeof value !== 'object' || value === null) {
        return false
    }
    const candidate = value as Record<string, unknown>
    return (
        candidate.name === 'ApiError' &&
        typeof candidate.message === 'string' &&
        typeof candidate.code === 'string' &&
        typeof candidate.status === 'number'
    )
}

/**
 * Достаёт код ошибки API или null, если это не ApiError.
 * @param error Произвольная ошибка запроса.
 */
export function getErrorCode(error: unknown): string | null {
    return isApiError(error) ? error.code : null
}

/**
 * Проверяет, что ошибка — невалидная или отсутствующая сессия (нужен повтор с новым токеном).
 * @param error Произвольная ошибка запроса.
 */
export function isInvalidSessionError(error: unknown): boolean {
    return (
        isApiError(error) &&
        error.status === 401 &&
        (error.code === 'SESSION_REQUIRED' || error.code === 'SESSION_INVALID')
    )
}

/**
 * Проверяет, что ресурс не найден.
 * @param error Произвольная ошибка запроса.
 */
export function isNotFoundError(error: unknown): boolean {
    return isApiError(error) && error.status === 404
}

function getErrorCopy(error: unknown): { title: string; message: string } | undefined {
    const code = getErrorCode(error)
    return code ? ERROR_COPY[code] : undefined
}

/**
 * Переводит ошибку в одно сообщение для алерта: известный код, иначе текст API, иначе fallback.
 * @param error Произвольная ошибка запроса.
 * @param fallback Текст, если это не ApiError.
 */
export function toUserMessage(error: unknown, fallback = 'Попробуйте ещё раз.'): string {
    const copy = getErrorCopy(error)
    if (copy) {
        return `${copy.title}. ${copy.message}`
    }
    if (isApiError(error)) {
        return error.message
    }
    return fallback
}

/**
 * Короткий заголовок алерта для известного кода или запасной заголовок.
 * @param error Произвольная ошибка запроса.
 * @param fallback Заголовок, если код неизвестен.
 */
export function toErrorTitle(error: unknown, fallback: string): string {
    return getErrorCopy(error)?.title ?? fallback
}

/**
 * Текст описания алерта: для известного кода — пояснение без заголовка, иначе toUserMessage.
 * @param error Произвольная ошибка запроса.
 * @param fallback Текст, если это не ApiError и код неизвестен.
 */
export function toErrorDescription(error: unknown, fallback = 'Попробуйте ещё раз.'): string {
    return getErrorCopy(error)?.message ?? toUserMessage(error, fallback)
}
