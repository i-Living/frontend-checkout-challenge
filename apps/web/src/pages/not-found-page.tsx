/**
 * Страница 404: неизвестный адрес.
 */
import { useEffect } from 'react'
import { Link } from 'react-router'
import { Button } from '@/shared/ui/button'

/**
 * Заглушка неизвестного маршрута со ссылкой в каталог.
 * @returns Разметка страницы 404
 */
export function NotFoundPage() {
    useEffect(() => {
        document.title = 'Страница не найдена — Магазин'
    }, [])
    return (
        <div>
            <h1 className='mb-2 font-semibold text-2xl tracking-tight'>Страница не найдена</h1>
            <p className='mb-4 text-muted-foreground text-sm'>Такого адреса нет. Возможно, ссылка устарела.</p>
            <Button asChild className='w-full sm:w-auto'>
                <Link to='/'>Вернуться в каталог</Link>
            </Button>
        </div>
    )
}
