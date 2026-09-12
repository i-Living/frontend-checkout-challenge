/**
 * Маршруты. `routes.payment` объявлен раньше `routes.order`, иначе pay съест параметр.
 */
import { createBrowserRouter } from 'react-router'
import { App } from '@/app/App'
import { routes } from '@/app/routes'
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
        path: routes.catalog,
        element: <App />,
        errorElement: <RouteError />,
        children: [
            { index: true, element: <CatalogPage /> },
            { path: routes.cart, element: <CartPage /> },
            { path: routes.checkout, element: <CheckoutPage /> },
            { path: routes.payment, element: <PaymentPage /> },
            { path: routes.order, element: <OrderPage /> },
            { path: routes.notFound, element: <NotFoundPage /> },
        ],
    },
])
