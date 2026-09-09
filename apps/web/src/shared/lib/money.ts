/**
 * Форматирует сумму в копейках в рубли по локали ru-RU.
 * @param kopecks - Сумма в копейках (например 249000)
 * @param currency - Код валюты, по умолчанию 'RUB'
 * @returns Строка суммы (например formatMoney(249000) → «2 490,00 ₽»)
 */
/** Кэш форматтеров по валюте, чтобы не создавать Intl.NumberFormat на каждый рендер. */
const formatters = new Map<string, Intl.NumberFormat>()

export function formatMoney(kopecks: number, currency: 'RUB' = 'RUB') {
    let formatter = formatters.get(currency)
    if (!formatter) {
        formatter = new Intl.NumberFormat('ru-RU', { style: 'currency', currency })
        formatters.set(currency, formatter)
    }
    return formatter.format(kopecks / 100)
}
