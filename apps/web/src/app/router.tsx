/**
 * Маршруты. `orders/:orderId/pay` объявлен раньше `orders/:orderId`, иначе pay съест параметр.
 */
import { createBrowserRouter } from 'react-router'
import { App } from '@/app/App'
import { CartPage } from '@/pages/cart-page'
import { CatalogPage } from '@/pages/catalog-page'
import { CheckoutPage } from '@/pages/checkout-page'
import { NotFoundPage } from '@/pages/not-found-page'
import { OrderPage } from '@/pages/order-page'
import { PaymentPage } from '@/pages/payment-page'
import { RouteError } from '@/shared/ui/error-boundary'

/**
 * errorElement — RouteError (reload). Падение рендера страницы ловит ErrorBoundary в App.
 */
export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        errorElement: <RouteError />,
        children: [
            { index: true, element: <CatalogPage /> },
            { path: 'cart', element: <CartPage /> },
            { path: 'checkout', element: <CheckoutPage /> },
            { path: 'orders/:orderId/pay', element: <PaymentPage /> },
            { path: 'orders/:orderId', element: <OrderPage /> },
            { path: '*', element: <NotFoundPage /> },
        ],
    },
])
