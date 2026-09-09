/**
 * Граница ошибок: ловит падения рендера ниже по дереву,
 * чтобы вместо белого экрана показать запасной экран с действиями.
 */
import { Component, type ReactNode } from 'react'
import { useRouteError } from 'react-router'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'

/**
 * Запасной экран при падении рендера.
 * @param onRetry сброс ошибки и повторный рендер
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
 * Состояние границы ошибок.
 */
interface ErrorBoundaryState {
    error: unknown | null
}

/**
 * Классовая граница ошибок для падений рендера дочернего дерева.
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
 * Запасной экран для ошибок роута (errorElement): показывает ту же карточку,
 * повтор — через перезагрузку страницы.
 * @returns Разметка ошибки роута
 */
export function RouteError() {
    const error = useRouteError()
    console.error('Route error:', error)
    return <ErrorFallback onRetry={() => window.location.reload()} />
}
