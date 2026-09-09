import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { CartLine } from '@/features/cart/cart-line'
import { deleteCartItem, getCart, putCartItem } from '@/shared/api/endpoints'
import { type ApiError, isApiError } from '@/shared/api/errors'
import { queryKeys } from '@/shared/api/query-keys'
import { formatMoney } from '@/shared/lib/money'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

function parseCount(text: string) {
    const match = /(\d+)/.exec(text)
    if (!match) {
        return undefined
    }
    return Number(match[1])
}

function insufficientStockText(error: ApiError) {
    let available: number | undefined
    if (error.fields) {
        for (const field of error.fields) {
            available = parseCount(field.message) ?? parseCount(field.path)
            if (available !== undefined) {
                break
            }
        }
    }
    available ??= parseCount(error.message)
    if (available === undefined) {
        return error.message
    }
    return `Доступно не более ${available} шт.`
}

function cartLoadErrorText(error: unknown) {
    if (isApiError(error)) {
        return error.message
    }
    return 'Не удалось загрузить корзину'
}

export function CartPage() {
    const queryClient = useQueryClient()
    const [qtyResetNonce, setQtyResetNonce] = useState(0)
    const cartQuery = useQuery({
        queryKey: queryKeys.cart(),
        queryFn: ({ signal }) => getCart(signal),
    })

    const updateQty = useMutation({
        mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
            putCartItem(productId, { quantity }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.cart() })
        },
        onError: (error) => {
            setQtyResetNonce((nonce) => nonce + 1)
            if (isApiError(error) && (error.code === 'INSUFFICIENT_STOCK' || error.code === 'CART_ITEM_NOT_FOUND')) {
                void queryClient.invalidateQueries({ queryKey: queryKeys.cart() })
            }
        },
    })

    const removeItem = useMutation({
        mutationFn: (productId: string) => deleteCartItem(productId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.cart() })
        },
        onError: (error) => {
            if (isApiError(error) && error.code === 'CART_ITEM_NOT_FOUND') {
                void queryClient.invalidateQueries({ queryKey: queryKeys.cart() })
            }
        },
    })

    const mutationPending = updateQty.isPending || removeItem.isPending
    const stockError =
        isApiError(updateQty.error) && updateQty.error.code === 'INSUFFICIENT_STOCK'
            ? insufficientStockText(updateQty.error)
            : undefined
    const inlineError =
        stockError ??
        (isApiError(updateQty.error) && updateQty.error.code !== 'CART_ITEM_NOT_FOUND'
            ? updateQty.error.message
            : undefined) ??
        (isApiError(removeItem.error) && removeItem.error.code !== 'CART_ITEM_NOT_FOUND'
            ? removeItem.error.message
            : undefined)

    if (cartQuery.isPending) {
        return (
            <div className='flex flex-col gap-4' role='status' aria-busy='true' aria-label='Загрузка корзины'>
                <Skeleton className='h-8 w-40' />
                <Skeleton className='h-20 w-full' />
                <Skeleton className='h-20 w-full' />
            </div>
        )
    }

    if (cartQuery.error) {
        return (
            <Alert variant='destructive'>
                <AlertCircle />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription className='gap-3'>
                    <p>{cartLoadErrorText(cartQuery.error)}</p>
                    <Button
                        type='button'
                        variant='outline'
                        className='h-11 min-h-11 w-full'
                        onClick={() => void cartQuery.refetch()}
                    >
                        Повторить
                    </Button>
                </AlertDescription>
            </Alert>
        )
    }

    const cart = cartQuery.data
    const items = cart?.items ?? []
    const isEmpty = items.length === 0

    return (
        <div className='flex min-w-0 flex-col gap-4'>
            <h1 className='text-2xl font-semibold'>Корзина</h1>
            {inlineError ? (
                <Alert variant='destructive'>
                    <AlertCircle />
                    <AlertTitle>Ошибка</AlertTitle>
                    <AlertDescription>{inlineError}</AlertDescription>
                </Alert>
            ) : null}
            {isEmpty ? (
                <p>Корзина пуста</p>
            ) : (
                <ul className='flex min-w-0 flex-col gap-4'>
                    {items.map((item) => (
                        <li key={item.productId} className='min-w-0'>
                            <CartLine
                                key={qtyResetNonce}
                                item={item}
                                disabled={mutationPending}
                                onQuantityChange={(quantity) => {
                                    updateQty.reset()
                                    removeItem.reset()
                                    updateQty.mutate({ productId: item.productId, quantity })
                                }}
                                onDelete={() => {
                                    updateQty.reset()
                                    removeItem.reset()
                                    removeItem.mutate(item.productId)
                                }}
                            />
                        </li>
                    ))}
                </ul>
            )}
            {cart ? <p className='text-lg font-semibold'>{formatMoney(cart.subtotal)}</p> : null}
            {isEmpty ? (
                <Button type='button' className='h-11 min-h-11 w-full' disabled>
                    Перейти к оформлению
                </Button>
            ) : (
                <Button asChild className='h-11 min-h-11 w-full'>
                    <Link to='/checkout'>Перейти к оформлению</Link>
                </Button>
            )}
        </div>
    )
}
