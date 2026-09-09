import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePaymentAttempt } from '@/features/payment/use-payment-attempt'
import { createPayment, createSimulation } from '@/shared/api/endpoints'
import { useSessionStore } from '@/shared/store/session-store'
import { makeApiError, makePayment } from '@/test/fixtures'
import { createTestQueryClient } from '@/test/render'

vi.mock('@/shared/api/endpoints', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/api/endpoints')>()
    return { ...actual, createPayment: vi.fn(), createSimulation: vi.fn() }
})

const createPaymentMock = vi.mocked(createPayment)
const createSimulationMock = vi.mocked(createSimulation)

function createWrapper() {
    const queryClient = createTestQueryClient()
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }
}

describe('usePaymentAttempt', () => {
    beforeEach(() => {
        createPaymentMock.mockReset()
        createSimulationMock.mockReset()
        createPaymentMock.mockResolvedValue(makePayment())
        createSimulationMock.mockResolvedValue({
            simulation: { id: 'sim-1' } as never,
            retryAfterMs: 250,
        })
        useSessionStore.getState().setLastPayment(null)
    })

    it('pay и cancel идут через одну мутацию с разным scenario', async () => {
        const { result } = renderHook(() => usePaymentAttempt('order-1'), { wrapper: createWrapper() })
        result.current.startPay('success')
        await waitFor(() => expect(createSimulationMock).toHaveBeenCalledWith('pay-1', 'success'))
        expect(result.current.lastAction).toBe('pay')
        expect(result.current.attemptPaymentId).toBe('pay-1')
        expect(result.current.pollIntervalMs).toBe(250)

        result.current.startCancel()
        await waitFor(() => expect(createSimulationMock).toHaveBeenCalledWith('pay-1', 'cancel'))
        expect(result.current.lastAction).toBe('cancel')
    })

    it('после PAYMENT_FINALIZED сбрасывает ключ и даёт новый', async () => {
        createPaymentMock.mockRejectedValueOnce(
            makeApiError({ code: 'PAYMENT_FINALIZED', message: 'already done', status: 409 }),
        )
        const { result } = renderHook(() => usePaymentAttempt('order-1'), { wrapper: createWrapper() })
        result.current.startPay('success')
        await waitFor(() => expect(result.current.errorCode).toBe('PAYMENT_FINALIZED'))
        createPaymentMock.mockResolvedValueOnce(makePayment({ id: 'pay-2' }))
        result.current.startPay('success')
        await waitFor(() => expect(createPaymentMock).toHaveBeenCalledTimes(2))
        expect(createPaymentMock.mock.calls[0][1]).not.toBe(createPaymentMock.mock.calls[1][1])
    })
})
