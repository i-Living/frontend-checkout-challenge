/**
 * Клиентское состояние вкладки: токен, текущий заказ/оплата, черновик чекаута, ключи идемпотентности.
 * persist в sessionStorage (`checkout.v1`) — F5 восстанавливает, закрытие вкладки нет.
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Черновик формы. deliveryMethod/paymentMethod — строки, потому что id приходят из options API,
 * а не из локального union; пустая строка = «ещё не выбрали».
 */
export interface CheckoutDraft {
    name: string
    email: string
    phone: string
    deliveryMethod: string
    paymentMethod: string
    pickupPointId: string
    city: string
    street: string
    house: string
    apartment: string
}

/**
 * Последний POST заказа: без сохранённого body нельзя понять, повтор это или новая попытка.
 */
export interface LastOrderEntry {
    key: string
    body: unknown
}

/**
 * Последний POST платежа. Ключ чужого orderId не переиспользуем.
 */
export interface LastPaymentEntry {
    orderId: string
    key: string
    body: unknown
}

/**
 * Стор сессии. Серверное состояние (корзина, заказ) сюда не кладём — оно в Query.
 */
interface SessionState {
    /** Bearer-токен POST /api/sessions. Не session id. */
    token: string | null
    /** Текущий заказ для /orders/:id и восстановления /pay без id в URL. */
    orderId: string | null
    /** Текущая попытка оплаты для поллинга после F5. */
    paymentId: string | null
    /** Поля формы чекаута: ошибка запроса не должна их стирать. */
    draft: CheckoutDraft
    /** Ключ+тело заказа для безопасного ретрая сети. */
    lastOrder: LastOrderEntry | null
    /** Ключ+тело платежа для безопасного ретрая сети. */
    lastPayment: LastPaymentEntry | null
    /**
     * Пишет токен. Не вызывать с session id из data.id.
     * @param token data.token из POST /api/sessions
     */
    setToken: (token: string) => void
    /** Сброс токена перед повторным ensureSession после 401 SESSION_*. Выхода в UI нет. */
    clearToken: () => void
    /**
     * Текущий заказ. null после ухода с оплаты, если больше не нужно resume.
     * @param orderId UUID или null
     */
    setOrder: (orderId: string | null) => void
    /**
     * Текущая попытка. null при создании нового заказа, чтобы не поллить чужой платёж.
     * @param paymentId UUID или null
     */
    setPayment: (paymentId: string | null) => void
    /**
     * Слияние черновика. Не затирает непереданные поля — иначе смена имени сбросит адрес.
     * @param patch Часть полей
     */
    patchDraft: (patch: Partial<CheckoutDraft>) => void
    /**
     * Запись для getOrCreateOrderKey. null после успеха или IDEMPOTENCY_CONFLICT.
     * @param entry Ключ и тело или null
     */
    setLastOrder: (entry: LastOrderEntry | null) => void
    /**
     * Запись для getOrCreatePaymentKey. null после успеха или PAYMENT_FINALIZED.
     * @param entry Ключ, заказ и тело или null
     */
    setLastPayment: (entry: LastPaymentEntry | null) => void
}

/**
 * Пустой черновик. Не класть тестовые контакты по умолчанию — форма должна быть пустой.
 */
const emptyDraft: CheckoutDraft = {
    name: '',
    email: '',
    phone: '',
    deliveryMethod: '',
    paymentMethod: '',
    pickupPointId: '',
    city: '',
    street: '',
    house: '',
    apartment: '',
}

/**
 * persist в sessionStorage, не localStorage: токен и черновик не должны пережить закрытие вкладки.
 */
export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            token: null,
            orderId: null,
            paymentId: null,
            draft: emptyDraft,
            lastOrder: null,
            lastPayment: null,
            setToken: (token) => set({ token }),
            clearToken: () => set({ token: null }),
            setOrder: (orderId) => set({ orderId }),
            setPayment: (paymentId) => set({ paymentId }),
            patchDraft: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
            setLastOrder: (entry) => set({ lastOrder: entry }),
            setLastPayment: (entry) => set({ lastPayment: entry }),
        }),
        {
            name: 'checkout.v1',
            storage: createJSONStorage(() => sessionStorage),
        },
    ),
)
