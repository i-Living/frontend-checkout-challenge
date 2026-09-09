import { useSessionStore, waitForPersist } from '@/shared/store/session-store'
import { isAbortError, toApiError } from './errors'

type RequestOptions = {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    path: string
    body?: unknown
    headers?: Record<string, string>
    signal?: AbortSignal
    authRetry?: boolean
}

let lastRetryAfterMs = 400

export function getLastRetryAfterMs() {
    return lastRetryAfterMs
}

function captureRetryAfter(response: Response) {
    const header = response.headers.get('Retry-After')
    if (!header) {
        return
    }
    const seconds = Number.parseInt(header, 10)
    if (Number.isFinite(seconds) && seconds >= 0) {
        lastRetryAfterMs = seconds * 1000
    }
}

const viteEnv = import.meta.env as ImportMetaEnv & { VITE_API_URL?: string }

function apiBaseUrl() {
    return (viteEnv.VITE_API_URL ?? 'http://127.0.0.1:4000').replace(/\/$/, '')
}

function readSuccessData<T>(payload: unknown): T {
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return (payload as { data: T }).data
    }
    return payload as T
}

export async function request<T = undefined>(options: RequestOptions): Promise<T> {
    const { method, path, body, headers: extraHeaders, signal, authRetry = true } = options
    await waitForPersist()
    const token = useSessionStore.getState().token
    const headers: Record<string, string> = {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extraHeaders,
    }

    let response: Response
    try {
        response = await fetch(`${apiBaseUrl()}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal,
        })
    } catch (error) {
        if (isAbortError(error)) {
            throw error
        }
        throw error
    }

    captureRetryAfter(response)

    if (response.status === 204) {
        return undefined as T
    }

    const text = await response.text()

    if (!response.ok) {
        const apiError = toApiError(response.status, text, response.headers.get('X-Request-Id'))
        const isSessionError =
            apiError.status === 401 && (apiError.code === 'SESSION_REQUIRED' || apiError.code === 'SESSION_INVALID')
        const isCreateSession = method === 'POST' && path === '/api/sessions'

        if (authRetry && isSessionError && !isCreateSession) {
            useSessionStore.getState().setToken(null)
            const { ensureSession } = await import('./session')
            await ensureSession()
            return request<T>({ ...options, authRetry: false })
        }

        throw apiError
    }

    if (!text) {
        return undefined as T
    }

    return readSuccessData<T>(JSON.parse(text))
}
