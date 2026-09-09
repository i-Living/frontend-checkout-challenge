import type { getSandbox } from '@/shared/api/endpoints'
import { Label } from '@/shared/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'

type SandboxCard = Awaited<ReturnType<typeof getSandbox>>['cards'][number]

type CardPickerProps = {
    cards: SandboxCard[]
    value: string
    disabled?: boolean
    onChange: (card: SandboxCard) => void
}

export function CardPicker({ cards, value, disabled, onChange }: CardPickerProps) {
    return (
        <fieldset className='flex flex-col gap-3' disabled={disabled}>
            <legend className='text-sm font-medium'>Карта</legend>
            <RadioGroup
                value={value || undefined}
                disabled={disabled}
                onValueChange={(id) => {
                    const card = cards.find((item) => item.id === id)
                    if (card) {
                        onChange(card)
                    }
                }}
            >
                {cards.map((card) => {
                    const fieldId = `sandbox-card-${card.id}`
                    return (
                        <div key={card.id} className='flex min-h-11 items-center gap-3'>
                            <RadioGroupItem id={fieldId} value={card.id} />
                            <Label htmlFor={fieldId} className='font-normal'>
                                {card.title} {card.maskedNumber}
                            </Label>
                        </div>
                    )
                })}
            </RadioGroup>
        </fieldset>
    )
}
