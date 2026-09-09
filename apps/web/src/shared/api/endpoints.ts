/**
 * Типизированные эндпоинты API поверх request с авторизацией по сессии.
 * Содержит типы данных и функции запросов каталога, корзины, расчётов, заказов и платежей.
 */
import { useSessionStore } from '@/shared/store/session-store'
import type { operations, paths } from './api-types'
import type { RequestOptions } from './client'
import {
    API_PATHS,
    cartItemPath,
    orderPath,
    orderPaymentsPath,
    paymentPath,
    paymentSimulationsPath,
    quotePath,
    request,
} from './client'
import { isApiError } from './errors'
import { ensureSession } from './session'

/** Прямой доступ к типам путей OpenAPI. */
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
/** Симуляция исхода платежа в песочнице. */
export type Simulation = operations['createSimulation']['responses'][202]['content']['application/json']['data']
/** Сценарий симуляции платежа. */
export type SimulationScenario =
    operations['createSimulation']['requestBody']['content']['application/json']['scenario']
/** Данные песочницы: тестовые карты и сценарии. */
export type Sandbox = operations['getSandbox']['responses'][200]['content']['application/json']['data']

/**
 * Выполняет запрос с токеном сессии и повторяет его после 401 с новой сессией.
 * @param path Путь запроса относительно API_BASE.
 * @param options Параметры запроса без токена.
 * @returns Поле data успешного ответа.
 * @throws ApiError при неуспешном статусе после повтора.
 */
async function withAuth<T>(path: string, options: Omit<RequestOptions, 'token'> = {}): Promise<T> {
    const token = await ensureSession()
    try {
        return await request<T>(path, { ...options, token })
    } catch (error) {
        if (
            isApiError(error) &&
            error.status === 401 &&
            (error.code === 'SESSION_REQUIRED' || error.code === 'SESSION_INVALID')
        ) {
            useSessionStore.getState().clearToken()
            const fresh = await ensureSession()
            return await request<T>(path, { ...options, token: fresh })
        }
        throw error
    }
}

/**
 * Загружает список товаров каталога.
 * @param signal Сигнал отмены запроса.
 * @returns Список товаров.
 */
export function listProducts(signal?: AbortSignal): Promise<ProductList> {
    return request<ProductList>(API_PATHS.products, { signal })
}

/**
 * Загружает корзину текущей сессии.
 * @param signal Сигнал отмены запроса.
 * @returns Корзина сессии.
 */
export function getCart(signal?: AbortSignal): Promise<Cart> {
    return withAuth<Cart>(API_PATHS.cart, { signal })
}

/**
 * Устанавливает абсолютное количество товара в корзине.
 * @param productId Идентификатор товара.
 * @param quantity Новое абсолютное количество.
 * @param signal Сигнал отмены запроса.
 * @returns Обновлённая позиция корзины.
 */
export function setCartItem(productId: string, quantity: number, signal?: AbortSignal): Promise<CartItem> {
    return withAuth<CartItem>(cartItemPath(productId), { method: 'PUT', body: { quantity }, signal })
}

/**
 * Удаляет товар из корзины.
 * @param productId Идентификатор товара.
 * @param signal Сигнал отмены запроса.
 */
export function removeCartItem(productId: string, signal?: AbortSignal): Promise<void> {
    return withAuth<void>(cartItemPath(productId), { method: 'DELETE', signal })
}

/**
 * Загружает доступные опции доставки и оплаты.
 * @param signal Сигнал отмены запроса.
 * @returns Опции checkout.
 */
export function getCheckoutOptions(signal?: AbortSignal): Promise<CheckoutOptions> {
    return withAuth<CheckoutOptions>(API_PATHS.checkoutOptions, { signal })
}

/**
 * Создаёт расчёт с ценами для версии корзины.
 * @param cartVersion Версия корзины для привязки расчёта.
 * @param delivery Данные доставки.
 * @param signal Сигнал отмены запроса.
 * @returns Новый расчёт.
 */
