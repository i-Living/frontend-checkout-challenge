/**
 * Карточка каталога. Количество в корзине приходит снаружи — карточка не ходит в API сама.
 */
import { Minus, PackageX, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import type { Product } from '@/shared/api/endpoints'
import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { ProductVisual } from './product-visual'

/**
 * Пропсы карточки товара.
 * @property product Товар каталога; price и stock — с сервера
 * @property quantityInCart 0 = кнопки «В корзину»; >0 = степпер
 * @property onAdd Первая штука: PUT quantity = 1, не +1 к пустому
 * @property onQuantity Абсолютное число (степпер)
 * @property onRemove DELETE, не PUT 0
 * @property isPending Блок этой карточки, пока мутация именно по этому productId
 */
interface ProductCardProps {
    product: Product
    quantityInCart: number
    onAdd: () => void
    onQuantity: (quantity: number) => void
    onRemove: () => void
    isPending: boolean
}

/**
 * stock=0 — «Нет в наличии», без степпера. Плюс disabled на quantityInCart >= stock.
 * @param product Товар каталога
 * @param quantityInCart Из GET /api/cart, не локальный счётчик
 * @param onAdd Первая единица
 * @param onQuantity Абсолютное quantity
 * @param onRemove Удаление
 * @param isPending Пока PUT/DELETE этой позиции в полёте
 */
export function ProductCard({ product, quantityInCart, onAdd, onQuantity, onRemove, isPending }: ProductCardProps) {
    const outOfStock = product.stock === 0
    const inCart = quantityInCart > 0
    return (
        <Card className='group flex min-w-0 flex-col overflow-hidden pt-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg'>
            <ProductVisual productId={product.id} />
            <CardHeader className='min-w-0'>
                <CardTitle className='min-w-0 text-base leading-snug'>{product.title}</CardTitle>
                <CardDescription className='min-w-0 line-clamp-2'>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className='mt-auto flex min-w-0 flex-wrap items-center justify-between gap-2'>
                <span className='font-semibold text-lg tabular-nums tracking-tight'>{formatMoney(product.price)}</span>
                {outOfStock ? null : (
                    <span className='rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary text-xs'>
                        Осталось: {product.stock} шт.
                    </span>
                )}
            </CardContent>
            <CardFooter className='flex min-w-0 flex-wrap items-center gap-2'>
                {outOfStock ? (
                    <Button className='w-full sm:w-auto' disabled type='button'>
                        <PackageX />
                        Нет в наличии
                    </Button>
                ) : !inCart ? (
                    <Button className='w-full sm:w-auto' disabled={isPending} onClick={onAdd} type='button'>
                        <ShoppingCart />
                        {isPending ? 'Добавляем…' : 'В корзину'}
                    </Button>
                ) : (
                    <div className='flex min-w-0 flex-wrap items-center gap-1.5 rounded-full bg-muted/60 p-1 pr-2'>
                        <Button
                            aria-label={`Уменьшить количество «${product.title}»`}
                            className='size-8 min-h-8 rounded-full'
                            disabled={isPending || quantityInCart <= 1}
                            onClick={() => onQuantity(quantityInCart - 1)}
                            size='icon'
                            type='button'
                            variant='ghost'
                        >
                            <Minus aria-hidden='true' />
                        </Button>
                        <span aria-live='polite' className='min-w-6 text-center font-semibold text-sm tabular-nums'>
                            {quantityInCart}
                        </span>
                        <Button
                            aria-label={`Увеличить количество «${product.title}»`}
                            className='size-8 min-h-8 rounded-full'
                            disabled={isPending || quantityInCart >= product.stock}
                            onClick={() => onQuantity(quantityInCart + 1)}
                            size='icon'
                            type='button'
                            variant='ghost'
                        >
                            <Plus aria-hidden='true' />
                        </Button>
                        <span className='mx-1 h-4 w-px bg-border' />
                        <Button
                            aria-label={`Удалить «${product.title}» из корзины`}
                            className='size-8 min-h-8 rounded-full text-muted-foreground hover:text-destructive'
                            disabled={isPending}
                            onClick={onRemove}
                            size='icon'
                            title='Удалить из корзины'
                            type='button'
                            variant='ghost'
                        >
                            <Trash2 aria-hidden='true' />
                        </Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}
