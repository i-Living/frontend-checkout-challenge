import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OrderSummary } from '@/features/order/order-summary'
import { getCheckoutOptions } from '@/shared/api/endpoints'
import { formatMoney } from '@/shared/lib/money'
import { byNormalizedText, makeCheckoutOptions, makeOrder } from '@/test/fixtures'
import { renderApp } from '@/test/render'

vi.mock('@/shared/api/endpoints', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/api/endpoints')>()
    return { ...actual, getCheckoutOptions: vi.fn() }
})

const getCheckoutOptionsMock = vi.mocked(getCheckoutOptions)

describe('OrderSummary', () => {
    beforeEach(() => {
        getCheckoutOptionsMock.mockResolvedValue(makeCheckoutOptions())
    })

    it('рисует номер, товары, доставку и суммы именно этого заказа', async () => {
        const order = makeOrder({
            number: 'A-1001',
            subtotal: 249000,
            shipping: 39000,
            total: 288000,
            delivery: {
                method: 'courier',
                address: { city: 'Москва', street: 'Тверская', house: '1', apartment: '10' },
            },
        })
        renderApp(<OrderSummary order={order} />)
        expect(screen.getByText('Заказ A-1001')).toBeInTheDocument()
        expect(screen.getByText('Лампа Orbit × 1')).toBeInTheDocument()
        expect(screen.getByText('Курьер: Москва, Тверская, 1, кв. 10')).toBeInTheDocument()
        expect(screen.getAllByText(byNormalizedText(formatMoney(249000))).length).toBeGreaterThan(0)
        expect(screen.getByText(byNormalizedText(formatMoney(39000)))).toBeInTheDocument()
        expect(screen.getByText(byNormalizedText(formatMoney(288000)))).toBeInTheDocument()
    })

    it('подписывает пункт выдачи названием из API', async () => {
        renderApp(<OrderSummary order={makeOrder()} />)
        expect(await screen.findByText('Самовывоз: Центр — Учебная, 1')).toBeInTheDocument()
    })
})
