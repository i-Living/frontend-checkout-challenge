/**
 * Ключи кэша TanStack Query для сущностей API.
 * Фабрики принимают id для детализации ключа отдельной сущности.
 */
/** Единые ключи запросов: сессия, каталог, корзина, расчёты, заказы и платежи. */
export const keys = {
    /** Ключ списка заказов (восстановление после потери orderId). */
    ordersList: ['orders'],
    /** Ключ списка товаров. */
    products: ['products'],
    /** Ключ корзины. */
    cart: ['cart'],
    /** Ключ опций checkout. */
    checkoutOptions: ['checkout-options'],
    /** Ключ расчёта: общий или по id. */
    quote: (id?: string) => (id ? ['quote', id] : ['quote']),
    /** Ключ расчёта по версии корзины и хэшу доставки (защита от поздних ответов). */
    quoteByVersion: (version: number, deliveryHash: string) => ['quote', version, deliveryHash],
    /** Ключ песочницы. */
    sandbox: ['sandbox'],
    /** Ключ заказа: общий или по id. */
    order: (id?: string) => (id ? ['order', id] : ['order']),
    /** Ключ платежей заказа: общий или по orderId. */
    payments: (orderId?: string) => (orderId ? ['payments', orderId] : ['payments']),
    /** Ключ платежа: общий или по id. */
    payment: (id?: string) => (id ? ['payment', id] : ['payment']),
} as const
