/**
 * Гостевая сессия: токен в Zustand/sessionStorage, заголовок Authorization собирает client.ts.
 * Параллельные вызовы делят один POST. 401 SESSION_* обрабатывается в withSessionRetry, не здесь.
 */
import { useSessionStore } from '@/shared/store/session-store'
import type { operations } from './api-types'
import { API_PATHS, request } from './client'

/** `data` ответа POST /api/sessions: нужен `token`, не `id` сессии. */
type CreateSessionData = operations['createSession']['responses'][201]['content']['application/json']['data']

/** Дедупликация: два getCart на старте не должны создать две сессии и две корзины. */
let inFlight: Promise<string> | null = null

/**
 * POST /api/sessions `{}` и запись token в стор. Вызывать только из ensureSession.
 * @returns Токен для Authorization; это не session id.
 */
async function createSession(): Promise<string> {
    const data = await request<CreateSessionData>(API_PATHS.sessions, { method: 'POST', body: {} })
    useSessionStore.getState().setToken(data.token)
    return data.token
}

/**
 * Берёт токен из стора или создаёт сессию один раз на всех вызывающих.
 * Ждёт гидратации persist: иначе F5 увидит пустой стор, создаст новый токен и потеряет корзину.
 * @returns Токен текущей вкладки.
 */
export async function ensureSession(): Promise<string> {
    if (!useSessionStore.persist.hasHydrated()) {
        await new Promise<void>((resolve) => {
            const unsubscribe = useSessionStore.persist.onFinishHydration(() => {
                unsubscribe()
                resolve()
            })
        })
    }
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
