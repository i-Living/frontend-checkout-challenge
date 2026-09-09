import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    API_BASE,
    API_PATHS,
    cartItemPath,
    orderPath,
    orderPaymentsPath,
    parseRetryAfterMs,
    paymentPath,
    quotePath,
    request,
    requestWithMeta,
} from '@/shared/api/client'
import { isApiError } from '@/shared/api/errors'

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers },
    })
}

describe('path builders', () => {
    it('кодирует идентификаторы в путях', () => {
        expect(cartItemPath('a/b')).toBe('/api/cart/items/a%2Fb')
        expect(quotePath('q 1')).toBe('/api/quotes/q%201')
        expect(orderPath('ord-1')).toBe('/api/orders/ord-1')
        expect(orderPaymentsPath('ord-1')).toBe('/api/orders/ord-1/payments')
        expect(paymentPath('pay-1')).toBe('/api/payments/pay-1')
    })
})

describe('parseRetryAfterMs', () => {
    it('переводит секунды в миллисекунды и ограничивает 250–10000', () => {
        expect(parseRetryAfterMs(new Headers({ 'Retry-After': '2' }))).toBe(2000)
        expect(parseRetryAfterMs(new Headers({ 'Retry-After': '0' }))).toBe(250)
        expect(parseRetryAfterMs(new Headers({ 'Retry-After': '100' }))).toBe(10_000)
    })

    it('принимает HTTP-дату в будущем и игнорирует прошедшую', () => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
        const future = parseRetryAfterMs(new Headers({ 'Retry-After': 'Thu, 01 Jan 2026 00:00:03 GMT' }))
        const past = parseRetryAfterMs(new Headers({ 'Retry-After': 'Wed, 31 Dec 2025 00:00:00 GMT' }))
        expect(future).toBe(3000)
        expect(past).toBeNull()
        vi.useRealTimers()
    })

    it('возвращает null без заголовка или при мусоре', () => {
        expect(parseRetryAfterMs(new Headers())).toBeNull()
        expect(parseRetryAfterMs(new Headers({ 'Retry-After': 'soon' }))).toBeNull()
    })
})

describe('request', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('не ставит Content-Type на GET и разворачивает data', async () => {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: [{ id: 'lamp-orbit' }] }))
        vi.stubGlobal('fetch', fetchMock)
        const data = await request<{ id: string }[]>(API_PATHS.products)
        expect(data).toEqual([{ id: 'lamp-orbit' }])
        expect(fetchMock).toHaveBeenCalledWith(
            `${API_BASE}/api/products`,
            expect.objectContaining({ method: 'GET', body: undefined }),
        )
        const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
        expect(headers['Content-Type']).toBeUndefined()
        expect(headers.Authorization).toBeUndefined()
    })

    it('ставит JSON, Bearer и Idempotency-Key', async () => {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { data: { id: 'order-1' } }))
        vi.stubGlobal('fetch', fetchMock)
        await request('/api/orders', {
            method: 'POST',
            body: { quoteId: 'q1' },
            token: 'tok-1',
            idempotencyKey: 'key-1',
        })
        const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
        expect(headers['Content-Type']).toBe('application/json')
        expect(headers.Authorization).toBe('Bearer tok-1')
        expect(headers['Idempotency-Key']).toBe('key-1')
        expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ quoteId: 'q1' }))
    })

    it('не вызывает json() на 204 и пустом теле', async () => {
        const empty204 = new Response(null, { status: 204 })
        const empty200 = new Response('', { status: 200 })
        const fetchMock = vi.fn().mockResolvedValueOnce(empty204).mockResolvedValueOnce(empty200)
        vi.stubGlobal('fetch', fetchMock)
        await expect(request('/api/cart/items/x', { method: 'DELETE' })).resolves.toBeUndefined()
        await expect(request('/api/empty')).resolves.toBeUndefined()
    })

    it('маппит ошибку API: код, поля, requestId из meta и заголовка', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            jsonResponse(
                422,
                {
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Проверьте поля',
                        fields: [{ path: '/customer/email', message: 'invalid' }, 'skip-me'],
                    },
                    meta: { requestId: 'from-body' },
                },
                { 'X-Request-Id': 'from-header' },
            ),
        )
        vi.stubGlobal('fetch', fetchMock)
        await expect(request('/api/orders', { method: 'POST', body: {} })).rejects.toMatchObject({
            name: 'ApiError',
            code: 'VALIDATION_ERROR',
            message: 'Проверьте поля',
            status: 422,
            requestId: 'from-body',
            fields: [{ path: '/customer/email', message: 'invalid' }],
        })
    })

    it('берёт requestId из заголовка и запасной текст, если тела нет', async () => {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, { error: {} }, { 'X-Request-Id': 'hdr-1' }))
        vi.stubGlobal('fetch', fetchMock)
        try {
            await request('/api/cart')
            throw new Error('should throw')
        } catch (error) {
            expect(isApiError(error)).toBe(true)
            if (isApiError(error)) {
                expect(error.code).toBe('UNKNOWN_ERROR')
                expect(error.message).toBe('Request failed with status 401')
                expect(error.requestId).toBe('hdr-1')
            }
        }
    })

    it('бросает ApiError на невалидном JSON', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not-json', { status: 500 })))
        await expect(request('/api/products')).rejects.toMatchObject({
            name: 'ApiError',
            status: 500,
        })
    })

    it('возвращает заголовки вместе с data', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(jsonResponse(202, { data: { id: 'sim-1' } }, { 'Retry-After': '2' })),
        )
        const result = await requestWithMeta<{ id: string }>('/api/payments/p/simulations', {
            method: 'POST',
            body: {},
        })
        expect(result.data).toEqual({ id: 'sim-1' })
        expect(result.headers.get('Retry-After')).toBe('2')
    })
})
