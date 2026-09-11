/**
 * Хуки Query. Страницы не задают queryKey/queryFn — только читают data/status.
 * Мутации живут в features/*: у них своя инвалидация.
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
 * Корзина текущей сессии. Пустой массив items — валидный ответ, не ошибка.
 */
export function useCart(): UseQueryResult<Cart> {
    return useQuery({
        queryKey: keys.cart,
        queryFn: ({ signal }) => getCart(signal),
    })
}

/**
 * Каталог без токена. stock=0 рисуется как «нет в наличии», не как ошибка загрузки.
 */
export function useProducts(): UseQueryResult<ProductList> {
    return useQuery({
        queryKey: keys.products,
        queryFn: ({ signal }) => listProducts(signal),
    })
}

/**
 * Подписи доставки/оплаты и пункты выдачи. Не хардкодить title на клиенте.
 * @param staleTime На сводке заказа передаём 60s, чтобы не дёргать опции на каждом заходе.
 */
export function useCheckoutOptions(staleTime?: number): UseQueryResult<CheckoutOptions> {
    return useQuery({
        queryKey: keys.checkoutOptions,
        queryFn: ({ signal }) => getCheckoutOptions(signal),
        staleTime,
    })
}

/**
 * Заказ с сервера — источник истины для успеха. 201 создания заказа успехом не считается.
 * @param orderId Из маршрута; без него запрос выключен (enabled).
 * @param refetchInterval Пока awaiting_payment + pending — опрос; иначе false.
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
 * Список заказов сессии. Нужен, когда orderId нет в URL и в сторе — берём последний.
 * @param enabled На /pay без id; на обычной странице заказа не дергать.
 */
export function useOrdersList(enabled = true): UseQueryResult<OrderList> {
    return useQuery({
        queryKey: keys.ordersList,
        queryFn: ({ signal }) => listOrders(signal),
        enabled,
    })
}

/**
 * Попытки заказа, новые первыми. Resume: pending/processing из этого списка.
 * @param orderId Из маршрута.
 * @param enabled false для наличного заказа — онлайн-оплата не нужна.
 */
export function usePayments(orderId: string | undefined, enabled = true): UseQueryResult<PaymentList> {
    return useQuery({
        queryKey: keys.payments(orderId),
        queryFn: ({ signal }) => listPayments(orThrow(orderId, 'orderId'), signal),
        enabled: Boolean(orderId) && enabled,
    })
}

/**
 * Тестовые карты: title + маска, без PAN/CVC. Сценарий карты уходит в createSimulation.
 * @param enabled false, пока заказ не card — sandbox на наличных не грузим.
 */
export function useSandbox(enabled = true): UseQueryResult<Sandbox> {
    return useQuery({
        queryKey: keys.sandbox,
        queryFn: ({ signal }) => getSandbox(signal),
        enabled,
    })
}
