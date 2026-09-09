import { useQuery } from '@tanstack/react-query'
import { getLastRetryAfterMs } from '@/shared/api/client'
import { getPayment } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/api/query-keys'

export function usePaymentPoll(paymentId: string | null) {
    return useQuery({
        queryKey: queryKeys.payment(paymentId ?? ''),
        queryFn: ({ signal }) => getPayment(paymentId!, signal),
        enabled: Boolean(paymentId),
        refetchInterval: (query) => {
            const status = query.state.data?.status
            if (status === 'pending' || status === 'processing') {
                return Math.max(getLastRetryAfterMs(), 400)
            }
            return false
        },
    })
}
