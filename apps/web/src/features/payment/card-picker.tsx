/**
 * Выбор тестовой карты для оплаты заказа.
 */
import type { Sandbox } from '@/shared/api/endpoints'
import { Label } from '@/shared/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'

/**
 * Пропсы выбора тестовой карты.
 * @property cards список тестовых карт песочницы
 * @property selectedId id выбранной карты
 * @property onSelect обработчик выбора карты
 * @property disabled блокировка выбора на время запроса
 */
interface CardPickerProps {
    cards: Sandbox['cards']
    selectedId: string | null
    onSelect: (id: string) => void
    disabled?: boolean
}

/**
 * Радио-список тестовых карт песочницы.
 * @param cards список тестовых карт песочницы
 * @param selectedId id выбранной карты
 * @param onSelect обработчик выбора карты
 * @param disabled блокировка выбора на время запроса
 */
export function CardPicker({ cards, selectedId, onSelect, disabled = false }: CardPickerProps) {
    return (
        <RadioGroup aria-label='Тестовая карта' disabled={disabled} onValueChange={onSelect} value={selectedId ?? ''}>
            {cards.map((card) => {
                const id = `card-${card.id}`
                const selected = selectedId === card.id
                return (
                    <div
                        className={
                            selected
                                ? 'flex min-w-0 items-center gap-3 rounded-xl border border-primary/60 bg-primary/5 p-3.5 transition-colors'
                                : 'flex min-w-0 items-center gap-3 rounded-xl border p-3.5 transition-colors hover:bg-muted/40'
                        }
                        key={card.id}
                    >
                        <RadioGroupItem disabled={disabled} id={id} value={card.id} />
                        <Label className='min-w-0 flex-1 cursor-pointer' htmlFor={id}>
                            <span className='flex min-w-0 flex-wrap items-baseline justify-between gap-2'>
                                <span className='font-medium'>{card.title}</span>
                                <span className='font-mono text-muted-foreground text-sm tabular-nums'>
                                    {card.maskedNumber}
                                </span>
                            </span>
                        </Label>
                    </div>
                )
            })}
        </RadioGroup>
    )
}
