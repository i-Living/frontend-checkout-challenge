/**
 * Утилиты классов Tailwind: склейка условных классов через clsx и twMerge.
 */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Склеивает классы и разрешает конфликты Tailwind.
 * @param inputs - Список классов, условий и объектов clsx (например 'px-4', isActive && 'font-bold')
 * @returns Итоговая строка классов (например cn('px-4', 'px-2') → 'px-2')
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
