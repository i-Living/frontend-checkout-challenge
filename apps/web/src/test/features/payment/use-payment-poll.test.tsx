import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePaymentPoll } from '@/features/payment/use-payment-poll'
import { getPayment } from '@/shared/api/endpoints'
import { makePayment } from '@/test/fixtures'
import { createTestQueryClient } from '@/test/render'

vi.mock('@/shared/api/endpoints', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/api/endpoints')>()
    return { ...actual, getPayment: vi.fn() }
})

const getPaymentMock = vi.mocked(getPayment)

function createWrapper() {
    const queryClient = createTestQueryClient()
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }
}

describe('usePaymentPoll', () => {
    beforeEach(() => {
        getPaymentMock.mockReset()
    })

    it('не запрашивает платёж без id или при выключенном опросе', () => {
        renderHook(() => usePaymentPoll(null), { wrapper: createWrapper() })
        renderHook(() => usePaymentPoll('pay-1', false), { wrapper: createWrapper() })
        expect(getPaymentMock).not.toHaveBeenCalled()
    })

    it('считает pending нетерминальным и продолжает опрос', async () => {
        getPaymentMock.mockResolvedValue(makePayment({ status: 'pending' }))
        const { result } = renderHook(() => usePaymentPoll('pay-1', true, 20), { wrapper: createWrapper() })
        await waitFor(() => expect(result.current.payment?.status).toBe('pending'))
        expect(result.current.isTerminal).toBe(false)
        await waitFor(() => expect(getPaymentMock.mock.calls.length).toBeGreaterThanOrEqual(2))
    })

    it.each(['succeeded', 'failed', 'cancelled'] as const)('останавливает опрос на статусе %s', async (status) => {
        getPaymentMock.mockResolvedValue(
            makePayment({ status, failureCode: status === 'failed' ? 'CARD_DECLINED' : null }),
        )
        const { result } = renderHook(() => usePaymentPoll('pay-1', true, 20), { wrapper: createWrapper() })
        await waitFor(() => expect(result.current.isTerminal).toBe(true))
        const calls = getPaymentMock.mock.calls.length
        await new Promise((resolve) => setTimeout(resolve, 60))
        expect(getPaymentMock.mock.calls.length).toBe(calls)
    })
})
