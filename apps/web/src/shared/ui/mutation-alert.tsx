/**
 * Алерт ошибки мутации. Текст только через toUserMessage — страницы не мапят code сами.
 */
import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { toUserMessage } from '@/shared/api/errors'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'

/**
 * `error == null` → ничего (не пустой Alert). stale-ошибку оплаты отфильтровывает страница, не этот компонент.
 * @param error mutation.error; null/undefined скрывает блок.
 * @param title Контекст действия («Не удалось создать заказ»), код в заголовок не класть.
 * @param className Отступы на странице (mb-4), не вариант алерта.
 */
export function MutationAlert({
    error,
    title,
    className,
}: {
    error: unknown
    title: string
    className?: string
}): ReactNode {
    if (error == null) {
        return null
    }
    return (
        <Alert className={className} variant='destructive'>
            <CircleAlert />
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>{toUserMessage(error)}</AlertDescription>
        </Alert>
    )
}
