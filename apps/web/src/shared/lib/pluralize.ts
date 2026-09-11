/**
 * Русские формы существительного. 11–14 всегда «много» (11 товаров, не 11 товар).
 * @param count Количество; знак игнорируется.
 * @param one Форма для 1, 21, 31… (`товар`).
 * @param few Форма для 2–4, 22–24… (`товара`).
 * @param many Форма для 0, 5–20, 11–14 (`товаров`).
 * @returns Одна из трёх строк, без самого числа.
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
