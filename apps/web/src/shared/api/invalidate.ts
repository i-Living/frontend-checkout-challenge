/**
 * Сброс кэша по сущности. Страницы не вызывают invalidateQueries с сырым массивом —
 * иначе разъедется с query-keys.ts.
 */
import type { QueryClient } from '@tanstack/react-query'
import { keys } from './query-keys'

/**
 * Только корзина. Каталог не трогает: после удаления позиции остаток в карточке устареет.
 * @param queryClient Кэш приложения, не тестовый, если зовём из страницы.
 */
export function invalidateCart(queryClient: QueryClient): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: keys.cart })
}

/**
 * Только каталог. Один не вызывать после смены корзины — см. invalidateCartAndProducts.
 * @param queryClient Кэш Query.
 */
export function invalidateProducts(queryClient: QueryClient): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: keys.products })
}

/**
 * Корзина и каталог вместе: карточки показывают остаток, он зависит от состава корзины.
 * @param queryClient Кэш Query.
 */
export async function invalidateCartAndProducts(queryClient: QueryClient): Promise<void> {
    await Promise.all([invalidateCart(queryClient), invalidateProducts(queryClient)])
}

/**
 * Все расчёты: `keys.quote()` без id — префикс, не один UUID.
 * @param queryClient Кэш Query.
 */
export function invalidateQuotes(queryClient: QueryClient): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: keys.quote() })
}

/**
 * Один заказ. После терминальной оплаты, чтобы страница успеха не показала старый awaiting_payment.
 * @param queryClient Кэш Query.
 * @param orderId UUID заказа из маршрута.
 */
export function invalidateOrder(queryClient: QueryClient, orderId: string): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: keys.order(orderId) })
}

/**
 * Список попыток заказа — resume pending/processing после F5.
 * @param queryClient Кэш Query.
 * @param orderId UUID заказа, не платежа.
 */
export function invalidatePayments(queryClient: QueryClient, orderId: string): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: keys.payments(orderId) })
}

/**
 * Одна попытка — чтобы поллинг подхватил новый status.
 * @param queryClient Кэш Query.
 * @param paymentId UUID платежа.
 */
export function invalidatePayment(queryClient: QueryClient, paymentId: string): Promise<void> {
    return queryClient.invalidateQueries({ queryKey: keys.payment(paymentId) })
}

/**
 * Заказ и его попытки после succeeded/failed/cancelled или ORDER_ALREADY_PAID.
 * @param queryClient Кэш Query.
 * @param orderId UUID заказа.
 */
export async function invalidateOrderAndPayments(queryClient: QueryClient, orderId: string): Promise<void> {
    await Promise.all([invalidateOrder(queryClient, orderId), invalidatePayments(queryClient, orderId)])
}
