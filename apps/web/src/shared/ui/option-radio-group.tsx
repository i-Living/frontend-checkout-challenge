/**
 * Радио-список вариантов: доставка, оплата, тестовые карты.
 */
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Label } from '@/shared/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'

/** Один пункт радио-списка. */
export interface RadioOption {
    id: string
    title: string
    description?: string
}

/**
 * Группа радиокнопок с подписью пункта и опциональным описанием справа.
 * @param name Префикс id пунктов.
 * @param value Выбранный id.
 * @param options Список пунктов.
 * @param onChange Выбор пункта.
 * @param legend Подпись fieldset; без неё — только aria-label.
 * @param ariaLabel Доступное имя группы, если legend нет.
 * @param disabled Блокировка на время запроса.
 */
export function OptionRadioGroup({
    name,
    value,
    options,
    onChange,
    legend,
    ariaLabel,
    disabled = false,
}: {
    name: string
    value: string
    options: RadioOption[]
    onChange: (id: string) => void
    legend?: string
    ariaLabel?: string
    disabled?: boolean
}): ReactNode {
    const group = (
        <RadioGroup
            aria-label={legend ? undefined : ariaLabel}
            className='flex min-w-0 flex-col gap-2'
            disabled={disabled}
            onValueChange={onChange}
            value={value}
        >
            {options.map((item) => {
                const id = `${name}-${item.id}`
                const selected = value === item.id
                return (
                    <div
                        className={cn(
                            'flex min-w-0 items-center gap-3 rounded-lg border p-3 transition-colors',
                            selected ? 'border-primary/60 bg-primary/5' : 'hover:bg-muted/40',
                        )}
                        key={item.id}
                    >
                        <RadioGroupItem disabled={disabled} id={id} value={item.id} />
                        <Label className='min-w-0 flex-1 cursor-pointer' htmlFor={id}>
                            {item.description ? (
                                <span className='flex min-w-0 flex-wrap items-baseline justify-between gap-2'>
                                    <span className='font-medium'>{item.title}</span>
                                    <span className='font-mono text-muted-foreground text-sm tabular-nums'>
                                        {item.description}
                                    </span>
                                </span>
                            ) : (
                                <span className='text-sm leading-none font-medium'>{item.title}</span>
                            )}
                        </Label>
                    </div>
                )
            })}
        </RadioGroup>
    )
    if (!legend) {
        return group
    }
    return (
        <fieldset className='flex min-w-0 flex-col gap-2'>
            <legend className='mb-1 font-medium text-sm'>{legend}</legend>
            {group}
        </fieldset>
    )
}
