/**
 * POST quote через useQuery. Ключ = version + JSON доставки: поздний ответ старого ключа
 * не пишется в новый. retry: 0 — повторный POST без спроса создал бы второй расчёт.
 */
import { type UseQueryResult, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { type CreateQuoteDelivery, createQuote, type Quote } from '@/shared/api/endpoints'
import { getErrorCode } from '@/shared/api/errors'
import { invalidateCart } from '@/shared/api/invalidate'
import { keys } from '@/shared/api/query-keys'

/**
 * Пока delivery не собран или корзина пуста — enabled=false, POST нет.
 * CART_VERSION_CONFLICT сбрасывает корзину, чтобы подтянуть новую version.
 * @param cartVersion version из GET /api/cart; undefined, пока корзина не пришла.
 * @param delivery Результат buildDelivery; null = форма неполная, ключ общий keys.quote().
 * @param enabled Страница включает, когда есть товары и полный адрес/пункт.
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
