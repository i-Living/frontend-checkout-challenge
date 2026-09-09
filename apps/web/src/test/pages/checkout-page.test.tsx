import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CheckoutPage } from '@/pages/checkout-page'
import { createOrder, createQuote, getCart, getCheckoutOptions } from '@/shared/api/endpoints'
import { useSessionStore } from '@/shared/store/session-store'
import { makeApiError, makeCart, makeCheckoutOptions, makeOrder, makeQuote, validPickupDraft } from '@/test/fixtures'
import { renderApp } from '@/test/render'

vi.mock('@/shared/api/endpoints', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/api/endpoints')>()
    return {
        ...actual,
        getCart: vi.fn(),
        getCheckoutOptions: vi.fn(),
        createQuote: vi.fn(),
        createOrder: vi.fn(),
    }
})

const getCartMock = vi.mocked(getCart)
const getCheckoutOptionsMock = vi.mocked(getCheckoutOptions)
const createQuoteMock = vi.mocked(createQuote)
const createOrderMock = vi.mocked(createOrder)

function renderCheckout() {
    return renderApp(
        <Routes>
            <Route element={<CheckoutPage />} path='/checkout' />
            <Route element={<div>cart-screen</div>} path='/cart' />
            <Route element={<div>pay-screen</div>} path='/orders/:orderId/pay' />
            <Route element={<div>order-screen</div>} path='/orders/:orderId' />
        </Routes>,
        { route: '/checkout' },
    )
}

describe('CheckoutPage', () => {
    beforeEach(() => {
        getCartMock.mockResolvedValue(makeCart())
        getCheckoutOptionsMock.mockResolvedValue(makeCheckoutOptions())
        createQuoteMock.mockResolvedValue(makeQuote())
        createOrderMock.mockResolvedValue(makeOrder())
        useSessionStore.getState().patchDraft(validPickupDraft)
    })

    it('уводит с пустой корзины на /cart', async () => {
        getCartMock.mockResolvedValue(makeCart({ items: [], quantity: 0, subtotal: 0 }))
        renderCheckout()
        expect(await screen.findByText('cart-screen')).toBeInTheDocument()
    })

    it('показывает доставку и итог из расчёта API', async () => {
        createQuoteMock.mockResolvedValue(makeQuote({ shipping: 0, total: 249000 }))
        renderCheckout()
        expect(await screen.findByText('К оплате')).toBeInTheDocument()
        expect(screen.getAllByText('Доставка').length).toBeGreaterThan(0)
        expect(createQuoteMock).toHaveBeenCalledWith(
            1,
            { method: 'pickup', pickupPointId: 'point-center' },
            expect.anything(),
        )
    })

    it('после конфликта версии корзины предлагает продолжить оформление', async () => {
        const user = userEvent.setup()
        createQuoteMock.mockRejectedValueOnce(
            makeApiError({ code: 'CART_VERSION_CONFLICT', message: 'version', status: 409 }),
        )
        createQuoteMock.mockResolvedValueOnce(makeQuote())
        renderCheckout()
        expect(await screen.findByText('Корзина изменилась')).toBeInTheDocument()
        expect(screen.getByLabelText('Имя')).toHaveValue('Тестовый Покупатель')
        await user.click(screen.getByRole('button', { name: 'Повторить' }))
        expect(await screen.findByText('К оплате')).toBeInTheDocument()
    })

    it('создаёт заказ с идемпотентностью и не дублирует его двойным кликом', async () => {
        const user = userEvent.setup()
        let resolveOrder: ((order: ReturnType<typeof makeOrder>) => void) | undefined
        createOrderMock.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveOrder = resolve
                }),
        )
        renderCheckout()
        expect(await screen.findByText('К оплате')).toBeInTheDocument()
        const submit = screen.getByRole('button', { name: 'Оформить и перейти к оплате' })
        await user.click(submit)
        await waitFor(() => expect(createOrderMock).toHaveBeenCalledTimes(1))
        expect(submit).toBeDisabled()
        await user.click(submit)
        expect(createOrderMock).toHaveBeenCalledTimes(1)
        const [body, key] = createOrderMock.mock.calls[0]
        expect(body).toMatchObject({
            quoteId: 'quote-1',
            paymentMethod: 'card',
            customer: {
                name: 'Тестовый Покупатель',
                email: 'buyer@example.test',
                phone: '+79990000000',
            },
        })
        expect(key).toEqual(expect.any(String))
        resolveOrder?.(makeOrder())
        expect(await screen.findByText('pay-screen')).toBeInTheDocument()
    })

    it('для наличных уходит на страницу заказа, а не на оплату', async () => {
        const user = userEvent.setup()
        useSessionStore.getState().patchDraft({ paymentMethod: 'cash_on_delivery' })
        createOrderMock.mockResolvedValue(
            makeOrder({ paymentMethod: 'cash_on_delivery', status: 'confirmed', paymentStatus: 'unpaid' }),
        )
        renderCheckout()
        expect(await screen.findByRole('button', { name: 'Оформить заказ' })).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Оформить заказ' }))
        expect(await screen.findByText('order-screen')).toBeInTheDocument()
    })
})
