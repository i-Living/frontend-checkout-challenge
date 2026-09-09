/**
 * Выбирает форму слова по числу по правилам русского языка.
 * @param count - Количество (например 1, 3, 5)
 * @param one - Форма для 1 (например 'товар')
 * @param few - Форма для 2-4 (например 'товара')
 * @param many - Форма для 0 и 5+ (например 'товаров')
 * @returns Подходящая форма (например pluralize(3, 'товар', 'товара', 'товаров') → 'товара')
 */
export function pluralize(count: number, one: string, few: string, many: string) {
    const mod10 = Math.abs(count) % 10
    const mod100 = Math.abs(count) % 100
    if (mod10 === 1 && mod100 !== 11) {
        return one
    }
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
        return few
    }
    return many
}
