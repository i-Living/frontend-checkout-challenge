/**
 * Страница 404: неизвестный адрес.
 */
import { Link } from 'react-router'
import { usePageTitle } from '@/shared/lib/use-page-title'
import { Button } from '@/shared/ui/button'

/**
 * Заглушка неизвестного маршрута со ссылкой в каталог.
 * @returns Разметка страницы 404
 */
export function NotFoundPage() {
    usePageTitle('Страница не найдена')
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
