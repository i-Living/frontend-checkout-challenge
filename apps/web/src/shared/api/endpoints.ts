import type { operations } from './api-types'
import { request } from './client'

type JsonData<T> = T extends { content: { 'application/json': { data: infer D } } } ? D : never
type OpData<Op extends keyof operations, Status extends keyof operations[Op]['responses']> = JsonData<
    operations[Op]['responses'][Status]
>
type OpBody<Op extends keyof operations> = operations[Op] extends {
    requestBody: { content: { 'application/json': infer B } }
}
    ? B
    : never

export function createSession(signal?: AbortSignal) {
    return request<OpData<'createSession', 201>>({
        method: 'POST',
        path: '/api/sessions',
        body: {},
        signal,
        authRetry: false,
    })
}

export function listProducts(signal?: AbortSignal) {
    return request<OpData<'listProducts', 200>>({
        method: 'GET',
        path: '/api/products',
        signal,
    })
}

export function getCart(signal?: AbortSignal) {
    return request<OpData<'getCart', 200>>({
        method: 'GET',
        path: '/api/cart',
        signal,
    })
}

export function putCartItem(productId: string, body: OpBody<'setCartItem'>, signal?: AbortSignal) {
    return request<OpData<'setCartItem', 200> | OpData<'setCartItem', 201>>({
        method: 'PUT',
        path: `/api/cart/items/${encodeURIComponent(productId)}`,
        body,
        signal,
    })
}

export function deleteCartItem(productId: string, signal?: AbortSignal) {
    return request({
        method: 'DELETE',
        path: `/api/cart/items/${encodeURIComponent(productId)}`,
        signal,
    })
}

export function getCheckoutOptions(signal?: AbortSignal) {
    return request<OpData<'getCheckoutOptions', 200>>({
        method: 'GET',
        path: '/api/checkout/options',
        signal,
    })
}

export function createQuote(body: OpBody<'createQuote'>, signal?: AbortSignal) {
    return request<OpData<'createQuote', 201>>({
        method: 'POST',
        path: '/api/quotes',
        body,
        signal,
    })
}

export function createOrder(body: OpBody<'createOrder'>, idempotencyKey: string, signal?: AbortSignal) {
    return request<OpData<'createOrder', 200> | OpData<'createOrder', 201>>({
        method: 'POST',
        path: '/api/orders',
        body,
        headers: { 'Idempotency-Key': idempotencyKey },
        signal,
    })
}

export function listOrders(signal?: AbortSignal) {
    return request<OpData<'listOrders', 200>>({
        method: 'GET',
        path: '/api/orders',
        signal,
    })
}

export function getOrder(orderId: string, signal?: AbortSignal) {
    return request<OpData<'getOrder', 200>>({
        method: 'GET',
        path: `/api/orders/${encodeURIComponent(orderId)}`,
        signal,
    })
}

export function createPayment(orderId: string, idempotencyKey: string, signal?: AbortSignal) {
    return request<OpData<'createPayment', 200> | OpData<'createPayment', 201>>({
        method: 'POST',
        path: `/api/orders/${encodeURIComponent(orderId)}/payments`,
        body: {},
        headers: { 'Idempotency-Key': idempotencyKey },
        signal,
    })
}

export function listOrderPayments(orderId: string, signal?: AbortSignal) {
    return request<OpData<'listPayments', 200>>({
        method: 'GET',
        path: `/api/orders/${encodeURIComponent(orderId)}/payments`,
        signal,
    })
}

export function getPayment(paymentId: string, signal?: AbortSignal) {
    return request<OpData<'getPayment', 200>>({
        method: 'GET',
        path: `/api/payments/${encodeURIComponent(paymentId)}`,
        signal,
    })
}

export function getSandbox(signal?: AbortSignal) {
    return request<OpData<'getSandbox', 200>>({
        method: 'GET',
        path: '/api/sandbox',
        signal,
    })
}

export function simulatePayment(paymentId: string, body: OpBody<'createSimulation'>, signal?: AbortSignal) {
    return request<OpData<'createSimulation', 200> | OpData<'createSimulation', 201> | OpData<'createSimulation', 202>>(
        {
            method: 'POST',
            path: `/api/payments/${encodeURIComponent(paymentId)}/simulations`,
            body,
            signal,
        },
    )
}
