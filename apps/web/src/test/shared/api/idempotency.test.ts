import { describe, expect, it } from 'vitest'
import { clearOrderKey, clearPaymentKey, getOrCreateOrderKey, getOrCreatePaymentKey } from '@/shared/api/idempotency'
import { useSessionStore } from '@/shared/store/session-store'

describe('idempotency keys', () => {
    it('повторяет тот же ключ заказа для того же тела', () => {
        const body = { quoteId: 'q1', paymentMethod: 'card' }
        const first = getOrCreateOrderKey(body)
        const second = getOrCreateOrderKey({ ...body })
        expect(second).toBe(first)
        expect(useSessionStore.getState().lastOrder?.key).toBe(first)
    })

    it('выдаёт новый ключ заказа при смене тела и после сброса', () => {
        const first = getOrCreateOrderKey({ quoteId: 'q1' })
        const changed = getOrCreateOrderKey({ quoteId: 'q2' })
        expect(changed).not.toBe(first)
        clearOrderKey()
        const afterClear = getOrCreateOrderKey({ quoteId: 'q2' })
        expect(afterClear).not.toBe(changed)
        expect(useSessionStore.getState().lastOrder?.key).toBe(afterClear)
    })

    it('повторяет ключ платежа только для того же заказа и тела', () => {
        const first = getOrCreatePaymentKey('order-1', {})
        expect(getOrCreatePaymentKey('order-1', {})).toBe(first)
        const otherOrder = getOrCreatePaymentKey('order-2', {})
        expect(otherOrder).not.toBe(first)
        const otherBody = getOrCreatePaymentKey('order-2', { extra: true })
        expect(otherBody).not.toBe(otherOrder)
        clearPaymentKey()
        expect(getOrCreatePaymentKey('order-2', { extra: true })).not.toBe(otherBody)
    })
})
