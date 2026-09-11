/**
 * Нормализация ошибок API и тексты UI. Страницы не свитчат по `code` —
 * берут toUserMessage / toErrorTitle / getErrorCode.
 */
/** Поле VALIDATION_ERROR. `message` сервера технический; в форму идут FIELD_MESSAGES. */
export interface ApiErrorField {
    path: string
    message: string
}

/** То, что бросает client.ts. Обычный Error / сеть без `name: 'ApiError'` сюда не проходит. */
export interface ApiError {
    name: 'ApiError'
    message: string
    code: string
    status: number
    fields?: ApiErrorField[]
    requestId?: string
}

/** Коды, где серверный message слишком общий — подменяем парой заголовок + что делать дальше. */
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
 * Duck-type: instanceof не сработает, ошибка собрана литералом, не `class`.
 * @param value catch/mutation.error.
 * @returns true только при name+message+code+status.
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
 * Для ветвления (CART_VERSION_CONFLICT, PAYMENT_FINALIZED). UI-текст — toUserMessage.
 * @param error catch/mutation.error.
 */
export function getErrorCode(error: unknown): string | null {
    return isApiError(error) ? error.code : null
}

/**
 * 401 SESSION_REQUIRED / SESSION_INVALID — не показывать алерт, а сменить токен и повторить.
 * Другие 401 сюда не входят.
 * @param error catch запроса с withAuth.
 */
export function isInvalidSessionError(error: unknown): boolean {
    return (
        isApiError(error) &&
        error.status === 401 &&
        (error.code === 'SESSION_REQUIRED' || error.code === 'SESSION_INVALID')
    )
}

/**
 * 404 для queryGate: кнопка «в каталог», а не «повторить».
 * @param error Результат запроса заказа/ресурса.
 */
export function isNotFoundError(error: unknown): boolean {
    return isApiError(error) && error.status === 404
}

function getErrorCopy(error: unknown): { title: string; message: string } | undefined {
    const code = getErrorCode(error)
    return code ? ERROR_COPY[code] : undefined
}

/**
 * Одна строка в алерт: известный код → «заголовок. пояснение», иначе message API, иначе fallback.
 * Сеть без ApiError всегда fallback — не показывать «Failed to fetch».
 * @param error catch/mutation.error.
 * @param fallback Текст для TypeError/AbortError.
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
 * Заголовок Alert. Для известного кода — короткий title из ERROR_COPY, без пояснения.
 * @param error catch запроса.
 * @param fallback Заголовок экрана («Не удалось создать заказ»), если кода нет в карте.
 */
export function toErrorTitle(error: unknown, fallback: string): string {
    return getErrorCopy(error)?.title ?? fallback
}

/**
 * Описание Alert, если заголовок уже выведен отдельно. Иначе совпадает с toUserMessage.
 * @param error catch запроса.
 * @param fallback Как у toUserMessage.
 */
export function toErrorDescription(error: unknown, fallback = 'Попробуйте ещё раз.'): string {
    return getErrorCopy(error)?.message ?? toUserMessage(error, fallback)
}
