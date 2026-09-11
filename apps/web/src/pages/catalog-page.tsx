/**
 * Каталог `/`. Добавление в серверную корзину прямо из карточки; stock=0 недоступен.
 */
import { ShoppingBag } from 'lucide-react'
import { useRemoveCartItem, useSetCartItem } from '@/features/cart/use-cart-mutations'
import { ProductCard } from '@/features/catalog/product-card'
import { useCart, useProducts } from '@/shared/api/queries'
import { pluralize } from '@/shared/lib/pluralize'
import { usePageTitle } from '@/shared/lib/use-page-title'
import { MutationAlert } from '@/shared/ui/mutation-alert'
import { queryGate } from '@/shared/ui/query-gate'
import { Skeleton } from '@/shared/ui/skeleton'

/**
 * Сетка той же колоночности, что и товары — чтобы не прыгала вёрстка.
 */
function CatalogSkeleton() {
    return (
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' role='status'>
            {[0, 1, 2, 3].map((index) => (
                <div className='flex min-w-0 flex-col gap-2 rounded-xl border p-6' key={index}>
                    <Skeleton className='h-5 w-2/3' />
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-4 w-1/3' />
                    <Skeleton className='h-9 w-32' />
                </div>
            ))}
        </div>
    )
}

/**
 * queryGate только на каталог: корзина может грузиться позже, карточки уже рисуем с quantity=0.
 * Ошибка PUT/DELETE — MutationAlert, не замена всей страницы.
 * @returns Страница каталога
 */
export function CatalogPage() {
    usePageTitle('Каталог')
    const productsQuery = useProducts()
    const cartQuery = useCart()
    const setItemMutation = useSetCartItem()
    const removeMutation = useRemoveCartItem()

    const blocked = queryGate(productsQuery, {
        title: 'Каталог',
        errorTitle: 'Не удалось загрузить каталог',
        skeleton: <CatalogSkeleton />,
    })
    if (blocked) {
        return blocked
    }

    const products = productsQuery.data ?? []
    const mutationError = setItemMutation.error ?? removeMutation.error
    const isCartPending = setItemMutation.isPending || removeMutation.isPending

    return (
        <div>
            <div className='mb-6 flex min-w-0 items-center gap-3'>
                <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                    <ShoppingBag aria-hidden='true' className='size-5' />
                </span>
                <div className='min-w-0'>
                    <h1 className='font-semibold text-2xl tracking-tight'>Каталог</h1>
                    <p className='text-muted-foreground text-sm'>
                        {products.length} {pluralize(products.length, 'товар', 'товара', 'товаров')}
                    </p>
                </div>
            </div>
            <MutationAlert className='mb-4' error={mutationError} title='Не удалось обновить корзину' />
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {products.map((product) => {
                    const quantityInCart =
                        cartQuery.data?.items.find((item) => item.productId === product.id)?.quantity ?? 0
                    const isSetPending =
                        setItemMutation.isPending && setItemMutation.variables?.productId === product.id
                    const isRemovePending = removeMutation.isPending && removeMutation.variables === product.id
                    return (
                        <ProductCard
                            isPending={isCartPending && (isSetPending || isRemovePending)}
                            key={product.id}
                            onAdd={() =>
                                setItemMutation.mutate({ productId: product.id, quantity: quantityInCart + 1 })
                            }
                            onQuantity={(quantity) => setItemMutation.mutate({ productId: product.id, quantity })}
                            onRemove={() => removeMutation.mutate(product.id)}
                            product={product}
                            quantityInCart={quantityInCart}
                        />
                    )
                })}
            </div>
        </div>
    )
}
