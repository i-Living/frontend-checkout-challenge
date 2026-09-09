export function formatMoney(kopecks: number, currency: 'RUB' = 'RUB') {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(kopecks / 100)
}
