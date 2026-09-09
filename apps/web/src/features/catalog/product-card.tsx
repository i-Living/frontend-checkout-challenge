import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'

type ProductCardProps = {
    product: {
        id: string
        title: string
        description: string
        price: number
        stock: number
    }
    currentInCart: number
    isPending?: boolean
    onAdd: () => void
}

export function ProductCard({ product, currentInCart, isPending = false, onAdd }: ProductCardProps) {
    const outOfStock = product.stock === 0
    const atLimit = currentInCart >= product.stock

    return (
        <Card className='h-full min-w-0'>
            <CardHeader>
                <CardTitle className='break-words'>{product.title}</CardTitle>
                <CardDescription className='break-words'>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col gap-1'>
                <p className='text-lg font-semibold'>{formatMoney(product.price)}</p>
                <p className='text-sm text-muted-foreground'>В наличии: {product.stock} шт.</p>
            </CardContent>
            <CardFooter className='mt-auto w-full'>
                <Button
                    type='button'
                    className='h-11 min-h-11 w-full'
                    disabled={outOfStock || atLimit || isPending}
                    onClick={onAdd}
                >
                    {outOfStock ? 'Нет в наличии' : 'В корзину'}
                </Button>
            </CardFooter>
        </Card>
    )
}
