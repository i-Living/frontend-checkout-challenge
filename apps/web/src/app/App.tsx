/**
 * Layout: шапка со счётчиком из GET /api/cart и Outlet. Счётчик 0, пока корзина не загрузилась — не скелетон шапки.
 */
import { ShoppingBasket, Store } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'
import { ThemeToggle } from '@/features/theme/theme-toggle'
import { useCart } from '@/shared/api/queries'
import { cn } from '@/shared/lib/cn'
import { ErrorBoundary } from '@/shared/ui/error-boundary'

/**
 * ErrorBoundary вокруг Outlet: падение страницы не сносит шапку с корзиной.
 * @returns Шапка, main, подвал
 */
export function App() {
    const cartQuery = useCart()
    const count = cartQuery.data?.quantity ?? 0
    return (
        <div className='flex min-h-screen flex-col bg-[radial-gradient(60rem_30rem_at_50%_-8rem,var(--color-primary)/12%,transparent)]'>
            <header className='sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md'>
                <div className='mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-4 py-3'>
                    <NavLink
                        className='group flex min-w-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                        to='/'
                    >
                        <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-rotate-6'>
                            <Store aria-hidden='true' className='size-5' />
                        </span>
                        <span className='truncate font-semibold text-lg tracking-tight'>Магазин</span>
                    </NavLink>
                    <div className='flex shrink-0 items-center gap-1.5'>
                        <NavLink
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                                    isActive && 'border-primary/40 bg-accent',
                                )
                            }
                            to='/cart'
                        >
                            <ShoppingBasket aria-hidden='true' className='size-4' />
                            Корзина ({count})
                        </NavLink>
                        <ThemeToggle />
                    </div>
                </div>
            </header>
            <main className='mx-auto w-full min-w-0 max-w-5xl flex-1 px-4 py-6 sm:py-8'>
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </main>
            <footer className='border-t'>
                <p className='mx-auto w-full max-w-5xl px-4 py-4 text-center text-muted-foreground text-xs'>
                    Тестовый магазин · Оплата песочницей API, настоящие деньги не списываются
                </p>
            </footer>
        </div>
    )
}
