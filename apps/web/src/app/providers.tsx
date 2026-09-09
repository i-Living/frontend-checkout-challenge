import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useEffect } from 'react'
import { ensureSession } from '@/shared/api/session'
import { TooltipProvider } from '@/shared/ui/tooltip'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5_000 },
        mutations: { retry: 0 },
    },
})

export function Providers({ children }: { children: ReactNode }) {
    useEffect(() => {
        void ensureSession()
    }, [])

    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>{children}</TooltipProvider>
        </QueryClientProvider>
    )
}
