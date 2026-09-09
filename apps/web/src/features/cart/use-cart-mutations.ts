/**
 * Мутации корзины: абсолютное количество и удаление.
 * Одно правило инвалидации для каталога и страницы корзины.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type CartItem, removeCartItem, setCartItem } from '@/shared/api/endpoints'
import { getErrorCode } from '@/shared/api/errors'
import { invalidateCart, invalidateCartAndProducts } from '@/shared/api/invalidate'

/** Переменные установки количества: id товара и абсолютное quantity. */
export interface SetCartItemVariables {
    productId: string
    quantity: number
}

/**
 * Ставит абсолютное количество товара в корзине.
 * После успеха обновляет корзину и каталог (остаток в карточках).
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
 * Удаляет позицию из корзины.
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
