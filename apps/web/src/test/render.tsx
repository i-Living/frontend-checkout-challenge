/**
 * Рендер для тестов. Свой QueryClient на тест, retry: false — иначе 401/404 будут крутиться и таймиться.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type RenderOptions, render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { routes } from '@/app/routes'

/**
 * Новый кэш на тест. gcTime Infinity — данные не уезжают, пока assert ещё идёт.
 * @returns Клиент без retry и refetchOnWindowFocus
 */
export function createTestQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, refetchOnWindowFocus: false, gcTime: Number.POSITIVE_INFINITY },
            mutations: { retry: false },
        },
    })
}

/** route и queryClient вместо wrapper — страницы читают useParams и кэш. */
interface RenderAppOptions extends Omit<RenderOptions, 'wrapper'> {
    /** initialEntries MemoryRouter (`/orders/order-1/pay`). */
    route?: string
    /** Свой клиент, если тест смотрит invalidate/кэш. */
    queryClient?: QueryClient
}

/**
 * MemoryRouter, не BrowserRouter: jsdom без history API для createBrowserRouter.
 * @param ui Обычно <Routes>…</Routes>, не голая страница без маршрута
 * @param options route и queryClient
 * @returns RTL + queryClient этого прогона
 */
export function renderApp(ui: ReactElement, options: RenderAppOptions = {}) {
    const { route = routes.catalog, queryClient = createTestQueryClient(), ...renderOptions } = options
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
            </QueryClientProvider>
        )
    }
    return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient }
}
