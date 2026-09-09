/**
 * Базовый HTTP-клиент API: базовый URL, пути и обёртка над fetch.
 * Отвечает за заголовки, разбор JSON и маппинг ошибок в ApiError.
 */
import type { ApiError } from './errors'

/** Сырой базовый URL API из переменной окружения. */
const envUrl = import.meta.env.VITE_API_URL as string | undefined

/** Базовый URL API с запасным локальным значением. */
export const API_BASE: string = envUrl ?? 'http://127.0.0.1:4000'

/** Карта основных путей API. */
export const API_PATHS = {
    sessions: '/api/sessions',
    products: '/api/products',
    sandbox: '/api/sandbox',
    cart: '/api/cart',
    checkoutOptions: '/api/checkout/options',
    quotes: '/api/quotes',
    orders: '/api/orders',
} as const

/**
 * Строит путь позиции корзины по идентификатору товара.
 * @param productId Идентификатор товара.
 * @returns Путь вида /api/cart/items/:id.
 */
export function cartItemPath(productId: string): string {
    return `/api/cart/items/${encodeURIComponent(productId)}`
}

/**
 * Строит путь расчёта по его идентификатору.
 * @param quoteId Идентификатор расчёта.
 * @returns Путь вида /api/quotes/:id.
 */
export function quotePath(quoteId: string): string {
    return `/api/quotes/${encodeURIComponent(quoteId)}`
}

/**
 * Строит путь заказа по его идентификатору.
 * @param orderId Идентификатор заказа.
 * @returns Путь вида /api/orders/:id.
 */
export function orderPath(orderId: string): string {
    return `/api/orders/${encodeURIComponent(orderId)}`
}

/**
 * Строит путь платежей заказа.
 * @param orderId Идентификатор заказа.
 * @returns Путь коллекции платежей заказа.
 */
export function orderPaymentsPath(orderId: string): string {
    return `/api/orders/${encodeURIComponent(orderId)}/payments`
}

/**
 * Строит путь платежа по его идентификатору.
 * @param paymentId Идентификатор платежа.
 * @returns Путь вида /api/payments/:id.
 */
export function paymentPath(paymentId: string): string {
    return `/api/payments/${encodeURIComponent(paymentId)}`
}

/**
 * Строит путь симуляций платежа.
 * @param paymentId Идентификатор платежа.
 * @returns Путь запуска симуляций платежа.
 */
export function paymentSimulationsPath(paymentId: string): string {
    return `/api/payments/${encodeURIComponent(paymentId)}/simulations`
}

/** Параметры HTTP-запроса: метод, тело, токен, отмена и ключ идемпотентности. */
export interface RequestOptions {
    method?: string
    body?: unknown
    token?: string | null
    signal?: AbortSignal
    idempotencyKey?: string
}

/** Ответ с заголовками: данные и сырые заголовки ответа. */
export interface ResponseMeta<T> {
    data: T
    headers: Headers
}

/** Сырая форма тела ошибки сервера до нормализации. */
interface ErrorPayload {
    error?: {
        code?: unknown
        message?: unknown
        fields?: unknown
    }
    meta?: {
        requestId?: unknown
    }
}

/**
 * Нормализует сырой ответ с ошибкой в ApiError.
 * @param json Распарсенное тело ответа или пустое значение.
 * @param status HTTP-статус ответа.
 * @param requestIdHeader Значение заголовка X-Request-Id, если есть.
 * @returns Нормализованная ошибка ApiError.
 */
function toApiError(json: unknown, status: number, requestIdHeader?: string): ApiError {
    const payload = (typeof json === 'object' && json !== null ? json : {}) as ErrorPayload
    const rawError = payload.error ?? {}
    const code = typeof rawError.code === 'string' && rawError.code ? rawError.code : 'UNKNOWN_ERROR'
    const message =
        typeof rawError.message === 'string' && rawError.message
            ? rawError.message
            : `Request failed with status ${status}`
    const metaRequestId = payload.meta?.requestId
    const requestId =
        typeof metaRequestId === 'string' && metaRequestId ? metaRequestId : (requestIdHeader ?? undefined)
    const fields = Array.isArray(rawError.fields)
        ? rawError.fields
              .filter(
                  (item): item is { path: string; message: string } =>
                      typeof item === 'object' &&
                      item !== null &&
                      typeof (item as Record<string, unknown>).path === 'string' &&
                      typeof (item as Record<string, unknown>).message === 'string',
              )
              .map((item) => ({ path: item.path, message: item.message }))
        : undefined
    return {
        name: 'ApiError',
        message,
        code,
        status,
        ...(fields ? { fields } : {}),
        ...(requestId ? { requestId } : {}),
    }
}

/**
 * Разбирает заголовок Retry-After (секунды или HTTP-дата) в миллисекунды.
 * Возвращает null, если заголовка нет или значение некорректно.
 * @param headers Заголовки ответа.
 * @returns Пауза в миллисекундах, ограниченная 250–10000 мс.
 */
export function parseRetryAfterMs(headers: Headers): number | null {
    const raw = headers.get('Retry-After')
    if (!raw) {
        return null
    }
    const seconds = Number(raw)
    if (Number.isFinite(seconds) && seconds >= 0) {
        return Math.min(10_000, Math.max(250, seconds * 1000))
    }
    const date = Date.parse(raw)
    if (!Number.isNaN(date)) {
        const diff = date - Date.now()
        if (diff > 0) {
            return Math.min(10_000, Math.max(250, diff))
        }
    }
    return null
}

/**
 * Выполняет запрос к API и возвращает поле data вместе с заголовками ответа.
 * Пустой ответ и 204 возвращает как undefined.
 * @param path Путь запроса относительно API_BASE.
 * @param options Метод, тело, токен, сигнал отмены и ключ идемпотентности.
 * @returns Поле data успешного ответа и заголовки.
 * @throws ApiError при невалидном JSON или неуспешном статусе.
 */
export async function requestWithMeta<T>(path: string, options: RequestOptions = {}): Promise<ResponseMeta<T>> {
    const { method = 'GET', body, token, signal, idempotencyKey } = options
    const headers: Record<string, string> = {}
    if (body !== undefined) {
        headers['Content-Type'] = 'application/json'
    }
    if (token) {
        headers.Authorization = `Bearer ${token}`
    }
    if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey
    }
    const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
    })
    const requestIdHeader = response.headers.get('X-Request-Id') ?? undefined
    if (response.status === 204) {
        return { data: undefined as T, headers: response.headers }
    }
    const text = await response.text()
    if (!text) {
        return { data: undefined as T, headers: response.headers }
    }
    let json: unknown
    try {
        json = JSON.parse(text) as unknown
    } catch {
        throw toApiError(undefined, response.status, requestIdHeader)
    }
    if (!response.ok) {
        throw toApiError(json, response.status, requestIdHeader)
    }
    return { data: (json as { data: T }).data, headers: response.headers }
}

/**
 * Выполняет запрос к API и возвращает поле data из ответа.
 * Пустой ответ и 204 возвращает как undefined.
 * @param path Путь запроса относительно API_BASE.
 * @param options Метод, тело, токен, сигнал отмены и ключ идемпотентности.
 * @returns Поле data успешного ответа.
 * @throws ApiError при невалидном JSON или неуспешном статусе.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { data } = await requestWithMeta<T>(path, options)
    return data
}
