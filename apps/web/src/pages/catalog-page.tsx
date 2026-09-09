import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import { ProductCard } from '@/features/catalog/product-card'
import { getCart, listProducts, putCartItem } from '@/shared/api/endpoints'
import { isApiError } from '@/shared/api/errors'
import { queryKeys } from '@/shared/api/query-keys'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

function catalogErrorText(error: unknown) {
    if (isApiError(error) && error.code === 'PRODUCT_NOT_FOUND') {
        return 'Товар пропал, обновить каталог'
    }
    if (isApiError(error)) {
        return error.message
    }
    return 'Не удалось загрузить каталог'
}

export function CatalogPage() {
    const queryClient = useQueryClient()
    const productsQuery = useQuery({
        queryKey: queryKeys.products(),
        queryFn: ({ signal }) => listProducts(signal),
    })
    const cartQuery = useQuery({
        queryKey: queryKeys.cart(),
        queryFn: ({ signal }) => getCart(signal),
    })
    const addItem = useMutation({
        mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
            putCartItem(productId, { quantity }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.cart() })
        },
    })

    const pageError = productsQuery.error ?? addItem.error

    function retry() {
        addItem.reset()
        void productsQuery.refetch()
        void cartQuery.refetch()
    }

    if (productsQuery.isPending) {
        return (
            <div
                className='grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                role='status'
                aria-busy='true'
                aria-label='Загрузка каталога'
            >
                <Skeleton className='h-56 w-full' />
                <Skeleton className='h-56 w-full' />
                <Skeleton className='h-56 w-full' />
                <Skeleton className='h-56 w-full' />
            </div>
        )
    }

    if (pageError) {
        return (
            <Alert variant='destructive'>
                <AlertCircle />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription className='gap-3'>
                    <p>{catalogErrorText(pageError)}</p>
                    <Button type='button' variant='outline' className='h-11 min-h-11 w-full' onClick={retry}>
                        Повторить
                    </Button>
                </AlertDescription>
            </Alert>
        )
    }

    const products = productsQuery.data ?? []
    const cartItems = cartQuery.data?.items ?? []

    return (
        <div className='grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {products.map((product) => {
                const currentInCart = cartItems.find((item) => item.productId === product.id)?.quantity ?? 0
                return (
                    <ProductCard
                        key={product.id}
                        product={product}
                        currentInCart={currentInCart}
                        isPending={addItem.isPending && addItem.variables?.productId === product.id}
                        onAdd={() => {
                            addItem.mutate({ productId: product.id, quantity: currentInCart + 1 })
                        }}
                    />
                )
            })}
        </div>
    )
}
