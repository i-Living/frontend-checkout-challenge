/**
 * Выбор тестовой карты для оплаты заказа.
 */
import type { Sandbox } from '@/shared/api/endpoints'
import { OptionRadioGroup } from '@/shared/ui/option-radio-group'

/**
 * Пропсы выбора тестовой карты.
 */
interface CardPickerProps {
    cards: Sandbox['cards']
    selectedId: string | null
    onSelect: (id: string) => void
    disabled?: boolean
}

/**
 * Радио-список тестовых карт песочницы.
 */
export function CardPicker({ cards, selectedId, onSelect, disabled = false }: CardPickerProps) {
    return (
        <OptionRadioGroup
            ariaLabel='Тестовая карта'
            disabled={disabled}
            name='card'
            onChange={onSelect}
            options={cards.map((card) => ({
                id: card.id,
                title: card.title,
                description: card.maskedNumber,
            }))}
            value={selectedId ?? ''}
        />
    )
}
