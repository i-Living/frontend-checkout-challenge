/**
 * Корневой layout приложения: шапка со счётчиком корзины и контент текущей страницы.
 */
import { useQuery } from '@tanstack/react-query'
import { NavLink, Outlet } from 'react-router'
import { ThemeToggle } from '@/features/theme/theme-toggle'
import { getCart } from '@/shared/api/endpoints'
import { keys } from '@/shared/api/query-keys'

/**
 * Корневой компонент layout.
 * Подтягивает корзину для счётчика в шапке и рендерит активную страницу через outlet.
 * @returns Разметка шапки и контента страницы
 */
export function App() {
    const cartQuery = useQuery({
        queryKey: keys.cart,
        queryFn: ({ signal }) => getCart(signal),
    })
    const count = cartQuery.data?.quantity ?? 0
    return (
        <div className='flex min-h-screen flex-col'>
            <header className='border-b'>
                <div className='mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3'>
                    <NavLink
                        className='rounded-sm font-semibold text-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                        to='/'
                    >
                        Магазин
                    </NavLink>
                    <div className='flex items-center gap-2'>
                        <NavLink
                            className='rounded-sm text-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                            to='/cart'
                        >
                            Корзина ({count})
                        </NavLink>
                        <ThemeToggle />
                    </div>
                </div>
            </header>
            <main className='mx-auto w-full min-w-0 max-w-5xl flex-1 px-4 py-6'>
                <Outlet />
            </main>
        </div>
    )
}
