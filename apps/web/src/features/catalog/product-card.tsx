/**
 * Карточка товара каталога с ценой, остатком и управлением количеством в корзине.
 */
import { Minus, PackageX, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import type { Product } from '@/shared/api/endpoints'
import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'

/**
 * Пропсы карточки товара.
 * @property product товар для отображения
 * @property quantityInCart количество товара уже в корзине (0 — ещё не добавлен)
 * @property onAdd обработчик добавления первой единицы в корзину
 * @property onQuantity обработчик установки абсолютного количества
 * @property onRemove обработчик удаления позиции из корзины
 * @property isPending идёт ли сейчас запрос изменения корзины
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
 * Карточка товара: если позиции нет в корзине — кнопка «В корзину»,
 * иначе степпер количества и кнопка удаления.
 * @param product товар для отображения
 * @param quantityInCart количество товара уже в корзине
 * @param onAdd обработчик добавления первой единицы
 * @param onQuantity обработчик установки абсолютного количества
 * @param onRemove обработчик удаления позиции
 * @param isPending идёт ли сейчас запрос изменения корзины
 */
export function ProductCard({ product, quantityInCart, onAdd, onQuantity, onRemove, isPending }: ProductCardProps) {
    const outOfStock = product.stock === 0
    const inCart = quantityInCart > 0
    return (
        <Card className='flex min-w-0 flex-col'>
            <CardHeader className='min-w-0'>
                <CardTitle className='min-w-0'>{product.title}</CardTitle>
                <CardDescription className='min-w-0'>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className='flex min-w-0 flex-wrap items-baseline justify-between gap-2'>
                <span className='font-semibold'>{formatMoney(product.price)}</span>
                {outOfStock ? (
                    <span className='text-muted-foreground text-sm'>Нет в наличии</span>
                ) : (
                    <span className='text-muted-foreground text-sm'>Остаток: {product.stock} шт.</span>
                )}
            </CardContent>
            <CardFooter className='mt-auto flex min-w-0 flex-wrap items-center gap-2'>
                {outOfStock ? (
                    <Button className='w-full sm:w-auto' disabled>
                        <PackageX />
                        Нет в наличии
                    </Button>
                ) : !inCart ? (
                    <Button className='w-full sm:w-auto' disabled={isPending} onClick={onAdd} type='button'>
                        <ShoppingCart />
                        {isPending ? 'Добавляем…' : 'В корзину'}
                    </Button>
                ) : (
                    <div className='flex min-w-0 flex-wrap items-center gap-2'>
                        <Button
                            aria-label={`Уменьшить количество «${product.title}»`}
                            disabled={isPending || quantityInCart <= 1}
                            onClick={() => onQuantity(quantityInCart - 1)}
                            size='icon'
                            type='button'
                            variant='outline'
                        >
                            <Minus aria-hidden='true' />
                        </Button>
                        <span aria-live='polite' className='min-w-8 text-center font-medium'>
                            {quantityInCart}
                        </span>
                        <Button
                            aria-label={`Увеличить количество «${product.title}»`}
                            disabled={isPending || quantityInCart >= product.stock}
                            onClick={() => onQuantity(quantityInCart + 1)}
                            size='icon'
                            type='button'
                            variant='outline'
                        >
                            <Plus aria-hidden='true' />
                        </Button>
                        <Button
                            aria-label={`Удалить «${product.title}» из корзины`}
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
