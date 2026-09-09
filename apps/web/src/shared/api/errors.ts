/**
 * Типы ошибок API и type guard для их проверки.
 * Единый формат ошибки клиента: код, статус и поля валидации.
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
