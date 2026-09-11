/**
 * Поле формы: подпись, контрол и ошибка через id / aria.
 * Ребёнок должен быть один — cloneElement вешает id на него, не на обёртку.
 */
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { Label } from '@/shared/ui/label'

/**
 * Клонирует ребёнка и ставит id, aria-invalid, aria-describedby.
 * Без этого Label htmlFor и текст ошибки не связаны с контролом.
 * @param id Общий id контрола и htmlFor; ошибка живёт на `${id}-error`.
 * @param label Видимая подпись. Не дублировать placeholder'ом.
 * @param error Текст под полем; пусто — aria-invalid=false и без describedby.
 * @param children Ровно один Input/select. Фрагмент или два узла сломают cloneElement.
 */
export function FormField({
    id,
    label,
    error,
    children,
}: {
    id: string
    label: string
    error?: string
    children: ReactElement
}): ReactNode {
    const errorId = `${id}-error`
    const control = isValidElement(children)
        ? cloneElement(children as ReactElement<Record<string, unknown>>, {
              id,
              'aria-invalid': Boolean(error),
              'aria-describedby': error ? errorId : undefined,
          })
        : children
    return (
        <div className='flex min-w-0 flex-col gap-1.5'>
            <Label htmlFor={id}>{label}</Label>
            {control}
            {error ? (
                <p className='text-destructive text-sm' id={errorId} role='alert'>
                    {error}
                </p>
            ) : null}
        </div>
    )
}
