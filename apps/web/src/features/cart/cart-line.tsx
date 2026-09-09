/**
 * Строка корзины с изменением количества и удалением позиции.
 */
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Cart } from '@/shared/api/endpoints'
import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

/**
 * Позиция корзины из API.
 */
type CartLineItem = Cart['items'][number]

/**
 * Пропсы строки корзины.
 * @property item позиция корзины
 * @property onQuantity обработчик смены количества (абсолютное значение)
 * @property onRemove обработчик удаления позиции
 * @property isPending блокировка контролов на время запроса
 */
interface CartLineProps {
    item: CartLineItem
    onQuantity: (absolute: number) => void
    onRemove: () => void
    isPending: boolean
}

/**
 * Строка корзины: название, цена, степпер количества и удаление.
 * @param item позиция корзины
 * @param onQuantity обработчик смены количества (абсолютное значение)
 * @param onRemove обработчик удаления позиции
 * @param isPending блокировка контролов на время запроса
 */
export function CartLine({ item, onQuantity, onRemove, isPending }: CartLineProps) {
    const inputId = `cart-qty-${item.productId}`
    const [draft, setDraft] = useState(String(item.quantity))

    useEffect(() => {
        setDraft(String(item.quantity))
    }, [item.quantity])

    /**
     * Проверяет и фиксирует введенное количество, приводит к диапазону 1–99.
     * @param value введенное количество
     */
    function commit(value: number) {
        if (!Number.isFinite(value)) {
            setDraft(String(item.quantity))
            return
        }
        const clamped = Math.min(99, Math.max(1, Math.trunc(value)))
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
                    className='w-16 text-center'
                    disabled={isPending}
                    id={inputId}
                    max={99}
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
                    disabled={isPending}
                    onClick={() => onQuantity(item.quantity + 1)}
                    size='icon'
                    type='button'
                    variant='outline'
                >
                    <Plus />
                </Button>
            </div>
            <p className='min-w-24 text-right font-semibold tabular-nums'>{formatMoney(item.lineTotal)}</p>
            <Button disabled={isPending} onClick={onRemove} size='sm' type='button' variant='ghost'>
                <Trash2 />
                Удалить
            </Button>
        </div>
    )
}
