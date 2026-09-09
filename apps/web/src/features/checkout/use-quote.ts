/**
 * Расчёт доставки: POST quote, ключ по версии корзины и доставке, без молчаливого retry.
 */
import { type UseQueryResult, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { type CreateQuoteDelivery, createQuote, type Quote } from '@/shared/api/endpoints'
import { getErrorCode } from '@/shared/api/errors'
import { invalidateCart } from '@/shared/api/invalidate'
import { keys } from '@/shared/api/query-keys'

/**
 * Создаёт расчёт для текущей версии корзины и доставки.
 * Запоздавший ответ по старому ключу не затирает свежий.
 * @param cartVersion Версия корзины или undefined, пока корзина не загружена.
 * @param delivery Собранная доставка или null, пока форма неполная.
 * @param enabled Можно ли слать POST.
 */
export function useQuote(
    cartVersion: number | undefined,
    delivery: CreateQuoteDelivery | null,
    enabled: boolean,
): UseQueryResult<Quote> {
    const queryClient = useQueryClient()
    const deliveryKey = delivery ? JSON.stringify(delivery) : null
    const query = useQuery({
        queryKey:
            cartVersion === undefined || deliveryKey === null
                ? keys.quote()
                : keys.quoteByVersion(cartVersion, deliveryKey),
        queryFn: ({ signal }) => {
            if (cartVersion === undefined || delivery === null) {
                throw new Error('quote not ready')
            }
            return createQuote(cartVersion, delivery, signal)
        },
        enabled,
        retry: 0,
    })

    useEffect(() => {
        if (getErrorCode(query.error) === 'CART_VERSION_CONFLICT') {
            void invalidateCart(queryClient)
        }
    }, [query.error, queryClient])

    return query
}
