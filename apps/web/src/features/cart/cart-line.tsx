/**
 * Строка корзины. Количество на сервер — абсолютное; локальный draft не шлётся, пока не blur/Enter.
 */
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Cart } from '@/shared/api/endpoints'
import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

/**
 * Элемент cart.items. lineTotal и unitPrice — с сервера, не считать на клиенте.
 */
type CartLineItem = Cart['items'][number]

/**
 * Пропсы строки корзины.
 * @property item Позиция из GET /api/cart, не из каталога
 * @property onQuantity Абсолютное quantity на PUT, не дельта
 * @property onRemove DELETE позиции
 * @property isPending Блокировка этой строки, не всей корзины
 */
interface CartLineProps {
    item: CartLineItem
    /** Остаток из каталога. Нет в корзине API; 99 — запасной потолок, лучше передать stock. */
    stock?: number
    onQuantity: (absolute: number) => void
    onRemove: () => void
    isPending: boolean
}

/**
 * Степпер и input type=number. Значение фиксируется на blur/Enter и клампится в 1…stock.
 * @param item Позиция корзины
 * @param stock Остаток; плюс disabled на верхней границе
 * @param onQuantity Абсолютное число после клампа
 * @param onRemove Удаление
 * @param isPending Блок кнопок и input на время PUT/DELETE этой строки
 */
export function CartLine({ item, stock = 99, onQuantity, onRemove, isPending }: CartLineProps) {
    const inputId = `cart-qty-${item.productId}`
    const max = Math.max(1, Math.min(99, stock))
    const [draft, setDraft] = useState(String(item.quantity))

    useEffect(() => {
        setDraft(String(item.quantity))
    }, [item.quantity])

    /**
     * NaN → откат к item.quantity без запроса. То же число, что уже в корзине — PUT не шлём.
     * @param value valueAsNumber инпута
     */
    function commit(value: number) {
        if (!Number.isFinite(value)) {
            setDraft(String(item.quantity))
            return
        }
        const clamped = Math.min(max, Math.max(1, Math.trunc(value)))
        setDraft(String(clamped))
        if (clamped !== item.quantity) {
            onQuantity(clamped)
        }
    }

    return (
        <div className='flex min-w-0 flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 sm:px-5'>
            <div className='min-w-0 flex-1 basis-48'>
                <p className='truncate font-medium'>{item.title}</p>
                <p className='text-muted-foreground text-sm'>{formatMoney(item.unitPrice)} / шт.</p>
            </div>
            <div className='flex min-w-0 items-center gap-1'>
                <Label className='sr-only' htmlFor={inputId}>
                    Количество
                </Label>
                <Button
                    aria-label='Уменьшить количество'
                    disabled={isPending || item.quantity <= 1}
                    onClick={() => onQuantity(item.quantity - 1)}
                    size='icon'
                    type='button'
                    variant='outline'
                >
                    <Minus />
                </Button>
                <Input
                    aria-describedby={`cart-qty-hint-${item.productId}`}
                    className='w-16 text-center'
                    disabled={isPending}
                    id={inputId}
                    max={max}
                    min={1}
                    onBlur={(event) => commit(event.target.valueAsNumber)}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            commit(event.currentTarget.valueAsNumber)
                        }
                    }}
                    type='number'
                    value={draft}
                />
                <Button
                    aria-label='Увеличить количество'
                    disabled={isPending || item.quantity >= max}
                    onClick={() => onQuantity(item.quantity + 1)}
                    size='icon'
                    type='button'
                    variant='outline'
                >
                    <Plus />
                </Button>
            </div>
            <p className='sr-only' id={`cart-qty-hint-${item.productId}`}>
                От 1 до {max} шт.
            </p>
            <p className='min-w-24 text-right font-semibold tabular-nums'>{formatMoney(item.lineTotal)}</p>
            <Button disabled={isPending} onClick={onRemove} size='sm' type='button' variant='ghost'>
                <Trash2 />
                Удалить
            </Button>
        </div>
    )
}
