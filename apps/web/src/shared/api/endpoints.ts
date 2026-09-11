/**
 * Типизированные эндпоинты поверх request. Типы — из OpenAPI, не ручные DTO.
 * Каталог и sandbox без токена; остальное — withSessionRetry (повтор на 401 SESSION_*).
 */
import { useSessionStore } from '@/shared/store/session-store'
import type { operations, paths } from './api-types'
import type { RequestOptions } from './client'
import {
    API_PATHS,
    cartItemPath,
    orderPath,
    orderPaymentsPath,
    parseRetryAfterMs,
    paymentPath,
    paymentSimulationsPath,
    quotePath,
    request,
    requestWithMeta,
} from './client'
import { isInvalidSessionError } from './errors'
import { ensureSession } from './session'

/** Прямой доступ к paths OpenAPI, если нужен литерал пути вне этого модуля. */
export type ApiPaths = paths

/** Список товаров из ответа каталога. */
export type ProductList = operations['listProducts']['responses'][200]['content']['application/json']['data']
/** Один товар каталога. */
export type Product = ProductList[number]
/** Корзина текущей сессии. */
export type Cart = operations['getCart']['responses'][200]['content']['application/json']['data']
/** Позиция корзины после установки количества. */
export type CartItem = operations['setCartItem']['responses'][200]['content']['application/json']['data']
/** Доступные опции доставки и оплаты. */
export type CheckoutOptions = operations['getCheckoutOptions']['responses'][200]['content']['application/json']['data']
/** Тело запроса создания расчёта. */
export type CreateQuoteBody = operations['createQuote']['requestBody']['content']['application/json']
/** Данные доставки для расчёта. */
export type CreateQuoteDelivery = CreateQuoteBody['delivery']
/** Расчёт с ценами, привязанный к версии корзины. */
export type Quote = operations['createQuote']['responses'][201]['content']['application/json']['data']
/** Тело запроса создания заказа. */
export type CreateOrderBody = operations['createOrder']['requestBody']['content']['application/json']
/** Заказ клиента. */
export type Order = operations['createOrder']['responses'][201]['content']['application/json']['data']
/** Список заказов сессии. */
export type OrderList = operations['listOrders']['responses'][200]['content']['application/json']['data']
/** Платёж заказа. */
export type Payment = operations['getPayment']['responses'][200]['content']['application/json']['data']
/** Список платежей заказа. */
export type PaymentList = operations['listPayments']['responses'][200]['content']['application/json']['data']
/** Симуляция исхода платежа: 200/201/202 имеют одну форму data. */
export type Simulation =
    | operations['createSimulation']['responses'][200]['content']['application/json']['data']
    | operations['createSimulation']['responses'][201]['content']['application/json']['data']
    | operations['createSimulation']['responses'][202]['content']['application/json']['data']
/** Результат запуска симуляции: данные и серверная пауза Retry-After. */
export interface SimulationResult {
    simulation: Simulation
    retryAfterMs: number | null
}
/** Сценарий симуляции платежа. */
export type SimulationScenario =
    operations['createSimulation']['requestBody']['content']['application/json']['scenario']
/** Данные песочницы: тестовые карты и сценарии. */
export type Sandbox = operations['getSandbox']['responses'][200]['content']['application/json']['data']

/**
 * Один повтор с новым токеном на SESSION_REQUIRED / SESSION_INVALID. Другие ошибки не ретраим.
 * @param run Запрос, который заново получит свежий token.
 */
async function withSessionRetry<T>(run: (token: string) => Promise<T>): Promise<T> {
    const token = await ensureSession()
    try {
        return await run(token)
    } catch (error) {
        if (!isInvalidSessionError(error)) {
            throw error
        }
        useSessionStore.getState().clearToken()
        const fresh = await ensureSession()
        return await run(fresh)
    }
}

/**
 * Авторизованный запрос. Токен подставляет ensureSession, страницы его не передают.
 * @param path Путь относительно API_BASE.
 * @param options Без поля token.
 * @returns Поле data.
 * @throws ApiError после возможного одного повтора на 401 сессии.
 */
async function withAuth<T>(path: string, options: Omit<RequestOptions, 'token'> = {}): Promise<T> {
    return withSessionRetry((token) => request<T>(path, { ...options, token }))
}

/**
 * Как withAuth, плюс заголовки. Нужен createSimulation (Retry-After).
 * @param path Путь относительно API_BASE.
 * @param options Без поля token.
 * @returns data и headers.
 * @throws ApiError после возможного одного повтора на 401 сессии.
 */
async function withAuthMeta<T>(
    path: string,
    options: Omit<RequestOptions, 'token'> = {},
): Promise<{ data: T; headers: Headers }> {
    return withSessionRetry((token) => requestWithMeta<T>(path, { ...options, token }))
}

/**
 * Каталог без Authorization. Не ходить в withAuth — лишний POST сессии.
 * @param signal Отмена Query.
 * @returns Список товаров.
 */
export function listProducts(signal?: AbortSignal): Promise<ProductList> {
    return request<ProductList>(API_PATHS.products, { signal })
}

/**
 * Корзина текущей сессии. Пустой items — норма, не 404.
 * @param signal Отмена Query.
 * @returns Корзина и version для quote.
 */
export function getCart(signal?: AbortSignal): Promise<Cart> {
    return withAuth<Cart>(API_PATHS.cart, { signal })
}

/**
 * Абсолютное количество: повтор PUT {quantity:1} не добавляет вторую штуку и не меняет version.
 * @param productId Id товара из каталога.
 * @param quantity Новое число, не дельта.
 * @param signal Отмена мутации.
 * @returns Обновлённая позиция.
 */
