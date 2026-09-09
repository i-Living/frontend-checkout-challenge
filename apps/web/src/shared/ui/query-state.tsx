/**
 * Общие экраны загрузки и ошибки запроса.
 * Страницы не копируют скелетон + Alert + «Повторить».
 */
import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { isNotFoundError, toUserMessage } from '@/shared/api/errors'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'

/**
 * Скелетон страницы: заголовок и переданная разметка загрузки.
 * @param title Заголовок экрана.
 * @param skeleton Содержимое со role=status.
 */
export function PagePending({ title, skeleton }: { title: string; skeleton: ReactNode }): ReactNode {
    return (
        <div aria-busy='true'>
            <h1 className='mb-4 font-semibold text-2xl tracking-tight'>{title}</h1>
            {skeleton}
        </div>
    )
}

/**
 * Экран ошибки запроса: алерт и повтор или ссылка в каталог при 404.
 * @param title Заголовок экрана.
 * @param errorTitle Заголовок алерта (не 404).
 * @param error Ошибка запроса.
 * @param onRetry Повтор запроса; для 404 не используется.
 * @param notFoundTitle Заголовок алерта при 404.
 * @param notFoundDescription Пояснение при 404.
 */
export function PageError({
    title,
    errorTitle,
    error,
    onRetry,
    notFoundTitle,
    notFoundDescription,
}: {
    title: string
    errorTitle: string
    error: unknown
    onRetry?: () => void
    notFoundTitle?: string
    notFoundDescription?: string
}): ReactNode {
    const notFound = Boolean(notFoundTitle) && isNotFoundError(error)
    return (
        <div>
            <h1 className='mb-4 font-semibold text-2xl tracking-tight'>{title}</h1>
            <Alert variant='destructive'>
                <CircleAlert />
                <AlertTitle>{notFound ? notFoundTitle : errorTitle}</AlertTitle>
                <AlertDescription>
                    {notFound ? (notFoundDescription ?? toUserMessage(error)) : toUserMessage(error)}
                </AlertDescription>
            </Alert>
            <div className='mt-4 flex min-w-0 flex-wrap gap-2'>
                {notFound ? (
                    <Button asChild className='w-full sm:w-auto'>
                        <Link to='/'>Вернуться в каталог</Link>
                    </Button>
                ) : onRetry ? (
                    <Button className='w-full sm:w-auto' onClick={() => void onRetry()} type='button'>
                        Повторить
                    </Button>
                ) : null}
            </div>
        </div>
    )
}
