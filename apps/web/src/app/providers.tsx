/**
 * QueryClient на модуле, не в стейте: StrictMode не должен создавать второй кэш и дублировать запросы.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

/**
 * queries retry=1, mutations retry=0: повтор POST заказа/платежа без ключа создал бы дубликат.
 * refetchOnWindowFocus выключен — quote и оплата не должны уходить сами при возврате на вкладку.
 */
const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5_000 },
        mutations: { retry: 0 },
    },
})

/**
 * Только QueryClientProvider. Роутер снаружи — ему не нужен этот клиент в конструкторе.
 * @param props.children Дерево приложения
 * @returns Дети внутри провайдера
 */
export function Providers({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
