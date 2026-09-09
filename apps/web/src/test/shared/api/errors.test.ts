import { describe, expect, it } from 'vitest'
import {
    getErrorCode,
    isApiError,
    isInvalidSessionError,
    isNotFoundError,
    toErrorDescription,
    toErrorTitle,
    toUserMessage,
} from '@/shared/api/errors'
import { makeApiError } from '@/test/fixtures'

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

describe('error helpers', () => {
    it('достаёт код и отличает 401 сессии от 404', () => {
        expect(getErrorCode(makeApiError({ code: 'CART_EMPTY' }))).toBe('CART_EMPTY')
        expect(getErrorCode(new Error('offline'))).toBeNull()
        expect(isInvalidSessionError(makeApiError({ status: 401, code: 'SESSION_INVALID' }))).toBe(true)
        expect(isInvalidSessionError(makeApiError({ status: 409, code: 'INSUFFICIENT_STOCK' }))).toBe(false)
        expect(isNotFoundError(makeApiError({ status: 404, code: 'NOT_FOUND' }))).toBe(true)
        expect(isNotFoundError(makeApiError({ status: 400, code: 'NOT_FOUND' }))).toBe(false)
    })

    it('переводит известные коды в один текст и оставляет message API для прочих', () => {
        expect(toUserMessage(makeApiError({ code: 'CART_VERSION_CONFLICT' }))).toMatch(/Корзина изменилась/)
        expect(toUserMessage(makeApiError({ code: 'QUOTE_EXPIRED' }))).toMatch(/Расчёт устарел/)
        expect(toUserMessage(makeApiError({ code: 'CART_EMPTY' }))).toMatch(/Корзина пуста/)
        expect(toUserMessage(makeApiError({ code: 'IDEMPOTENCY_CONFLICT' }))).toMatch(/новый ключ/)
        expect(toUserMessage(makeApiError({ message: 'Сервер недоступен' }))).toBe('Сервер недоступен')
        expect(toUserMessage(new Error('offline'))).toBe('Попробуйте ещё раз.')
        expect(toErrorTitle(makeApiError({ code: 'CART_VERSION_CONFLICT' }), 'Ошибка')).toBe('Корзина изменилась')
        expect(toErrorTitle(makeApiError({ code: 'UNKNOWN_ERROR' }), 'Ошибка')).toBe('Ошибка')
        expect(toErrorDescription(makeApiError({ code: 'QUOTE_EXPIRED' }))).toMatch(/новый расчёт/)
    })
})
