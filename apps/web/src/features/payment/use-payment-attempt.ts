/**
 * Одна попытка оплаты: создание платежа + симуляция сценария.
 * Pay и cancel — один поток с разным scenario, общий ключ идемпотентности.
 */
import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { createPayment, createSimulation, type Payment, type SimulationScenario } from '@/shared/api/endpoints'
import { getErrorCode } from '@/shared/api/errors'
import { clearPaymentKey, getOrCreatePaymentKey } from '@/shared/api/idempotency'
import { invalidateOrderAndPayments, invalidatePayment, invalidatePayments } from '@/shared/api/invalidate'
import { orThrow } from '@/shared/lib/assert'
import { useSessionStore } from '@/shared/store/session-store'

/** Какое действие запустили последним — для текстов ошибки. */
export type PaymentAction = 'pay' | 'cancel'

/** Результат хука попытки оплаты. */
export interface PaymentAttempt {
    isPending: boolean
    error: unknown
    errorCode: string | null
    lastAction: PaymentAction | null
    attemptPaymentId: string | null
    pollIntervalMs: number
    isStaleError: boolean
    startPay: (scenario: SimulationScenario) => void
    startCancel: () => void
}

/**
 * Проверяет, что ответ отброшен из-за новой попытки (generation-guard).
 * @param error Произвольная ошибка мутации.
 */
export function isStaleAttemptError(error: unknown): boolean {
    return error instanceof Error && error.message === 'stale'
}

/**
 * Создаёт попытку оплаты и запускает симуляцию выбранного сценария.
 * @param orderId Идентификатор заказа из маршрута.
 */
export function usePaymentAttempt(orderId: string | undefined): PaymentAttempt {
    const queryClient = useQueryClient()
    const setPayment = useSessionStore((state) => state.setPayment)
    const generationRef = useRef(0)
    const [attemptPaymentId, setAttemptPaymentId] = useState<string | null>(null)
    const [pollIntervalMs, setPollIntervalMs] = useState(800)
    const [lastAction, setLastAction] = useState<PaymentAction | null>(null)

    const mutation = useMutation({
        mutationFn: async (
            scenario: SimulationScenario,
        ): Promise<{ payment: Payment; retryAfterMs: number | null }> => {
            const generation = generationRef.current
            const id = orThrow(orderId, 'orderId')
            const key = getOrCreatePaymentKey(id, {})
            const created = await createPayment(id, key)
            if (generation !== generationRef.current) {
                throw new Error('stale')
            }
            const { retryAfterMs } = await createSimulation(created.id, scenario)
            if (generation !== generationRef.current) {
                throw new Error('stale')
            }
            return { payment: created, retryAfterMs }
        },
        onSuccess: (result) => {
            clearPaymentKey()
            setPollIntervalMs(result.retryAfterMs ?? 800)
            setAttemptPaymentId(result.payment.id)
            setPayment(result.payment.id)
            void invalidatePayment(queryClient, result.payment.id)
            if (orderId) {
                void invalidatePayments(queryClient, orderId)
            }
        },
        onError: (error: unknown) => {
            const code = getErrorCode(error)
            if (code === 'PAYMENT_FINALIZED') {
                clearPaymentKey()
            }
            if ((code === 'PAYMENT_FINALIZED' || code === 'PAYMENT_IN_PROGRESS') && orderId) {
                void invalidatePayments(queryClient, orderId)
            }
        },
    })

    /**
     * Стартует новую попытку: новый generation, сброс прошлой ошибки, при FINALIZED — новый ключ.
     * @param action pay или cancel.
     * @param scenario Сценарий песочницы.
     */
    function start(action: PaymentAction, scenario: SimulationScenario): void {
        if (getErrorCode(mutation.error) === 'PAYMENT_FINALIZED' && orderId) {
            clearPaymentKey()
            void invalidatePayments(queryClient, orderId)
        }
        generationRef.current += 1
        setLastAction(action)
        mutation.mutate(scenario)
    }

    return {
        isPending: mutation.isPending,
        error: mutation.error,
        errorCode: getErrorCode(mutation.error),
        lastAction,
        attemptPaymentId,
        pollIntervalMs,
        isStaleError: isStaleAttemptError(mutation.error),
        startPay: (scenario) => start('pay', scenario),
        startCancel: () => start('cancel', 'cancel'),
    }
}

/**
 * Инвалидирует заказ и платежи после терминального статуса или ORDER_ALREADY_PAID.
 * @param queryClient Клиент Query.
 * @param orderId Идентификатор заказа.
 */
export function refreshOrderAfterPayment(queryClient: QueryClient, orderId: string): void {
    void invalidateOrderAndPayments(queryClient, orderId)
}
