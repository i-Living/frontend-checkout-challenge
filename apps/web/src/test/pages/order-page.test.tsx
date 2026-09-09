import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OrderPage } from '@/pages/order-page'
import { getCheckoutOptions, getOrder } from '@/shared/api/endpoints'
import { makeApiError, makeCheckoutOptions, makeOrder } from '@/test/fixtures'
import { renderApp } from '@/test/render'

vi.mock('@/shared/api/endpoints', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/api/endpoints')>()
    return { ...actual, getOrder: vi.fn(), getCheckoutOptions: vi.fn() }
})

const getOrderMock = vi.mocked(getOrder)
const getCheckoutOptionsMock = vi.mocked(getCheckoutOptions)

function renderOrderPage() {
    return renderApp(
        <Routes>
            <Route element={<OrderPage />} path='/orders/:orderId' />
        </Routes>,
        { route: '/orders/order-1' },
    )
}

describe('OrderPage', () => {
    beforeEach(() => {
        getCheckoutOptionsMock.mockResolvedValue(makeCheckoutOptions())
    })

    it('показывает успех карты только по paid + succeeded с сервера', async () => {
        getOrderMock.mockResolvedValue(
            makeOrder({ status: 'paid', paymentStatus: 'succeeded', paymentMethod: 'card', number: 'A-1001' }),
        )
        renderOrderPage()
        expect(await screen.findByRole('heading', { name: 'Заказ оплачен' })).toBeInTheDocument()
        expect(screen.getByText('Заказ A-1001')).toBeInTheDocument()
        expect(screen.getByText('Лампа Orbit × 1')).toBeInTheDocument()
    })

    it('показывает наличные как оформленные без онлайн-оплаты', async () => {
        getOrderMock.mockResolvedValue(
            makeOrder({
                status: 'confirmed',
                paymentStatus: 'unpaid',
                paymentMethod: 'cash_on_delivery',
            }),
        )
        renderOrderPage()
        expect(await screen.findByRole('heading', { name: 'Заказ оформлен, оплата при получении' })).toBeInTheDocument()
    })

    it('не считает awaiting_payment успехом', async () => {
        getOrderMock.mockResolvedValue(makeOrder({ status: 'awaiting_payment', paymentStatus: 'pending' }))
        renderOrderPage()
        expect(await screen.findByText('Оплата ещё обрабатывается')).toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Заказ оплачен' })).not.toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Вернуться к оплате' })).toHaveAttribute('href', '/orders/order-1/pay')
    })

    it('после отказа оставляет заказ и предлагает вернуться к оплате', async () => {
        getOrderMock.mockResolvedValue(makeOrder({ status: 'awaiting_payment', paymentStatus: 'failed' }))
        renderOrderPage()
        expect(await screen.findByRole('link', { name: 'Вернуться к оплате' })).toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Заказ оплачен' })).not.toBeInTheDocument()
    })

    it('показывает 404 без выдуманного успеха', async () => {
        getOrderMock.mockRejectedValue(makeApiError({ status: 404, code: 'NOT_FOUND', message: 'not found' }))
        renderOrderPage()
        expect(await screen.findByText('Заказ не найден')).toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Заказ оплачен' })).not.toBeInTheDocument()
    })
})
