/**
 * Экран корзины (`/cart`).
 * Отвечает за строки корзины, смену количества, удаление, итог и переход к оформлению.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, CircleAlert, ShoppingBasket } from 'lucide-react'
import { Link } from 'react-router'
import { CartLine } from '@/features/cart/cart-line'
import { getCart, removeCartItem, setCartItem } from '@/shared/api/endpoints'
import { isApiError } from '@/shared/api/errors'
import { keys } from '@/shared/api/query-keys'
import { formatMoney } from '@/shared/lib/money'
import { pluralize } from '@/shared/lib/pluralize'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
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
                <h1 className='mb-4 font-semibold text-2xl tracking-tight'>Корзина</h1>
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
                <h1 className='mb-4 font-semibold text-2xl tracking-tight'>Корзина</h1>
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
                <h1 className='mb-4 font-semibold text-2xl tracking-tight'>Корзина</h1>
                <Card className='min-w-0 max-w-xl'>
                    <CardContent className='flex min-w-0 flex-col items-center gap-3 py-10 text-center'>
                        <span className='flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground'>
                            <ShoppingBasket aria-hidden='true' className='size-7' />
                        </span>
                        <p className='font-medium'>Корзина пуста</p>
                        <p className='max-w-sm text-muted-foreground text-sm'>
                            Загляните в каталог и добавьте что-нибудь — оформление займёт пару минут.
                        </p>
                        <div className='mt-2 flex min-w-0 flex-wrap justify-center gap-2'>
                            <Button className='w-full sm:w-auto' disabled type='button'>
                                Перейти к оформлению
                            </Button>
                            <Button asChild className='w-full sm:w-auto' variant='outline'>
                                <Link to='/'>Вернуться в каталог</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div>
            <div className='mb-4 flex min-w-0 flex-wrap items-baseline gap-x-3'>
                <h1 className='font-semibold text-2xl tracking-tight'>Корзина</h1>
                <p className='text-muted-foreground text-sm'>
                    {cart.quantity} {pluralize(cart.quantity, 'товар', 'товара', 'товаров')}
                </p>
            </div>
            {mutationError !== null && (
                <Alert className='mb-4' variant='destructive'>
                    <CircleAlert />
                    <AlertTitle>Не удалось обновить корзину</AlertTitle>
                    <AlertDescription>{toMutationMessage(mutationError)}</AlertDescription>
                </Alert>
            )}
            <div className='grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_320px]'>
                <Card className='min-w-0 overflow-hidden py-0'>
                    <CardContent className='min-w-0 divide-y p-0'>
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
                    </CardContent>
                </Card>
                <Card className='min-w-0 lg:sticky lg:top-24'>
                    <CardHeader>
                        <CardTitle className='text-base'>Ваш заказ</CardTitle>
                    </CardHeader>
                    <CardContent className='flex min-w-0 flex-col gap-1.5 text-sm'>
                        <p className='flex min-w-0 flex-wrap justify-between gap-2'>
                            <span className='text-muted-foreground'>Товары</span>
                            <span className='font-medium tabular-nums'>{formatMoney(cart.subtotal)}</span>
                        </p>
                        <p className='text-muted-foreground text-xs'>Доставку посчитаем на следующем шаге.</p>
                    </CardContent>
                    <CardFooter>
                        <div className='flex w-full min-w-0 flex-col gap-3'>
                            <p className='flex min-w-0 flex-wrap items-baseline justify-between gap-2'>
                                <span className='font-semibold'>Итого</span>
                                <span className='font-semibold text-xl tabular-nums tracking-tight'>
                                    {formatMoney(cart.subtotal)}
                                </span>
                            </p>
                            {isMutating ? (
                                <Button className='w-full' disabled type='button'>
                                    Перейти к оформлению
                                </Button>
                            ) : (
                                <Button asChild className='group w-full'>
                                    <Link to='/checkout'>
                                        Перейти к оформлению
                                        <ArrowRight
                                            aria-hidden='true'
                                            className='transition-transform group-hover:translate-x-0.5'
                                        />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
