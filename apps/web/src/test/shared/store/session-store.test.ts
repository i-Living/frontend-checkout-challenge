import { describe, expect, it } from 'vitest'
import { useSessionStore } from '@/shared/store/session-store'

describe('session-store', () => {
    it('сливает черновик оформления без потери остальных полей', () => {
        useSessionStore.getState().patchDraft({ name: 'Анна', email: 'anna@example.test' })
        useSessionStore.getState().patchDraft({ phone: '+79990000000' })
        expect(useSessionStore.getState().draft).toMatchObject({
            name: 'Анна',
            email: 'anna@example.test',
            phone: '+79990000000',
            deliveryMethod: '',
        })
    })

    it('хранит токен, заказ и оплату для восстановления после перезагрузки', () => {
        useSessionStore.getState().setToken('tok-1')
        useSessionStore.getState().setOrder('order-1')
        useSessionStore.getState().setPayment('pay-1')
        expect(useSessionStore.getState()).toMatchObject({
            token: 'tok-1',
            orderId: 'order-1',
            paymentId: 'pay-1',
        })
        useSessionStore.getState().clearToken()
        expect(useSessionStore.getState().token).toBeNull()
        expect(useSessionStore.getState().orderId).toBe('order-1')
    })
})
