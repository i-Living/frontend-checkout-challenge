import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PaymentPage } from '@/pages/payment-page'
import {
    createPayment,
    createSimulation,
    getOrder,
    getPayment,
    getSandbox,
    listOrders,
    listPayments,
} from '@/shared/api/endpoints'
import { useSessionStore } from '@/shared/store/session-store'
import { makeApiError, makeOrder, makePayment, sandbox } from '@/test/fixtures'
import { renderApp } from '@/test/render'

vi.mock('@/shared/api/endpoints', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/api/endpoints')>()
    return {
        ...actual,
        getOrder: vi.fn(),
        getSandbox: vi.fn(),
        listPayments: vi.fn(),
        listOrders: vi.fn(),
        getPayment: vi.fn(),
        createPayment: vi.fn(),
        createSimulation: vi.fn(),
    }
})

const getOrderMock = vi.mocked(getOrder)
const getSandboxMock = vi.mocked(getSandbox)
const listPaymentsMock = vi.mocked(listPayments)
const listOrdersMock = vi.mocked(listOrders)
const getPaymentMock = vi.mocked(getPayment)
const createPaymentMock = vi.mocked(createPayment)
const createSimulationMock = vi.mocked(createSimulation)

function renderPay(route = '/orders/order-1/pay') {
    return renderApp(
        <Routes>
            <Route element={<PaymentPage />} path='/orders/:orderId/pay' />
            <Route element={<div>order-screen</div>} path='/orders/:orderId' />
            <Route element={<div>catalog-screen</div>} path='/' />
        </Routes>,
        { route },
    )
}

describe('PaymentPage', () => {
    beforeEach(() => {
        getOrderMock.mockResolvedValue(makeOrder())
        getSandboxMock.mockResolvedValue(sandbox)
        listPaymentsMock.mockResolvedValue([])
        listOrdersMock.mockResolvedValue([])
        getPaymentMock.mockResolvedValue(makePayment())
        createPaymentMock.mockResolvedValue(makePayment({ status: 'pending' }))
        createSimulationMock.mockResolvedValue({
            simulation: { id: 'sim-1' } as never,
            retryAfterMs: 250,
        })
    })

    it('показывает тестовые карты из API', async () => {
        renderPay()
        expect(await screen.findByText('Тестовая карта: успешная оплата')).toBeInTheDocument()
        expect(screen.getByText('•••• 4242')).toBeInTheDocument()
        expect(screen.getByText('Тестовая карта: отказ банка')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Оплатить' })).toBeEnabled()
    })

    it('различает отказ банка и предлагает новую попытку', async () => {
        const declined = makePayment({ status: 'failed', failureCode: 'CARD_DECLINED' })
        useSessionStore.getState().setPayment(declined.id)
        listPaymentsMock.mockResolvedValue([declined])
        getPaymentMock.mockResolvedValue(declined)
        renderPay()
        expect(await screen.findByText('Банк отклонил карту')).toBeInTheDocument()
        expect(screen.getByText(/CARD_DECLINED/)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Оплатить снова' })).toBeEnabled()
        expect(screen.queryByText('Оплата отменена')).not.toBeInTheDocument()
    })

    it('различает отмену оплаты и оставляет заказ', async () => {
        const cancelled = makePayment({ status: 'cancelled' })
        useSessionStore.getState().setPayment(cancelled.id)
        listPaymentsMock.mockResolvedValue([cancelled])
        getPaymentMock.mockResolvedValue(cancelled)
        renderPay()
        expect(await screen.findByText('Оплата отменена')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Оплатить снова' })).toBeEnabled()
        expect(screen.queryByText('Банк отклонил карту')).not.toBeInTheDocument()
    })

    it('показывает ожидание и блокирует повторный запуск, пока платёж processing', async () => {
        const processing = makePayment({ status: 'processing' })
        listPaymentsMock.mockResolvedValue([processing])
        getPaymentMock.mockResolvedValue(processing)
        renderPay()
        expect(await screen.findByText('Обрабатываем оплату…')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Оплатить' })).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Отменить оплату' })).toBeDisabled()
    })

    it('не открывает оплату для наличного заказа', async () => {
        getOrderMock.mockResolvedValue(
            makeOrder({ paymentMethod: 'cash_on_delivery', status: 'confirmed', paymentStatus: 'unpaid' }),
        )
        renderPay()
        expect(await screen.findByText('order-screen')).toBeInTheDocument()
        expect(createPaymentMock).not.toHaveBeenCalled()
    })

    it('успех карты уводит на заказ только после succeeded', async () => {
        const succeeded = makePayment({ status: 'succeeded' })
        listPaymentsMock.mockResolvedValue([succeeded])
        getPaymentMock.mockResolvedValue(succeeded)
        getOrderMock.mockResolvedValue(makeOrder({ status: 'paid', paymentStatus: 'succeeded' }))
        renderPay()
        expect(await screen.findByText('order-screen')).toBeInTheDocument()
    })

    it('запускает оплату выбранной картой и передаёт сценарий из API', async () => {
        const user = userEvent.setup()
        renderPay()
        expect(await screen.findByRole('button', { name: 'Оплатить' })).toBeEnabled()
        await user.click(screen.getByRole('button', { name: 'Оплатить' }))
        await waitFor(() => expect(createPaymentMock).toHaveBeenCalledWith('order-1', expect.any(String)))
        await waitFor(() => expect(createSimulationMock).toHaveBeenCalledWith('pay-1', 'success'))
        expect(await screen.findByText('Обрабатываем оплату…')).toBeInTheDocument()
    })

    it('после PAYMENT_FINALIZED сбрасывает ключ и позволяет новую попытку', async () => {
        const user = userEvent.setup()
        createPaymentMock.mockRejectedValueOnce(
            makeApiError({ code: 'PAYMENT_FINALIZED', message: 'already done', status: 409 }),
        )
        renderPay()
        expect(await screen.findByRole('button', { name: 'Оплатить' })).toBeEnabled()
        await user.click(screen.getByRole('button', { name: 'Оплатить' }))
        expect(await screen.findByText('Оплата уже завершена')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Оплатить снова' })).toBeEnabled()
        createPaymentMock.mockResolvedValueOnce(makePayment({ id: 'pay-2' }))
        await user.click(screen.getByRole('button', { name: 'Оплатить снова' }))
        await waitFor(() => expect(createPaymentMock).toHaveBeenCalledTimes(2))
        const firstKey = createPaymentMock.mock.calls[0][1]
        const secondKey = createPaymentMock.mock.calls[1][1]
        expect(secondKey).not.toBe(firstKey)
    })
})
