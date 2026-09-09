/**
 * Декоративная визуальная плашка товара каталога (градиент + иконка по id).
 * API картинок не отдаёт, поэтому визуал генерируется локально: детерминирован,
 * ничего не весит и не зависит от внешней сети.
 */
import { AlarmClock, Coffee, Lamp, type LucideIcon, Package, ShoppingBag } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

/**
 * Визуальная тема товара: иконка, градиент плашки и цвет иконки.
 */
interface ProductVisualTheme {
    /** Иконка товара. */
    icon: LucideIcon
    /** Классы градиента фона плашки. */
    gradient: string
    /** Классы цвета иконки. */
    iconClass: string
}

/**
 * Тема визуала по умолчанию для неизвестных товаров: нейтральная посылка,
 * чтобы не путаться с иконками реальных позиций каталога.
 */
const fallbackTheme: ProductVisualTheme = {
    icon: Package,
    gradient: 'from-primary/15 via-primary/5 to-transparent',
    iconClass: 'text-primary',
}

/**
 * Темы визуалов по идентификаторам товаров каталога.
 */
const themes: Record<string, ProductVisualTheme> = {
    'lamp-orbit': {
        icon: Lamp,
        gradient: 'from-amber-400/25 via-amber-500/10 to-transparent',
        iconClass: 'text-amber-500 dark:text-amber-400',
    },
    'mug-line': {
        icon: Coffee,
        gradient: 'from-orange-400/25 via-orange-500/10 to-transparent',
        iconClass: 'text-orange-500 dark:text-orange-400',
    },
    'bag-day': {
        icon: ShoppingBag,
        gradient: 'from-teal-400/25 via-teal-500/10 to-transparent',
        iconClass: 'text-teal-600 dark:text-teal-400',
    },
    'clock-dot': {
        icon: AlarmClock,
        gradient: 'from-slate-400/25 via-slate-500/10 to-transparent',
        iconClass: 'text-slate-500 dark:text-slate-400',
    },
}

/**
 * Плашка 16:10 с градиентом и контурной иконкой товара.
 * @param productId Идентификатор товара для выбора темы
 * @returns Декоративный блок визуала
 */
export function ProductVisual({ productId }: { productId: string }) {
    const theme = themes[productId] ?? fallbackTheme
    const Icon = theme.icon
    return (
        <div
            aria-hidden='true'
            className={cn('flex h-36 items-center justify-center bg-gradient-to-br', theme.gradient)}
        >
            <Icon className={cn('size-16', theme.iconClass)} strokeWidth={1.25} />
        </div>
    )
}
