/**
 * Ключи идемпотентности для заказов и платежей.
 * Переиспользует ключ при повторе того же тела, иначе генерирует новый.
 */
import { useSessionStore } from '@/shared/store/session-store'

/**
 * Генерирует новый уникальный ключ идемпотентности.
 * @returns Случайный UUID-ключ.
 */
export function newIdempotencyKey(): string {
    return crypto.randomUUID()
}

/**
 * Возвращает сохранённый ключ заказа для того же тела или создаёт новый.
 * @param body Тело запроса создания заказа для сравнения.
 * @returns Ключ идемпотентности заказа.
 */
export function getOrCreateOrderKey(body: unknown): string {
    const { lastOrder, setLastOrder } = useSessionStore.getState()
    const raw = JSON.stringify(body)
    if (lastOrder && JSON.stringify(lastOrder.body) === raw) {
        return lastOrder.key
    }
    const key = newIdempotencyKey()
    setLastOrder({ key, body })
    return key
}

/**
 * Возвращает сохранённый ключ платежа для того же заказа и тела или создаёт новый.
 * @param orderId Идентификатор заказа.
 * @param body Тело запроса создания платежа для сравнения.
 * @returns Ключ идемпотентности платежа.
 */
export function getOrCreatePaymentKey(orderId: string, body: unknown): string {
    const { lastPayment, setLastPayment } = useSessionStore.getState()
    const raw = JSON.stringify(body)
    if (lastPayment && lastPayment.orderId === orderId && JSON.stringify(lastPayment.body) === raw) {
        return lastPayment.key
    }
    const key = newIdempotencyKey()
    setLastPayment({ orderId, key, body })
    return key
}

/**
 * Сбрасывает сохранённый ключ заказа после успешной попытки.
 */
export function clearOrderKey(): void {
    useSessionStore.getState().setLastOrder(null)
}

/**
 * Сбрасывает сохранённый ключ платежа после успешной попытки.
 */
export function clearPaymentKey(): void {
    useSessionStore.getState().setLastPayment(null)
}
