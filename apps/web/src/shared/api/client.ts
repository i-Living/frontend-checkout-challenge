/**
 * Единственный HTTP-шов: base URL, Authorization, Idempotency-Key, JSON/204 → ApiError.
 * Страницы fetch не вызывают — новый запрос добавляется в endpoints.ts.
 */
import type { ApiError } from './errors'

/** `VITE_API_URL` из env фронта; в dev может быть пусто — тогда локальный API. */
const envUrl = import.meta.env.VITE_API_URL as string | undefined

/** Совпадает с дефолтом бэкенда `127.0.0.1:4000`. Другой порт — через VITE_API_URL, плюс CORS_ORIGINS на API. */
export const API_BASE: string = envUrl ?? 'http://127.0.0.1:4000'

/** Коллекции без id в пути. Позиции, заказы, платежи — через encodeURIComponent-билдеры ниже. */
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
 * PUT/DELETE позиции. Id кодируется: слэш в productId не должен стать новым сегментом пути.
 * @param productId Id товара из каталога, не индекс строки.
 * @returns `/api/cart/items/:id`
 */
export function cartItemPath(productId: string): string {
    return `/api/cart/items/${encodeURIComponent(productId)}`
}

/**
 * GET расчёта по id. POST живёт на API_PATHS.quotes.
 * @param quoteId UUID расчёта из POST /api/quotes.
 * @returns `/api/quotes/:id`
 */
export function quotePath(quoteId: string): string {
    return `/api/quotes/${encodeURIComponent(quoteId)}`
}

/**
 * GET одного заказа. Список и создание — API_PATHS.orders.
 * @param orderId UUID заказа.
 * @returns `/api/orders/:id`
 */
export function orderPath(orderId: string): string {
    return `/api/orders/${encodeURIComponent(orderId)}`
}

/**
 * GET списка попыток и POST новой попытки.
 * @param orderId UUID заказа, не платежа.
 * @returns `/api/orders/:id/payments`
 */
export function orderPaymentsPath(orderId: string): string {
    return `/api/orders/${encodeURIComponent(orderId)}/payments`
}

/**
 * GET одной попытки для поллинга. Не путать с коллекцией заказа.
 * @param paymentId UUID платежа.
 * @returns `/api/payments/:id`
 */
export function paymentPath(paymentId: string): string {
    return `/api/payments/${encodeURIComponent(paymentId)}`
}

/**
 * POST симуляции исхода. У попытки одна симуляция; другой scenario → 409 PAYMENT_FINALIZED.
 * @param paymentId UUID уже созданного платежа.
 * @returns `/api/payments/:id/simulations`
 */
export function paymentSimulationsPath(paymentId: string): string {
    return `/api/payments/${encodeURIComponent(paymentId)}/simulations`
}

/** `token` → Bearer; `idempotencyKey` только на POST заказа и платежа. cookies не используются. */
export interface RequestOptions {
    method?: string
    body?: unknown
    token?: string | null
    signal?: AbortSignal
    idempotencyKey?: string
}

/** Нужен, когда кроме `data` читаем Retry-After или Location (симуляция оплаты). */
export interface ResponseMeta<T> {
    data: T
    headers: Headers
}

/** Сырое тело ошибки до нормализации: поля могут отсутствовать или быть не строками. */
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
 * Кривой JSON не должен ронять клиент: недостающие поля → UNKNOWN_ERROR и запасной message.
 * @param json Тело ответа или undefined, если JSON сломан / тела нет.
 * @param status HTTP-статус; для UI важнее `code`, статус нужен 401/404-гвардам.
 * @param requestIdHeader X-Request-Id, если в meta его нет.
 * @returns ApiError с name: 'ApiError' — обычный Error так не выглядит.
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
 * Retry-After симуляции оплаты: секунды или HTTP-дата. Прошедшая дата и мусор → null.
 * @param headers Заголовки ответа createSimulation.
 * @returns Пауза опроса, зажатая в 250–10000 мс, чтобы не крутить раз в 0 мс и не ждать минуту.
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
 * fetch + разбор. 204 и пустое тело → `data: undefined`, `response.json()` не вызывается.
 * Content-Type ставится только если есть body — GET/DELETE без него.
 * @param path Путь относительно API_BASE, уже с закодированным id.
 * @param options Без `credentials: include`: токен в заголовке.
 * @returns `data` успешного JSON и сырые заголовки.
 * @throws ApiError на не-ok, битом JSON и сетевых ошибках после parse.
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
 * Как requestWithMeta, но без заголовков. Для симуляции нужен requestWithMeta (Retry-After).
 * @param path Путь относительно API_BASE.
 * @param options Те же, что у requestWithMeta.
 * @returns Только поле `data`.
 * @throws ApiError — тот же, что requestWithMeta.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { data } = await requestWithMeta<T>(path, options)
    return data
}
