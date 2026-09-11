/**
 * Выбор тестовой карты. В UI только title и maskedNumber из sandbox, без PAN/CVC.
 */
import type { Sandbox } from '@/shared/api/endpoints'
import { OptionRadioGroup } from '@/shared/ui/option-radio-group'

/**
 * Карты приходят с GET /api/sandbox. Сценарий оплаты берёт страница из выбранной карты.
 */
interface CardPickerProps {
    cards: Sandbox['cards']
    selectedId: string | null
    onSelect: (id: string) => void
    disabled?: boolean
}

/**
 * description = маска (`•••• 4242`). disabled на время processing, чтобы не сменить сценарий под запросом.
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
