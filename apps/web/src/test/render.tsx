/**
 * Обёртки рендера для тестов: QueryClient без ретраев и MemoryRouter.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type RenderOptions, render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router'

/**
 * Создаёт изолированный QueryClient для одного теста.
 * @returns Клиент без ретраев и без фонового refetch
 */
export function createTestQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, refetchOnWindowFocus: false, gcTime: Number.POSITIVE_INFINITY },
            mutations: { retry: false },
        },
    })
}

/** Опции тестового рендера: маршрут и свой QueryClient. */
interface RenderAppOptions extends Omit<RenderOptions, 'wrapper'> {
    /** Стартовый путь MemoryRouter. */
    route?: string
    /** Свой клиент, если тесту нужно инспектировать кэш. */
    queryClient?: QueryClient
}

/**
 * Рендерит UI внутри провайдеров приложения, нужных страницам и хукам.
 * @param ui Дерево для рендера
 * @param options Маршрут и QueryClient
 * @returns Результат Testing Library плюс queryClient
 */
export function renderApp(ui: ReactElement, options: RenderAppOptions = {}) {
    const { route = '/', queryClient = createTestQueryClient(), ...renderOptions } = options
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
            </QueryClientProvider>
        )
    }
    return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient }
}
