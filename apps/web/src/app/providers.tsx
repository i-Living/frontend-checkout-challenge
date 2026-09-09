/**
 * Провайдеры приложения: общий QueryClient и корневая обёртка Providers.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

/**
 * Общий клиент React Query с дефолтными настройками запросов и мутаций.
 */
const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5_000 },
        mutations: { retry: 0 },
    },
})

/**
 * Корневая обёртка провайдеров приложения.
 * @param props - Пропсы обёртки
 * @param props.children - Дочернее дерево приложения
 * @returns Дерево внутри QueryClientProvider
 */
export function Providers({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
