/**
 * Экран каталога (`/`).
 * Список товаров со степпером количества и удалением прямо в карточке.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleAlert } from 'lucide-react'
import { ProductCard } from '@/features/catalog/product-card'
import { getCart, listProducts, type Product, removeCartItem, setCartItem } from '@/shared/api/endpoints'
import { isApiError } from '@/shared/api/errors'
import { keys } from '@/shared/api/query-keys'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

interface SetCartItemVariables {
    productId: string
    quantity: number
}

/**
 * Экран каталога (`/`): сетка товаров с количеством в корзине.
 * Пропсов нет. Ветки: скелетон, ошибка загрузки с повтором, сетка; ошибка изменения — алертом.
 * @returns Разметка страницы каталога
 */
export function CatalogPage() {
    const queryClient = useQueryClient()
    const productsQuery = useQuery({
        queryKey: keys.products,
        queryFn: ({ signal }) => listProducts(signal),
    })
    const cartQuery = useQuery({
        queryKey: keys.cart,
        queryFn: ({ signal }) => getCart(signal),
    })
    const setItemMutation = useMutation({
        mutationFn: ({ productId, quantity }: SetCartItemVariables) => setCartItem(productId, quantity),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: keys.cart })
        },
        onError: (error: unknown) => {
            if (isApiError(error) && error.code === 'INSUFFICIENT_STOCK') {
                void queryClient.invalidateQueries({ queryKey: keys.cart })
                void queryClient.invalidateQueries({ queryKey: keys.products })
            }
        },
    })

    const removeMutation = useMutation({
        mutationFn: ({ productId }: { productId: string }) => removeCartItem(productId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: keys.cart })
        },
    })

    /**
     * Добавляет единицу товара к текущему количеству в корзине.
     * @param product Товар из каталога
     * @returns void
     */
    function add(product: Product) {
        const current = cartQuery.data?.items.find((item) => item.productId === product.id)?.quantity ?? 0
        const quantity = current + 1
        setItemMutation.mutate({ productId: product.id, quantity })
    }

    /**
     * Устанавливает абсолютное количество товара в корзине (степпер карточки).
     * @param productId Идентификатор товара
     * @param quantity Новое абсолютное количество
     * @returns void
     */
    function setQuantity(productId: string, quantity: number) {
        setItemMutation.mutate({ productId, quantity })
    }

    /**
     * Удаляет позицию товара из корзины.
     * @param productId Идентификатор товара
     * @returns void
     */
    function remove(productId: string) {
        removeMutation.mutate({ productId })
    }

    if (productsQuery.isPending) {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-xl'>Каталог</h1>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    {[0, 1, 2, 3].map((index) => (
                        <div className='flex min-w-0 flex-col gap-2 rounded-xl border p-6' key={index}>
                            <Skeleton className='h-5 w-2/3' />
                            <Skeleton className='h-4 w-full' />
                            <Skeleton className='h-4 w-1/3' />
                            <Skeleton className='h-9 w-32' />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (productsQuery.isError) {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-xl'>Каталог</h1>
                <Alert variant='destructive'>
                    <CircleAlert />
                    <AlertTitle>Не удалось загрузить каталог</AlertTitle>
                    <AlertDescription>
                        {isApiError(productsQuery.error) ? productsQuery.error.message : 'Попробуйте ещё раз.'}
                    </AlertDescription>
                </Alert>
                <Button className='mt-4 w-full sm:w-auto' onClick={() => void productsQuery.refetch()} type='button'>
                    Повторить
                </Button>
            </div>
        )
    }

    /** Ошибка любой мутации корзины (количество или удаление). */
    const mutationError = setItemMutation.error ?? removeMutation.error
    /** Есть ли незавершённый запрос корзины (блокирует повторные клики). */
    const isCartPending = setItemMutation.isPending || removeMutation.isPending
    return (
        <div>
            <h1 className='mb-4 font-semibold text-xl'>Каталог</h1>
            {setItemMutation.isError || removeMutation.isError ? (
                <Alert className='mb-4' variant='destructive'>
                    <CircleAlert />
                    <AlertTitle>Не удалось обновить корзину</AlertTitle>
                    <AlertDescription>
                        {isApiError(mutationError) ? mutationError.message : 'Попробуйте ещё раз.'}
                    </AlertDescription>
                </Alert>
            ) : null}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {productsQuery.data.map((product) => {
                    const quantityInCart =
                        cartQuery.data?.items.find((item) => item.productId === product.id)?.quantity ?? 0
                    const isSetPending =
                        setItemMutation.isPending && setItemMutation.variables?.productId === product.id
                    const isRemovePending =
                        removeMutation.isPending && removeMutation.variables?.productId === product.id
                    return (
                        <ProductCard
                            isPending={isCartPending && (isSetPending || isRemovePending)}
                            key={product.id}
                            onAdd={() => add(product)}
                            onQuantity={(quantity) => setQuantity(product.id, quantity)}
                            onRemove={() => remove(product.id)}
                            product={product}
                            quantityInCart={quantityInCart}
                        />
                    )
                })}
            </div>
        </div>
    )
}
