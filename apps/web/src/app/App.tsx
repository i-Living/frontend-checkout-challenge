import { useQuery } from '@tanstack/react-query'
import { ShoppingCart } from 'lucide-react'
import { Link, Outlet } from 'react-router'
import { getCart } from '@/shared/api/endpoints'
import { queryKeys } from '@/shared/api/query-keys'

export function App() {
    const cartQuery = useQuery({
        queryKey: queryKeys.cart(),
        queryFn: ({ signal }) => getCart(signal),
    })
    const quantity = cartQuery.data?.quantity ?? 0

    return (
        <div className='min-h-screen min-w-0 bg-background text-foreground'>
            <header className='flex min-w-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3'>
                <Link
                    to='/'
                    className='rounded-sm text-lg font-semibold outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'
                >
                    Магазин
                </Link>
                <Link
                    to='/cart'
                    className='inline-flex min-h-11 items-center gap-2 rounded-sm text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'
                >
                    <ShoppingCart className='size-4' aria-hidden='true' />
                    Корзина ({quantity})
                </Link>
            </header>
            <main className='min-w-0 p-4'>
                <Outlet />
            </main>
        </div>
    )
}
