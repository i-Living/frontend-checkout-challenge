import { describe, expect, it } from 'vitest'
import { keys } from '@/shared/api/query-keys'

describe('keys', () => {
    it('различает расчёты по версии корзины и доставке', () => {
        const pickup = keys.quoteByVersion(1, '{"method":"pickup"}')
        const courier = keys.quoteByVersion(1, '{"method":"courier"}')
        const nextCart = keys.quoteByVersion(2, '{"method":"pickup"}')
        expect(pickup).not.toEqual(courier)
        expect(pickup).not.toEqual(nextCart)
    })

    it('включает id в ключи заказа и платежа', () => {
        expect(keys.order('order-1')).toEqual(['order', 'order-1'])
        expect(keys.payment('pay-1')).toEqual(['payment', 'pay-1'])
        expect(keys.payments('order-1')).toEqual(['payments', 'order-1'])
    })
})
