/**
 * Ловит падение рендера. Хуки этого не умеют — нужен класс.
 * RouteError отдельно: errorElement роутера, повтор только через reload.
 */
import { Component, type ReactNode } from 'react'
import { useRouteError } from 'react-router'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'

/**
 * Запасной экран. Корзина/заказ на сервере, поэтому «продолжить» безопасно.
 * @param onRetry В ErrorBoundary — сброс state; в RouteError — location.reload.
 */
function ErrorFallback({ onRetry }: { onRetry: () => void }) {
    return (
        <Card className='min-w-0 max-w-xl'>
            <CardContent className='flex min-w-0 flex-col items-start gap-3 pt-6'>
                <h1 className='font-semibold text-2xl tracking-tight'>Что-то пошло не так</h1>
                <p className='text-muted-foreground text-sm'>
                    Страница не смогла отрисоваться. Данные заказа и корзина сохранены на сервере — можно продолжить.
                </p>
                <div className='flex min-w-0 flex-wrap gap-2'>
                    <Button className='w-full sm:w-auto' onClick={onRetry} type='button'>
                        Попробовать снова
                    </Button>
                    <Button asChild className='w-full sm:w-auto' variant='outline'>
                        <a href='/'>Вернуться в каталог</a>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * null = дети живы. Любое ненулевое значение — уже показали fallback, деталь ошибки в console.
 */
interface ErrorBoundaryState {
    error: unknown | null
}

/**
 * Оборачивает <Outlet>. Не ловит ошибки event handlers и async — только render/lifecycle.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
    state: ErrorBoundaryState = { error: null }

    static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
        return { error }
    }

    componentDidCatch(error: unknown): void {
        console.error('Render error caught by ErrorBoundary:', error)
    }

    render(): ReactNode {
        if (this.state.error !== null) {
            return <ErrorFallback onRetry={() => this.setState({ error: null })} />
        }
        return this.props.children
    }
}

/**
 * errorElement роутера. Дерево маршрута уже снято, сброс state не поможет — только reload.
 * @returns Та же карточка, что у ErrorBoundary.
 */
export function RouteError() {
    const error = useRouteError()
    console.error('Route error:', error)
    return <ErrorFallback onRetry={() => window.location.reload()} />
}
