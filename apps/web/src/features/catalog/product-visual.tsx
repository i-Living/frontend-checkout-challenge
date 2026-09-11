/**
 * Плашка товара. API картинок не отдаёт — визуал локальный, детерминированный по productId,
 * без сети и без случайных градиентов (F5 не меняет картинку).
 */
import { AlarmClock, Coffee, Lamp, type LucideIcon, Package, ShoppingBag } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

/**
 * Тема плашки. gradient — только Tailwind from/via/to, без url().
 */
interface ProductVisualTheme {
    /** Иконка Lucide, не img. */
    icon: LucideIcon
    /** Классы градиента, стыкуются с `bg-gradient-to-br`. */
    gradient: string
    /** Цвет иконки, отдельно от фона — в dark нужен другой оттенок. */
    iconClass: string
}

/**
 * Неизвестный id (новый товар в API) — нейтральная посылка, не чужая иконка из каталога.
 */
const fallbackTheme: ProductVisualTheme = {
    icon: Package,
    gradient: 'from-primary/15 via-primary/5 to-transparent',
    iconClass: 'text-primary',
}

/**
 * Ключи — id из GET /api/products, не title. Новый sku без записи сюда получит fallback.
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
 * aria-hidden: декорация, название товара уже в CardTitle.
 * @param productId Id из каталога
 * @returns Плашка h-36, не квадрат — карточки выравниваются по низу сетки
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
