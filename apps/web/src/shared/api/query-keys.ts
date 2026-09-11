/**
 * Ключи кэша Query. Страницы и хуки не собирают массивы вручную — иначе invalidate
 * и queryFn разъедутся. Фабрика без id — префикс (сброс всей группы), с id — одна сущность.
 */
/** Единые ключи запросов. `quoteByVersion` отдельно: поздний POST не должен затереть свежий расчёт. */
export const keys = {
    /** Список заказов сессии — восстановление orderId после F5, если его нет в сторе. */
    ordersList: ['orders'],
    /** Каталог; сбрасывается вместе с корзиной, потому что карточки показывают остаток. */
    products: ['products'],
    /** Корзина текущей сессии; версия отсюда нужна quote. */
    cart: ['cart'],
    /** Опции доставки и оплаты; редко меняются, на сводке заказа можно поднять staleTime. */
    checkoutOptions: ['checkout-options'],
    /** Без id — префикс всех расчётов (invalidateQuotes); с id — один quote. */
    quote: (id?: string) => (id ? ['quote', id] : ['quote']),
    /** Ключ POST quote: версия корзины + JSON доставки. Другой ключ = другой запрос, старый ответ не пишется в новый. */
    quoteByVersion: (version: number, deliveryHash: string) => ['quote', version, deliveryHash],
    /** Тестовые карты; без токена, кэш общий на сессию вкладки. */
    sandbox: ['sandbox'],
    /** Без id — префикс; с id — один заказ. Успех UI читает только этот ключ, не 201 создания. */
    order: (id?: string) => (id ? ['order', id] : ['order']),
    /** Попытки оплаты заказа; resume берёт pending/processing отсюда. */
    payments: (orderId?: string) => (orderId ? ['payments', orderId] : ['payments']),
    /** Одна попытка; поллинг смотрит status и останавливается на терминальном. */
    payment: (id?: string) => (id ? ['payment', id] : ['payment']),
} as const
