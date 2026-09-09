/**
 * Форматирует сумму в копейках в рубли по локали ru-RU.
 * @param kopecks - Сумма в копейках (например 249000)
 * @param currency - Код валюты, по умолчанию 'RUB'
 * @returns Строка суммы (например formatMoney(249000) → «2 490,00 ₽»)
 */
export function formatMoney(kopecks: number, currency: 'RUB' = 'RUB') {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(kopecks / 100)
}
