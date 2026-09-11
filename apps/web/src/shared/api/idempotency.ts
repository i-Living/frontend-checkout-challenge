/**
 * Ключи идемпотентности заказа и платежа.
 * Повтор сети (потеря ответа, двойной клик) — то же тело и тот же ключ.
 * Новая попытка (другое тело, decline/cancel, IDEMPOTENCY_CONFLICT) — новый ключ.
 */
import { v4 as uuidv4 } from 'uuid'
import { useSessionStore } from '@/shared/store/session-store'

/**
 * Новый UUID. API принимает 8–128 символов `[A-Za-z0-9_-]`; UUID в этот набор входит.
 * @returns Ключ, который ещё не отправляли с другим телом.
 */
export function newIdempotencyKey(): string {
    return uuidv4()
}

/**
 * Тот же JSON тела — тот же ключ (безопасный повтор). Другое тело — новый ключ,
 * иначе сервер ответит 409 IDEMPOTENCY_CONFLICT.
 * @param body Тело POST /api/orders; сравнение через JSON.stringify, порядок ключей должен совпадать.
 * @returns Ключ, который кладётся в заголовок Idempotency-Key.
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
 * Как у заказа, плюс привязка к orderId: ключ чужого заказа не переиспользуем.
 * @param orderId Заказ, для которого создаём попытку.
 * @param body Тело POST .../payments (у нас всегда `{}`).
 * @returns Ключ Idempotency-Key этой попытки.
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
 * После успешного создания заказа. Если не сбросить, следующая покупка уйдёт со старым ключом.
 */
export function clearOrderKey(): void {
    useSessionStore.getState().setLastOrder(null)
}

/**
 * После успешного создания платежа или PAYMENT_FINALIZED (нужен новый ключ на «Оплатить снова»).
 */
export function clearPaymentKey(): void {
    useSessionStore.getState().setLastPayment(null)
}
