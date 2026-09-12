/**
 * Корзина `/cart`. Итог — cart.subtotal с API. Пустую нельзя оформить: ссылки на /checkout нет.
 */
import { ArrowRight, ShoppingBasket } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { routes } from '@/app/routes'
import { CartLine } from '@/features/cart/cart-line'
import { useRemoveCartItem, useSetCartItem } from '@/features/cart/use-cart-mutations'
import { useCart, useProducts } from '@/shared/api/queries'
import { formatMoney } from '@/shared/lib/money'
import { pluralize } from '@/shared/lib/pluralize'
import { usePageTitle } from '@/shared/lib/use-page-title'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { MutationAlert } from '@/shared/ui/mutation-alert'
import { queryGate } from '@/shared/ui/query-gate'
import { Skeleton } from '@/shared/ui/skeleton'

/**
 * Две строки-заглушки. role=status на списке, не на каждой строке.
 */
function CartSkeleton() {
    return (
        <div className='flex flex-col gap-3' role='status'>
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
    )
}

/**
 * Пока мутация строки в полёте, «Перейти к оформлению» disabled — не уходить на чекаут со старой version.
 * @returns Страница корзины
 */
export function CartPage() {
    usePageTitle('Корзина')
    const cartQuery = useCart()
    const productsQuery = useProducts()
    const setQuantityMutation = useSetCartItem()
    const removeMutation = useRemoveCartItem()
    const stockById = useMemo(
        () => new Map((productsQuery.data ?? []).map((product) => [product.id, product.stock] as const)),
        [productsQuery.data],
    )

    const blocked = queryGate(cartQuery, {
        title: 'Корзина',
        errorTitle: 'Не удалось загрузить корзину',
        skeleton: <CartSkeleton />,
    })
    if (blocked) {
        return blocked
    }

    const cart = cartQuery.data
    if (!cart || cart.items.length === 0) {
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
                            <Button asChild className='w-full sm:w-auto' variant='outline'>
                                <Link to={routes.catalog}>Вернуться в каталог</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const mutationError = setQuantityMutation.error ?? removeMutation.error
    const isMutating = setQuantityMutation.isPending || removeMutation.isPending

    return (
        <div>
            <div className='mb-4 flex min-w-0 flex-wrap items-baseline gap-x-3'>
                <h1 className='font-semibold text-2xl tracking-tight'>Корзина</h1>
                <p className='text-muted-foreground text-sm'>
                    {cart.quantity} {pluralize(cart.quantity, 'товар', 'товара', 'товаров')}
                </p>
            </div>
            <MutationAlert className='mb-4' error={mutationError} title='Не удалось обновить корзину' />
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
                                    stock={stockById.get(item.productId) ?? 99}
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
                                    <Link to={routes.checkout}>
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
