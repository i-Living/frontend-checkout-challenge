import { useSessionStore, waitForPersist } from '@/shared/store/session-store'
import type { operations } from './api-types'
import { request } from './client'

type SessionData = operations['createSession']['responses'][201]['content']['application/json']['data']

let pendingSession: Promise<string> | null = null

export function getSessionToken() {
    return useSessionStore.getState().token
}

export function setSessionToken(token: string | null) {
    useSessionStore.getState().setToken(token)
}

export function getOrderId() {
    return useSessionStore.getState().orderId
}

export function setOrderId(orderId: string | null) {
    useSessionStore.getState().setOrderId(orderId)
}

export function getPaymentId() {
    return useSessionStore.getState().paymentId
}

export function setPaymentId(paymentId: string | null) {
    useSessionStore.getState().setPaymentId(paymentId)
}

export async function ensureSession() {
    await waitForPersist()
    const existing = useSessionStore.getState().token
    if (existing) {
        return existing
    }
    if (!pendingSession) {
        pendingSession = request<SessionData>({
            method: 'POST',
            path: '/api/sessions',
            body: {},
            authRetry: false,
        })
            .then((data) => {
                const token = data.token
                useSessionStore.getState().setToken(token)
                return token
            })
            .finally(() => {
                pendingSession = null
            })
    }
    return pendingSession
}
