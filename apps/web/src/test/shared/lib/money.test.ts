import { describe, expect, it } from 'vitest'
import { formatMoney } from '@/shared/lib/money'

describe('formatMoney', () => {
    it('делит копейки на 100 и форматирует как рубли', () => {
        const expected = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(2490)
        expect(formatMoney(249000)).toBe(expected)
    })

    it('форматирует ноль', () => {
        const expected = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(0)
        expect(formatMoney(0)).toBe(expected)
    })
})
