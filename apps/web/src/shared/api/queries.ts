/**
 * Хуки TanStack Query поверх эндпоинтов.
 * Страницы не задают queryKey/queryFn — только читают данные.
 */
import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import { orThrow } from '@/shared/lib/assert'
import {
    type Cart,
    type CheckoutOptions,
    getCart,
    getCheckoutOptions,
    getOrder,
    getSandbox,
    listOrders,
    listPayments,
    listProducts,
    type Order,
    type OrderList,
    type PaymentList,
    type ProductList,
    type Sandbox,
} from './endpoints'
import { keys } from './query-keys'

/**
 * Корзина текущей сессии.
 */
export function useCart(): UseQueryResult<Cart> {
    return useQuery({
        queryKey: keys.cart,
        queryFn: ({ signal }) => getCart(signal),
    })
}

/**
 * Каталог товаров.
 */
export function useProducts(): UseQueryResult<ProductList> {
    return useQuery({
        queryKey: keys.products,
        queryFn: ({ signal }) => listProducts(signal),
    })
}

/**
 * Опции доставки и оплаты.
 * @param staleTime Переопределение свежести кэша (например сводка заказа).
 */
export function useCheckoutOptions(staleTime?: number): UseQueryResult<CheckoutOptions> {
    return useQuery({
        queryKey: keys.checkoutOptions,
        queryFn: ({ signal }) => getCheckoutOptions(signal),
        staleTime,
    })
}

/**
 * Заказ по id из маршрута.
 * @param orderId Идентификатор заказа или пусто, пока маршрута нет.
 * @param refetchInterval Интервал опроса, пока заказ в промежуточном статусе.
 */
export function useOrder(
    orderId: string | undefined,
    refetchInterval?: (order: Order | undefined) => number | false,
): UseQueryResult<Order> {
    return useQuery({
        queryKey: keys.order(orderId),
        queryFn: ({ signal }) => getOrder(orThrow(orderId, 'orderId'), signal),
        enabled: Boolean(orderId),
        refetchInterval: refetchInterval ? (query) => refetchInterval(query.state.data) : false,
    })
}

/**
 * Список заказов сессии (восстановление потерянного orderId).
 * @param enabled Выполнять ли запрос.
 */
export function useOrdersList(enabled = true): UseQueryResult<OrderList> {
    return useQuery({
        queryKey: keys.ordersList,
        queryFn: ({ signal }) => listOrders(signal),
        enabled,
    })
}

/**
 * Попытки оплаты заказа.
 * @param orderId Идентификатор заказа.
 * @param enabled Выполнять ли запрос.
 */
export function usePayments(orderId: string | undefined, enabled = true): UseQueryResult<PaymentList> {
    return useQuery({
        queryKey: keys.payments(orderId),
        queryFn: ({ signal }) => listPayments(orThrow(orderId, 'orderId'), signal),
        enabled: Boolean(orderId) && enabled,
    })
}

/**
 * Тестовые карты песочницы.
 * @param enabled Выполнять ли запрос.
 */
export function useSandbox(enabled = true): UseQueryResult<Sandbox> {
    return useQuery({
        queryKey: keys.sandbox,
        queryFn: ({ signal }) => getSandbox(signal),
        enabled,
    })
}
