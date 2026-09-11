/**
 * Мутации корзины. Одно правило инвалидации для каталога и страницы корзины —
 * иначе остаток в карточке и строки корзины разъедутся.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type CartItem, removeCartItem, setCartItem } from '@/shared/api/endpoints'
import { getErrorCode } from '@/shared/api/errors'
import { invalidateCart, invalidateCartAndProducts } from '@/shared/api/invalidate'

/** quantity абсолютный, не дельта. Страницы не вызывают setCartItem напрямую. */
export interface SetCartItemVariables {
    productId: string
    quantity: number
}

/**
 * PUT абсолютного количества. INSUFFICIENT_STOCK тоже сбрасывает каталог — stock мог измениться.
 * CART_ITEM_NOT_FOUND сбрасывает только корзину: товара в каталоге это не касается.
 */
export function useSetCartItem() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ productId, quantity }: SetCartItemVariables): Promise<CartItem> =>
            setCartItem(productId, quantity),
        onSuccess: () => {
            void invalidateCartAndProducts(queryClient)
        },
        onError: (error: unknown) => {
            const code = getErrorCode(error)
            if (code === 'INSUFFICIENT_STOCK') {
                void invalidateCartAndProducts(queryClient)
            } else if (code === 'CART_ITEM_NOT_FOUND') {
                void invalidateCart(queryClient)
            }
        },
    })
}

/**
 * DELETE позиции. Повтор на уже удалённой — 204, onError не вызовется.
 */
export function useRemoveCartItem() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (productId: string): Promise<void> => removeCartItem(productId),
        onSuccess: () => {
            void invalidateCartAndProducts(queryClient)
        },
        onError: (error: unknown) => {
            if (getErrorCode(error) === 'CART_ITEM_NOT_FOUND') {
                void invalidateCart(queryClient)
            }
        },
    })
}
