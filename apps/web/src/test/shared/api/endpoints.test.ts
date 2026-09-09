import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request, requestWithMeta } from '@/shared/api/client'
import {
    createOrder,
    createPayment,
    createSimulation,
    listProducts,
    removeCartItem,
    setCartItem,
} from '@/shared/api/endpoints'
import { ensureSession } from '@/shared/api/session'
import { useSessionStore } from '@/shared/store/session-store'
import { makeApiError, makeCart, makePayment } from '@/test/fixtures'

vi.mock('@/shared/api/session', () => ({
    ensureSession: vi.fn(),
}))

vi.mock('@/shared/api/client', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/api/client')>()
    return { ...actual, request: vi.fn(), requestWithMeta: vi.fn() }
})

const requestMock = vi.mocked(request)
const requestWithMetaMock = vi.mocked(requestWithMeta)
const ensureSessionMock = vi.mocked(ensureSession)

describe('endpoints', () => {
    beforeEach(() => {
        ensureSessionMock.mockResolvedValue('tok-1')
        requestMock.mockReset()
        requestWithMetaMock.mockReset()
    })

    it('загружает каталог без токена', async () => {
        requestMock.mockResolvedValue([])
        await listProducts()
        expect(ensureSessionMock).not.toHaveBeenCalled()
        expect(requestMock).toHaveBeenCalledWith('/api/products', { signal: undefined })
    })

    it('ставит абсолютное количество в корзине через PUT', async () => {
        const item = makeCart().items[0]
        requestMock.mockResolvedValue(item)
        await setCartItem('lamp-orbit', 2)
        expect(requestMock).toHaveBeenCalledWith('/api/cart/items/lamp-orbit', {
            method: 'PUT',
            body: { quantity: 2 },
            signal: undefined,
            token: 'tok-1',
        })
    })

    it('передаёт Idempotency-Key при создании заказа и платежа', async () => {
        requestMock.mockResolvedValue({ id: 'order-1' })
        await createOrder(
            {
                quoteId: 'quote-1',
                paymentMethod: 'card',
                customer: { name: 'A', email: 'a@b.c', phone: '+79990000000' },
            },
            'order-key',
        )
        expect(requestMock).toHaveBeenCalledWith(
            '/api/orders',
            expect.objectContaining({ method: 'POST', idempotencyKey: 'order-key', token: 'tok-1' }),
        )
        requestMock.mockResolvedValue(makePayment())
        await createPayment('order-1', 'pay-key')
        expect(requestMock).toHaveBeenCalledWith(
            '/api/orders/order-1/payments',
            expect.objectContaining({ method: 'POST', body: {}, idempotencyKey: 'pay-key' }),
        )
    })

    it('повторяет запрос с новой сессией после 401 SESSION_INVALID', async () => {
        const cart = makeCart()
        ensureSessionMock.mockResolvedValueOnce('stale').mockResolvedValueOnce('fresh')
        requestMock
            .mockRejectedValueOnce(makeApiError({ status: 401, code: 'SESSION_INVALID', message: 'invalid' }))
            .mockResolvedValueOnce(cart)
        useSessionStore.getState().setToken('stale')
        const { getCart } = await import('@/shared/api/endpoints')
        await expect(getCart()).resolves.toEqual(cart)
        expect(useSessionStore.getState().token).toBeNull()
        expect(requestMock).toHaveBeenNthCalledWith(1, '/api/cart', expect.objectContaining({ token: 'stale' }))
        expect(requestMock).toHaveBeenNthCalledWith(2, '/api/cart', expect.objectContaining({ token: 'fresh' }))
    })

    it('не повторяет запрос при ошибке, которая не является невалидной сессией', async () => {
        const error = makeApiError({ status: 409, code: 'INSUFFICIENT_STOCK', message: 'Нет остатка' })
        requestMock.mockRejectedValue(error)
        await expect(setCartItem('lamp-orbit', 99)).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' })
        expect(requestMock).toHaveBeenCalledTimes(1)
        expect(ensureSessionMock).toHaveBeenCalledTimes(1)
    })

    it('читает Retry-After у симуляции платежа', async () => {
        requestWithMetaMock.mockResolvedValue({
            data: { id: 'sim-1' },
            headers: new Headers({ 'Retry-After': '2' }),
        })
        await expect(createSimulation('pay-1', 'success')).resolves.toEqual({
            simulation: { id: 'sim-1' },
            retryAfterMs: 2000,
        })
    })

    it('удаляет позицию корзины DELETE-ом', async () => {
        requestMock.mockResolvedValue(undefined)
        await removeCartItem('lamp-orbit')
        expect(requestMock).toHaveBeenCalledWith('/api/cart/items/lamp-orbit', {
            method: 'DELETE',
            signal: undefined,
            token: 'tok-1',
        })
    })
})
