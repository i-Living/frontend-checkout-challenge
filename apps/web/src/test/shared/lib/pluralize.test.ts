import { describe, expect, it } from 'vitest'
import { pluralize } from '@/shared/lib/pluralize'

describe('pluralize', () => {
    it('выбирает форму one для 1 и 21', () => {
        expect(pluralize(1, 'товар', 'товара', 'товаров')).toBe('товар')
        expect(pluralize(21, 'товар', 'товара', 'товаров')).toBe('товар')
    })

    it('выбирает форму few для 2–4, кроме 12–14', () => {
        expect(pluralize(2, 'товар', 'товара', 'товаров')).toBe('товара')
        expect(pluralize(3, 'товар', 'товара', 'товаров')).toBe('товара')
        expect(pluralize(4, 'товар', 'товара', 'товаров')).toBe('товара')
        expect(pluralize(22, 'товар', 'товара', 'товаров')).toBe('товара')
    })

    it('выбирает форму many для 0, 5+ и 11–14', () => {
        expect(pluralize(0, 'товар', 'товара', 'товаров')).toBe('товаров')
        expect(pluralize(5, 'товар', 'товара', 'товаров')).toBe('товаров')
        expect(pluralize(11, 'товар', 'товара', 'товаров')).toBe('товаров')
        expect(pluralize(12, 'товар', 'товара', 'товаров')).toBe('товаров')
        expect(pluralize(14, 'товар', 'товара', 'товаров')).toBe('товаров')
    })
})