export function createQuote(cartVersion: number, delivery: CreateQuoteDelivery, signal?: AbortSignal): Promise<Quote> {
    return withAuth<Quote>(API_PATHS.quotes, { method: 'POST', body: { cartVersion, delivery }, signal })
}

/**
 * Загружает расчёт по идентификатору.
 * @param id Идентификатор расчёта.
 * @param signal Сигнал отмены запроса.
 * @returns Расчёт.
 */
export function getQuote(id: string, signal?: AbortSignal): Promise<Quote> {
    return withAuth<Quote>(quotePath(id), { signal })
}

/**
 * Создаёт заказ с ключом идемпотентности.
 * @param body Тело заказа с расчётом и контактами.
 * @param key Ключ идемпотентности для безопасного ретрая.
 * @param signal Сигнал отмены запроса.
 * @returns Созданный заказ.
 */
export function createOrder(body: CreateOrderBody, key: string, signal?: AbortSignal): Promise<Order> {
    return withAuth<Order>(API_PATHS.orders, { method: 'POST', body, idempotencyKey: key, signal })
}

/**
 * Загружает список заказов сессии.
 * @param signal Сигнал отмены запроса.
 * @returns Список заказов.
 */
export function listOrders(signal?: AbortSignal): Promise<OrderList> {
    return withAuth<OrderList>(API_PATHS.orders, { signal })
}

/**
 * Загружает заказ по идентификатору.
 * @param orderId Идентификатор заказа.
 * @param signal Сигнал отмены запроса.
 * @returns Заказ.
 */
export function getOrder(orderId: string, signal?: AbortSignal): Promise<Order> {
    return withAuth<Order>(orderPath(orderId), { signal })
}

/**
 * Загружает платежи заказа.
 * @param orderId Идентификатор заказа.
 * @param signal Сигнал отмены запроса.
 * @returns Список платежей заказа.
 */
export function listPayments(orderId: string, signal?: AbortSignal): Promise<PaymentList> {
    return withAuth<PaymentList>(orderPaymentsPath(orderId), { signal })
}

/**
 * Создаёт платёж по заказу с ключом идемпотентности.
 * @param orderId Идентификатор заказа.
 * @param key Ключ идемпотентности для безопасного ретрая.
 * @param signal Сигнал отмены запроса.
 * @returns Созданный платёж.
 */
export function createPayment(orderId: string, key: string, signal?: AbortSignal): Promise<Payment> {
    return withAuth<Payment>(orderPaymentsPath(orderId), { method: 'POST', body: {}, idempotencyKey: key, signal })
}

/**
 * Загружает платёж по идентификатору для опроса статуса.
 * @param paymentId Идентификатор платежа.
 * @param signal Сигнал отмены запроса.
 * @returns Платёж.
 */
export function getPayment(paymentId: string, signal?: AbortSignal): Promise<Payment> {
    return withAuth<Payment>(paymentPath(paymentId), { signal })
}

/**
 * Запускает симуляцию исхода платежа в песочнице.
 * @param paymentId Идентификатор платежа.
 * @param scenario Сценарий симуляции.
 * @param signal Сигнал отмены запроса.
 * @returns Созданная симуляция.
 */
export function createSimulation(
    paymentId: string,
    scenario: SimulationScenario,
    signal?: AbortSignal,
): Promise<Simulation> {
    return withAuth<Simulation>(paymentSimulationsPath(paymentId), {
        method: 'POST',
        body: { scenario },
        signal,
    })
}

/**
 * Загружает данные песочницы: тестовые карты и сценарии.
 * @param signal Сигнал отмены запроса.
 * @returns Данные песочницы.
 */
export function getSandbox(signal?: AbortSignal): Promise<Sandbox> {
    return request<Sandbox>(API_PATHS.sandbox, { signal })
}
