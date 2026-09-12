/**
 * Маршруты SPA. Страницы, Link и роутер не собирают пути строками.
 * `order` / `payment` — шаблоны для роутера; `orderRoute` / `paymentRoute` — URL через generatePath.
 */
import { generatePath } from 'react-router'

export const routes = {
    catalog: '/',
    cart: '/cart',
    checkout: '/checkout',
    order: '/orders/:orderId',
    /** @param orderId UUID заказа из API, не номер чека. */
    orderRoute: (orderId: string) => generatePath(routes.order, { orderId }),
    payment: '/orders/:orderId/pay',
    /**
     * В роутере `payment` объявлен раньше `order`, иначе pay съест параметр.
     * @param orderId UUID заказа.
     */
    paymentRoute: (orderId: string) => generatePath(routes.payment, { orderId }),
    notFound: '*',
} as const
