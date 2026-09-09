import { describe, expect, it } from 'vitest'
import { orThrow } from '@/shared/lib/assert'

describe('orThrow', () => {
    it('возвращает непустое значение', () => {
        expect(orThrow('order-1', 'orderId')).toBe('order-1')
    })

    it('бросает ошибку для пустого значения', () => {
        expect(() => orThrow(undefined, 'orderId')).toThrow('orderId is required')
        expect(() => orThrow('', 'paymentId')).toThrow('paymentId is required')
    })
})
