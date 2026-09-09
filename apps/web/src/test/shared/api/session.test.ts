import { beforeEach, describe, expect, it, vi } from 'vitest'
import { request } from '@/shared/api/client'
import { ensureSession } from '@/shared/api/session'
import { useSessionStore } from '@/shared/store/session-store'

vi.mock('@/shared/api/client', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/api/client')>()
    return { ...actual, request: vi.fn() }
})

const requestMock = vi.mocked(request)

describe('ensureSession', () => {
    beforeEach(() => {
        requestMock.mockReset()
        requestMock.mockResolvedValue({ token: 'new-token' })
    })

    it('возвращает уже сохранённый токен без POST', async () => {
        useSessionStore.getState().setToken('saved-token')
        await expect(ensureSession()).resolves.toBe('saved-token')
        expect(requestMock).not.toHaveBeenCalled()
    })

    it('создаёт одну сессию на параллельные вызовы', async () => {
        let resolveCreate: ((value: { token: string }) => void) | undefined
        requestMock.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveCreate = resolve
                }),
        )
        const first = ensureSession()
        const second = ensureSession()
        expect(requestMock).toHaveBeenCalledTimes(1)
        expect(requestMock).toHaveBeenCalledWith('/api/sessions', { method: 'POST', body: {} })
        resolveCreate?.({ token: 'shared-token' })
        await expect(first).resolves.toBe('shared-token')
        await expect(second).resolves.toBe('shared-token')
        expect(useSessionStore.getState().token).toBe('shared-token')
        expect(requestMock).toHaveBeenCalledTimes(1)
    })

    it('ждёт регидратации persist, чтобы не создать новую сессию поверх сохранённой', async () => {
        const hasHydrated = vi.spyOn(useSessionStore.persist, 'hasHydrated').mockReturnValue(false)
        const onFinish = vi.spyOn(useSessionStore.persist, 'onFinishHydration')
        onFinish.mockImplementation((callback) => {
            queueMicrotask(() => {
                useSessionStore.getState().setToken('hydrated-token')
                callback(useSessionStore.getState())
            })
            return () => {}
        })
        await expect(ensureSession()).resolves.toBe('hydrated-token')
        expect(requestMock).not.toHaveBeenCalled()
        hasHydrated.mockRestore()
        onFinish.mockRestore()
    })
})
