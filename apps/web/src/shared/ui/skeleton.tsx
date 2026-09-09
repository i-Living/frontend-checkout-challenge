/**
 * Примитив скелетона: пульсирующая заглушка на время загрузки.
 */
import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * Заглушка загрузки с пульсацией (например карточки каталога).
 */
function Skeleton({ className, ...props }: ComponentProps<'div'>) {
    return <div data-slot='skeleton' className={cn('bg-accent animate-pulse rounded-md', className)} {...props} />
}

export { Skeleton }
