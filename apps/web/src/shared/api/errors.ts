import type { components } from './api-types'

type ErrorEnvelope = components['schemas']['def-0']

export type ApiError = {
    name: 'ApiError'
    message: string
    code: string
    status: number
    fields: ErrorEnvelope['error']['fields']
    requestId: string | undefined
}

export function isApiError(error: unknown): error is ApiError {
    return typeof error === 'object' && error !== null && 'name' in error && error.name === 'ApiError'
}

export function isAbortError(error: unknown): boolean {
    return (error instanceof DOMException || error instanceof Error) && error.name === 'AbortError'
}

export function toApiError(status: number, bodyText: string, requestIdHeader: string | null): ApiError {
    let code = 'UNKNOWN'
    let message = bodyText || `HTTP ${status}`
    let fields: ApiError['fields']
    let requestId = requestIdHeader ?? undefined

    if (bodyText) {
        try {
            const parsed: unknown = JSON.parse(bodyText)
            if (parsed && typeof parsed === 'object') {
                const envelope = parsed as {
                    error?: { code?: string; message?: string; fields?: ApiError['fields'] }
                    requestId?: string
                    meta?: { requestId?: string }
                }
                if (envelope.error?.code) {
                    code = envelope.error.code
                }
                if (envelope.error?.message) {
                    message = envelope.error.message
                }
                fields = envelope.error?.fields
                requestId = envelope.requestId ?? envelope.meta?.requestId ?? requestId
            }
        } catch {
            // non-JSON error body
        }
    }

    return { name: 'ApiError', message, code, status, fields, requestId }
}
