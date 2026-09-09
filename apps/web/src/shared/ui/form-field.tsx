/**
 * Поле формы: подпись, контрол и ошибка, связанные через id / aria.
 */
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { Label } from '@/shared/ui/label'

/**
 * Оборачивает контрол подписью и текстом ошибки.
 * Прокидывает id, aria-invalid и aria-describedby в единственного ребёнка.
 * @param id Идентификатор контрола и htmlFor подписи.
 * @param label Текст подписи.
 * @param error Сообщение ошибки или пусто.
 * @param children Один контрол (Input, select, …).
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
