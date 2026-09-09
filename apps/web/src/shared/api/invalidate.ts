/**
 * Инвалидация кэша Query по сущностям API.
 * Страницы и хуки не собирают queryKey вручную.
 */
import type { QueryClient } from '@tanstack/react-query'
import { keys } from './query-keys'

/**
 * Сбрасывает кэш корзины.
 * @param queryClient Клиент TanStack Query.
 */
export function invalidateCart(queryClient: QueryClient): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: keys.cart })
}

/**
 * Сбрасывает кэш каталога.
 * @param queryClient Клиент TanStack Query.
 */
export function invalidateProducts(queryClient: QueryClient): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: keys.products })
}

/**
 * Сбрасывает корзину и каталог вместе (остаток в карточках зависит от корзины).
 * @param queryClient Клиент TanStack Query.
 */
export async function invalidateCartAndProducts(queryClient: QueryClient): Promise<void> {
    await Promise.all([invalidateCart(queryClient), invalidateProducts(queryClient)])
}

/**
 * Сбрасывает кэш всех расчётов (префикс quote).
 * @param queryClient Клиент TanStack Query.
 */
export function invalidateQuotes(queryClient: QueryClient): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: keys.quote() })
}

/**
 * Сбрасывает заказ.
 * @param queryClient Клиент TanStack Query.
 * @param orderId Идентификатор заказа.
 */
export function invalidateOrder(queryClient: QueryClient, orderId: string): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: keys.order(orderId) })
}

/**
 * Сбрасывает список попыток оплаты заказа.
 * @param queryClient Клиент TanStack Query.
 * @param orderId Идентификатор заказа.
 */
export function invalidatePayments(queryClient: QueryClient, orderId: string): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: keys.payments(orderId) })
}

/**
 * Сбрасывает одну попытку оплаты.
 * @param queryClient Клиент TanStack Query.
 * @param paymentId Идентификатор платежа.
 */
export function invalidatePayment(queryClient: QueryClient, paymentId: string): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: keys.payment(paymentId) })
}

/**
 * Сбрасывает заказ и его попытки оплаты.
 * @param queryClient Клиент TanStack Query.
 * @param orderId Идентификатор заказа.
 */
export async function invalidateOrderAndPayments(queryClient: QueryClient, orderId: string): Promise<void> {
    await Promise.all([invalidateOrder(queryClient, orderId), invalidatePayments(queryClient, orderId)])
}
