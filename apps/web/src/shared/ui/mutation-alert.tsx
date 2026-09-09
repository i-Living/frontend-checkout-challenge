/**
 * Алерт ошибки мутации: один перевод toUserMessage на все экраны.
 */
import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { toUserMessage } from '@/shared/api/errors'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'

/**
 * Показывает destructive-алерт, если ошибка есть.
 * @param error Ошибка мутации или null/undefined.
 * @param title Заголовок алерта.
 * @param className Классы корневого Alert.
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