export function setCartItem(productId: string, quantity: number, signal?: AbortSignal): Promise<CartItem> {
    return withAuth<CartItem>(cartItemPath(productId), { method: 'PUT', body: { quantity }, signal })
}

/**
 * DELETE идемпотентен: повтор на уже удалённой позиции — 204, не ошибка.
 * @param productId Id товара.
 * @param signal Отмена мутации.
 */
export function removeCartItem(productId: string, signal?: AbortSignal): Promise<void> {
    return withAuth<void>(cartItemPath(productId), { method: 'DELETE', signal })
}

/**
 * Подписи и пункты выдачи с сервера. Title доставки/оплаты не хардкодить.
 * @param signal Отмена Query.
 * @returns Опции checkout.
 */
export function getCheckoutOptions(signal?: AbortSignal): Promise<CheckoutOptions> {
    return withAuth<CheckoutOptions>(API_PATHS.checkoutOptions, { signal })
}

/**
 * Расчёт привязан к cartVersion и живёт 10 минут. Смена корзины/доставки — новый POST, не патч.
 * @param cartVersion version из GET /api/cart.
 * @param delivery Самовывоз с пунктом или курьер с адресом.
 * @param signal Отмена Query; смена ключа abort'ит старый POST.
 * @returns Новый расчёт; суммы для UI только отсюда.
 */
export function createQuote(cartVersion: number, delivery: CreateQuoteDelivery, signal?: AbortSignal): Promise<Quote> {
    return withAuth<Quote>(API_PATHS.quotes, { method: 'POST', body: { cartVersion, delivery }, signal })
}

/**
 * Чтение сохранённого расчёта. На чекауте обычно хватает ответа createQuote.
 * @param id UUID расчёта.
 * @param signal Отмена Query.
 * @returns Расчёт.
 */
export function getQuote(id: string, signal?: AbortSignal): Promise<Quote> {
    return withAuth<Quote>(quotePath(id), { signal })
}

/**
 * Создание заказа. Повтор сети — тот же body и Idempotency-Key; новая попытка — новый ключ.
 * Успех 201 не значит «оплачено»: статус смотрим GET заказа.
 * @param body quoteId, способ оплаты, контакты.
 * @param key 8–128 символов `[A-Za-z0-9_-]`.
 * @param signal Отмена мутации.
 * @returns Созданный заказ; корзина на сервере после этого пустая.
 */
export function createOrder(body: CreateOrderBody, key: string, signal?: AbortSignal): Promise<Order> {
    return withAuth<Order>(API_PATHS.orders, { method: 'POST', body, idempotencyKey: key, signal })
}

/**
 * Заказы сессии, новые первыми. Нужен, если orderId потеряли после F5.
 * @param signal Отмена Query.
 * @returns Список заказов.
 */
export function listOrders(signal?: AbortSignal): Promise<OrderList> {
    return withAuth<OrderList>(API_PATHS.orders, { signal })
}

/**
 * Источник истины для страницы успеха. Не подменять 201 создания или succeeded платежа.
 * @param orderId UUID заказа.
 * @param signal Отмена Query.
 * @returns Заказ и paymentStatus.
 */
export function getOrder(orderId: string, signal?: AbortSignal): Promise<Order> {
    return withAuth<Order>(orderPath(orderId), { signal })
}

/**
 * Попытки заказа, новые первыми. Resume pending/processing после перезагрузки.
 * @param orderId UUID заказа.
 * @param signal Отмена Query.
 * @returns Список платежей заказа.
 */
export function listPayments(orderId: string, signal?: AbortSignal): Promise<PaymentList> {
    return withAuth<PaymentList>(orderPaymentsPath(orderId), { signal })
}

/**
 * Новая попытка. Тело всегда `{}`. Ключ как у заказа: повтор сети / новая попытка.
 * @param orderId UUID заказа.
 * @param key Idempotency-Key этой попытки.
 * @param signal Отмена мутации.
 * @returns Созданный платёж в pending.
 */
export function createPayment(orderId: string, key: string, signal?: AbortSignal): Promise<Payment> {
    return withAuth<Payment>(orderPaymentsPath(orderId), { method: 'POST', body: {}, idempotencyKey: key, signal })
}

/**
 * Чтение попытки для поллинга. Decline — HTTP 200 + status=failed, не throw.
 * @param paymentId UUID платежа.
 * @param signal Отмена Query; уход со страницы должен abort'ить.
 * @returns Платёж.
 */
export function getPayment(paymentId: string, signal?: AbortSignal): Promise<Payment> {
    return withAuth<Payment>(paymentPath(paymentId), { signal })
}

/**
 * Запуск сценария песочницы. Пауза опроса — Retry-After, не константа. Вторая симуляция с другим
 * scenario → 409 PAYMENT_FINALIZED.
 * @param paymentId UUID платежа.
 * @param scenario Сценарий выбранной тестовой карты или cancel.
 * @param signal Отмена мутации.
 * @returns Симуляция и retryAfterMs (null, если заголовка нет).
 */
export function createSimulation(
    paymentId: string,
    scenario: SimulationScenario,
    signal?: AbortSignal,
): Promise<SimulationResult> {
    return withAuthMeta<Simulation>(paymentSimulationsPath(paymentId), {
        method: 'POST',
        body: { scenario },
        signal,
    }).then(({ data, headers }) => ({ simulation: data, retryAfterMs: parseRetryAfterMs(headers) }))
}

/**
 * Тестовые карты без токена. В форму идут title и maskedNumber, не PAN/CVC.
 * @param signal Отмена Query.
 * @returns Карты и settlementDelayMs.
 */
export function getSandbox(signal?: AbortSignal): Promise<Sandbox> {
    return request<Sandbox>(API_PATHS.sandbox, { signal })
}
