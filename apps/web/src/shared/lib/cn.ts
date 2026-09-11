/**
 * Склейка className. Без twMerge конфликтующие утилиты Tailwind останутся обе (`px-4 px-2`).
 */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * clsx + twMerge: при конфликте побеждает последний класс.
 * Не собирать className через шаблонный тернарный — Biome требует cn().
 * @param inputs Классы, условия и объекты clsx (`'px-4'`, isActive && `'font-bold'`).
 * @returns Одна строка; `cn('px-4', 'px-2')` → `'px-2'`.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
