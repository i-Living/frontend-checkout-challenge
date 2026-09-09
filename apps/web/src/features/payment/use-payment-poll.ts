/**
 * Поллинг статуса платежа до терминального состояния.
 */
import { useQuery } from '@tanstack/react-query'
import { getPayment, type Payment } from '@/shared/api/endpoints'
import { keys } from '@/shared/api/query-keys'
import { orThrow } from '@/shared/lib/assert'

/**
 * Терминальные статусы платежа, при которых опрос останавливается.
 */
const TERMINAL = ['succeeded', 'failed', 'cancelled'] as const

/**
 * Терминальный статус платежа.
 */
type TerminalStatus = (typeof TERMINAL)[number]

/**
 * Проверяет, является ли статус терминальным.
 * @param status статус платежа с сервера
 */
function isTerminalStatus(status: Payment['status']): status is TerminalStatus {
    return (TERMINAL as readonly string[]).includes(status)
}

/**
 * Результат опроса платежа.
 * @property payment текущий платеж или undefined до загрузки
 * @property isTerminal достиг ли платеж терминального статуса
 */
interface PaymentPollResult {
    payment: Payment | undefined
    isTerminal: boolean
}

/**
 * Опрашивает статус платежа до терминального состояния.
 * @param paymentId id платежа или пустое значение
 * @param enabled разрешен ли опрос
 * @param intervalMs пауза между опросами (по умолчанию 800; после simulations
 * подставляется серверный Retry-After)
 * @returns текущий платеж и флаг терминального состояния
 */
export function usePaymentPoll(
    paymentId: string | null | undefined,
    enabled = true,
    intervalMs = 800,
): PaymentPollResult {
    const pollQuery = useQuery({
        queryKey: keys.payment(paymentId ?? undefined),
        queryFn: ({ signal }) => getPayment(orThrow(paymentId ?? undefined, 'paymentId'), signal),
        enabled: Boolean(paymentId) && enabled,
        refetchInterval: (query) => {
            const status = query.state.data?.status
            if (status === 'pending' || status === 'processing') {
                return intervalMs
            }
            return false
        },
    })
    const payment = pollQuery.data
    return { payment, isTerminal: payment ? isTerminalStatus(payment.status) : false }
}
