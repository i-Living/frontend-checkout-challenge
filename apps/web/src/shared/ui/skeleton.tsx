/**
 * Заглушка загрузки. Сам по себе без role=status — его ставит обёртка страницы, чтобы не плодить live-регионы.
 */
import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * Пульсирующий блок. Размер задаёт className (h/w), не пропсы.
 */
function Skeleton({ className, ...props }: ComponentProps<'div'>) {
    return <div data-slot='skeleton' className={cn('bg-accent animate-pulse rounded-md', className)} {...props} />
}

export { Skeleton }
