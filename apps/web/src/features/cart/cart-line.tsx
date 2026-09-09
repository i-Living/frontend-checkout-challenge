import { Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatMoney } from '@/shared/lib/money'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

type CartLineItem = {
    productId: string
    title: string
    quantity: number
    lineTotal: number
}

type CartLineProps = {
    item: CartLineItem
    disabled?: boolean
    onQuantityChange: (quantity: number) => void
    onDelete: () => void
}

function commitQuantity(raw: string, current: number) {
    const next = Number(raw)
    if (!Number.isInteger(next) || next < 1) {
        return current
    }
    return next
}

export function CartLine({ item, disabled = false, onQuantityChange, onDelete }: CartLineProps) {
    const [draft, setDraft] = useState(String(item.quantity))

    useEffect(() => {
        setDraft(String(item.quantity))
    }, [item.quantity])

    function applyQuantity(next: number) {
        if (next === item.quantity || next < 1) {
            setDraft(String(item.quantity))
            return
        }
        onQuantityChange(next)
    }

    return (
        <div className='flex min-w-0 flex-wrap items-center gap-3'>
            <p className='min-w-0 flex-1 basis-40 break-words font-medium'>{item.title}</p>
            <div className='flex min-w-0 flex-wrap items-center gap-2'>
                <div className='flex items-center gap-1'>
                    <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        className='size-11'
                        disabled={disabled || item.quantity <= 1}
                        aria-label='Уменьшить количество'
                        onClick={() => applyQuantity(item.quantity - 1)}
                    >
                        <Minus />
                    </Button>
                    <Input
                        type='number'
                        min={1}
                        max={99}
                        inputMode='numeric'
                        aria-label='Количество'
                        className='h-11 min-h-11 w-16 text-center'
                        value={draft}
                        disabled={disabled}
                        onChange={(event) => setDraft(event.target.value)}
                        onBlur={() => applyQuantity(commitQuantity(draft, item.quantity))}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.currentTarget.blur()
                            }
                        }}
                    />
                    <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        className='size-11'
                        disabled={disabled || item.quantity >= 99}
                        aria-label='Увеличить количество'
                        onClick={() => applyQuantity(item.quantity + 1)}
                    >
                        <Plus />
                    </Button>
                </div>
                <p className='min-w-0 shrink-0 font-semibold'>{formatMoney(item.lineTotal)}</p>
                <Button
                    type='button'
                    variant='destructive'
                    className='h-11 min-h-11'
                    disabled={disabled}
                    onClick={onDelete}
                >
                    Удалить
                </Button>
            </div>
        </div>
    )
}
