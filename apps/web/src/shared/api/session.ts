/**
 * Сессия клиента: создание, переиспользование и запросы с токеном.
 * Держит один in-flight запрос и восстанавливает сессию после 401.
 */
import { useSessionStore } from '@/shared/store/session-store'
import type { operations } from './api-types'
import { API_PATHS, request } from './client'

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
 * Ждёт регидратации persist-стора, чтобы после F5 не создать новую сессию
 * поверх сохранённого токена (и не потерять корзину).
 * @returns Токен текущей сессии.
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
