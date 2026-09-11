/**
 * Поллинг GET платежа. Останавливается на succeeded|failed|cancelled и при enabled=false (уход со страницы).
 */
import { useQuery } from '@tanstack/react-query'
import { getPayment, type Payment } from '@/shared/api/endpoints'
import { keys } from '@/shared/api/query-keys'
import { orThrow } from '@/shared/lib/assert'

/**
 * Терминальные статусы. pending/processing продолжают refetchInterval; остальные — false.
 */
const TERMINAL = ['succeeded', 'failed', 'cancelled'] as const

/**
 * Узкий union для isTerminalStatus; Payment['status'] шире (есть pending/processing).
 */
type TerminalStatus = (typeof TERMINAL)[number]

/**
 * Опрос можно выключать только здесь. Decline — failed, это терминал, не HTTP-ошибка.
 * @param status status с GET /api/payments/:id
 */
function isTerminalStatus(status: Payment['status']): status is TerminalStatus {
    return (TERMINAL as readonly string[]).includes(status)
}

/**
 * Результат опроса.
 * @property payment undefined, пока нет id или первый GET не пришёл
 * @property isTerminal true → страница инвалидирует заказ и может редиректить
 */
interface PaymentPollResult {
    payment: Payment | undefined
    isTerminal: boolean
}

/**
 * Без paymentId запрос выключен. intervalMs после симуляции — Retry-After, не константа 800.
 * @param paymentId Из попытки, стора или resume списка
 * @param enabled false на наличном заказе и при размонтировании страницы
 * @param intervalMs Пауза refetchInterval, пока status pending/processing
 * @returns payment и isTerminal
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
