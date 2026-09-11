/**
 * Экраны загрузки и ошибки. 404 ведёт в каталог, остальные ошибки — на refetch.
 * Страницы не копируют скелетон + Alert + «Повторить».
 */
import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { isNotFoundError, toUserMessage } from '@/shared/api/errors'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'

/**
 * Заголовок + скелетон. aria-busy на корне; role=status должен быть на самом skeleton.
 * @param title Тот же h1, что у готовой страницы, чтобы вёрстка не прыгала.
 * @param skeleton Разметка со role=status.
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
 * Алерт ошибки. 404 (если передан notFoundTitle) — ссылка в каталог, не refetch:
 * повторять несуществующий заказ бессмысленно.
 * @param title h1 страницы.
 * @param errorTitle Заголовок алерта, если это не 404.
 * @param error Ошибка запроса.
 * @param onRetry refetch; для 404 игнорируется.
 * @param notFoundTitle Если задан и ошибка 404 — другая ветка UI.
 * @param notFoundDescription Пояснение 404.
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
