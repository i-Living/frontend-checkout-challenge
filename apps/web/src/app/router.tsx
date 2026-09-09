import { createBrowserRouter } from 'react-router'
import { CartPage } from '@/pages/cart-page'
import { CatalogPage } from '@/pages/catalog-page'
import { CheckoutPage } from '@/pages/checkout-page'
import { OrderPage } from '@/pages/order-page'
import { PaymentPage } from '@/pages/payment-page'
import { App } from './App'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
        children: [
            { index: true, element: <CatalogPage /> },
            { path: 'cart', element: <CartPage /> },
            { path: 'checkout', element: <CheckoutPage /> },
            { path: 'orders/:orderId/pay', element: <PaymentPage /> },
            { path: 'orders/:orderId', element: <OrderPage /> },
        ],
    },
])
