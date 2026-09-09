/**
 * Экран корзины (`/cart`).
 * Отвечает за строки корзины, смену количества, удаление, итог и переход к оформлению.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { CartLine } from '@/features/cart/cart-line'
import { getCart, removeCartItem, setCartItem } from '@/shared/api/endpoints'
import { isApiError } from '@/shared/api/errors'
import { keys } from '@/shared/api/query-keys'
import { formatMoney } from '@/shared/lib/money'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

interface SetQuantityVariables {
    productId: string
    quantity: number
}

/**
 * Превращает ошибку мутации корзины в текст для алерта.
 * @param error Ошибка мутации
 * @returns Текст сообщения пользователю
 */
function toMutationMessage(error: unknown): string {
    return isApiError(error) ? error.message : 'Попробуйте ещё раз.'
}

/**
 * Экран корзины (`/cart`): строки товаров, итог и переход к оформлению.
 * Пропсов нет. Ветки: скелетон, ошибка с повтором, пустая корзина, список с итогом.
 * @returns Разметка страницы корзины
 */
export function CartPage() {
    const queryClient = useQueryClient()
    const cartQuery = useQuery({
        queryKey: keys.cart,
        queryFn: ({ signal }) => getCart(signal),
    })
    const setQuantityMutation = useMutation({
        mutationFn: ({ productId, quantity }: SetQuantityVariables) => setCartItem(productId, quantity),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: keys.cart })
        },
        onError: (error: unknown) => {
            if (!isApiError(error)) {
                return
            }
            if (error.code === 'INSUFFICIENT_STOCK') {
                void queryClient.invalidateQueries({ queryKey: keys.cart })
                void queryClient.invalidateQueries({ queryKey: keys.products })
            } else if (error.code === 'CART_ITEM_NOT_FOUND') {
                void queryClient.invalidateQueries({ queryKey: keys.cart })
            }
        },
    })
    const removeMutation = useMutation({
        mutationFn: (productId: string) => removeCartItem(productId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: keys.cart })
        },
        onError: (error: unknown) => {
            if (isApiError(error) && error.code === 'CART_ITEM_NOT_FOUND') {
                void queryClient.invalidateQueries({ queryKey: keys.cart })
            }
        },
    })

    if (cartQuery.isPending) {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-xl'>Корзина</h1>
                <div className='flex flex-col gap-3'>
                    {[0, 1].map((index) => (
                        <div className='flex min-w-0 flex-wrap items-center gap-3 rounded-xl border p-4' key={index}>
                            <div className='min-w-0 flex-1 basis-48'>
                                <Skeleton className='h-5 w-2/3' />
                                <Skeleton className='mt-2 h-4 w-1/3' />
                            </div>
                            <Skeleton className='h-9 w-32' />
                            <Skeleton className='h-5 w-20' />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (cartQuery.isError) {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-xl'>Корзина</h1>
                <Alert variant='destructive'>
                    <CircleAlert />
                    <AlertTitle>Не удалось загрузить корзину</AlertTitle>
                    <AlertDescription>
                        {isApiError(cartQuery.error) ? cartQuery.error.message : 'Попробуйте ещё раз.'}
                    </AlertDescription>
                </Alert>
                <Button className='mt-4 w-full sm:w-auto' onClick={() => void cartQuery.refetch()} type='button'>
                    Повторить
                </Button>
            </div>
        )
    }

    const cart = cartQuery.data
    const mutationError = setQuantityMutation.error ?? removeMutation.error
    const isMutating = setQuantityMutation.isPending || removeMutation.isPending

    if (cart.items.length === 0) {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-xl'>Корзина</h1>
                <p className='text-muted-foreground'>Корзина пуста</p>
                <div className='mt-4 flex min-w-0 flex-wrap gap-2'>
                    <Button className='w-full sm:w-auto' disabled type='button'>
                        Перейти к оформлению
                    </Button>
                    <Button asChild className='w-full sm:w-auto' variant='outline'>
                        <Link to='/'>Вернуться в каталог</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div>
            <h1 className='mb-4 font-semibold text-xl'>Корзина</h1>
            {mutationError !== null && (
                <Alert className='mb-4' variant='destructive'>
                    <CircleAlert />
                    <AlertTitle>Не удалось обновить корзину</AlertTitle>
                    <AlertDescription>{toMutationMessage(mutationError)}</AlertDescription>
                </Alert>
            )}
            <div className='flex flex-col gap-3'>
                {cart.items.map((item) => {
                    const isRowPending =
                        (setQuantityMutation.isPending &&
                            setQuantityMutation.variables?.productId === item.productId) ||
                        (removeMutation.isPending && removeMutation.variables === item.productId)
                    return (
                        <CartLine
                            isPending={isRowPending}
                            item={item}
                            key={item.productId}
                            onQuantity={(quantity) =>
                                setQuantityMutation.mutate({ productId: item.productId, quantity })
                            }
                            onRemove={() => removeMutation.mutate(item.productId)}
                        />
                    )
                })}
            </div>
            <div className='mt-4 flex min-w-0 flex-wrap items-center justify-between gap-3'>
                <p className='font-semibold text-lg'>Итого: {formatMoney(cart.subtotal)}</p>
                {isMutating ? (
                    <Button className='w-full sm:w-auto' disabled type='button'>
                        Перейти к оформлению
                    </Button>
                ) : (
                    <Button asChild className='w-full sm:w-auto'>
                        <Link to='/checkout'>Перейти к оформлению</Link>
                    </Button>
                )}
            </div>
        </div>
    )
}
