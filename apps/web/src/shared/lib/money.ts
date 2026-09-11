/**
 * Суммы API — целые копейки, валюта RUB. Итоги и доставку не считать на клиенте: брать из quote/order/cart.
 * @param kopecks Целое из API (249000 = 2 490 ₽), не рубли.
 * @param currency Пока только RUB; форматтер кэшируется по коду.
 * @returns Строка ru-RU, например «2 490,00 ₽». Неразрывные пробелы — учитывать в тестах.
 */
/** Кэш Intl.NumberFormat: конструктор тяжёлый, карточки каталога зовут formatMoney на каждый рендер. */
const formatters = new Map<string, Intl.NumberFormat>()

export function formatMoney(kopecks: number, currency: 'RUB' = 'RUB') {
    let formatter = formatters.get(currency)
    if (!formatter) {
        formatter = new Intl.NumberFormat('ru-RU', { style: 'currency', currency })
        formatters.set(currency, formatter)
    }
    return formatter.format(kopecks / 100)
}
