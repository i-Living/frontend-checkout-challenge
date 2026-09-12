import { describe, expect, it } from 'vitest'
import { routes } from '@/app/routes'

describe('routes', () => {
    it('шаблон отдельно, URL — через orderRoute и paymentRoute', () => {
        expect(routes.order).toBe('/orders/:orderId')
        expect(routes.payment).toBe('/orders/:orderId/pay')
        expect(routes.orderRoute('order-1')).toBe('/orders/order-1')
        expect(routes.paymentRoute('order-1')).toBe('/orders/order-1/pay')
    })
})
