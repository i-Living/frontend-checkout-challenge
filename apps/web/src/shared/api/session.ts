/**
 * Сессия клиента: создание, переиспользование и запросы с токеном.
 * Держит один in-flight запрос и восстанавливает сессию после 401.
 */
import { useQuery } from '@tanstack/react-query'
import { useSessionStore } from '@/shared/store/session-store'
import type { operations } from './api-types'
import type { RequestOptions } from './client'
import { API_PATHS, request } from './client'
import { isApiError } from './errors'
import { keys } from './query-keys'

/** Данные создания сессии из ответа API. */
type CreateSessionData = operations['createSession']['responses'][201]['content']['application/json']['data']

/** Текущий in-flight запрос создания сессии для дедупликации. */
let inFlight: Promise<string> | null = null

/**
 * Создаёт новую сессию и сохраняет токен в сторе.
 * @returns Новый токен сессии.
 */
async function createSession(): Promise<string> {
    const data = await request<CreateSessionData>(API_PATHS.sessions, { method: 'POST', body: {} })
    useSessionStore.getState().setToken(data.token)
    return data.token
}

/**
 * Возвращает существующий токен или создаёт сессию один раз на всех вызывающих.
 * @returns Токен текущей сессии.
 */
export async function ensureSession(): Promise<string> {
    const existing = useSessionStore.getState().token
    if (existing) {
        return existing
    }
    if (inFlight) {
        return inFlight
    }
    inFlight = createSession()
    try {
        return await inFlight
    } finally {
        inFlight = null
    }
}

/**
 * Выполняет запрос с сессией и пересоздаёт её один раз после 401.
 * @param path Путь запроса относительно API_BASE.
 * @param options Параметры запроса без токена.
 * @returns Поле data успешного ответа.
 * @throws ApiError при неуспешном статусе после повтора.
 */
export async function requestWithSession<T>(path: string, options: Omit<RequestOptions, 'token'> = {}): Promise<T> {
    const token = await ensureSession()
    try {
        return await request<T>(path, { ...options, token })
    } catch (error) {
        if (
            isApiError(error) &&
            error.status === 401 &&
            (error.code === 'SESSION_REQUIRED' || error.code === 'SESSION_INVALID')
        ) {
            useSessionStore.getState().clearToken()
            const fresh = await ensureSession()
            return await request<T>(path, { ...options, token: fresh })
        }
        throw error
    }
}

/**
 * React Query хук гарантии сессии при монтировании.
 * @returns Query с токеном сессии, закэшированным навсегда.
 */
export function useEnsureSession() {
    return useQuery({
        queryKey: keys.session,
        queryFn: () => ensureSession(),
        staleTime: Number.POSITIVE_INFINITY,
        gcTime: Number.POSITIVE_INFINITY,
    })
}
