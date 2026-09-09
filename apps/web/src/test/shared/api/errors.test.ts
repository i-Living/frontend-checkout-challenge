import { describe, expect, it } from 'vitest'
import { isApiError } from '@/shared/api/errors'

describe('isApiError', () => {
    it('принимает нормализованную ошибку API', () => {
        expect(
            isApiError({
                name: 'ApiError',
                message: 'Корзина пуста',
                code: 'CART_EMPTY',
                status: 422,
            }),
        ).toBe(true)
    })

    it('отклоняет обычные Error и произвольные объекты', () => {
        expect(isApiError(new Error('fail'))).toBe(false)
        expect(isApiError({ message: 'fail', code: 'X' })).toBe(false)
        expect(isApiError(null)).toBe(false)
        expect(isApiError('CART_EMPTY')).toBe(false)
    })
})
