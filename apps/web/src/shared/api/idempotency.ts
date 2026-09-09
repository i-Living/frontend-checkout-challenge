import { useSessionStore } from '@/shared/store/session-store'

export function createIdempotencyKey() {
    return crypto.randomUUID()
}

function sameBody(left: unknown, right: unknown) {
    return JSON.stringify(left) === JSON.stringify(right)
}

export function rememberOrderIdempotency(body: unknown) {
    const current = useSessionStore.getState().idempotency.orders
    if (current && sameBody(current.body, body)) {
        return current.key
    }
    const key = createIdempotencyKey()
    useSessionStore.getState().setOrderIdempotency({ key, body })
    return key
}

export function forgetOrderIdempotency() {
    useSessionStore.getState().setOrderIdempotency(undefined)
}

export function rememberPaymentIdempotency(orderId: string, body: unknown = {}) {
    const current = useSessionStore.getState().idempotency.payments?.[orderId]
    if (current && sameBody(current.body, body)) {
        return current.key
    }
    const key = createIdempotencyKey()
    useSessionStore.getState().setPaymentIdempotency(orderId, { key, body })
    return key
}

export function forgetPaymentIdempotency(orderId: string) {
    useSessionStore.getState().setPaymentIdempotency(orderId, undefined)
}
