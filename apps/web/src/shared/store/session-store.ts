/**
 * Стор сессии: токен, текущий заказ/оплата, черновик чекаута и ключи идемпотентности в sessionStorage.
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Черновик формы чекаута: контакты, доставка, оплата и адрес.
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
 * Последняя попытка создания заказа: тело запроса и ключ идемпотентности для повтора.
 */
export interface LastOrderEntry {
    key: string
    body: unknown
}

/**
 * Последняя попытка оплаты: заказ, тело запроса и ключ идемпотентности для повтора.
 */
export interface LastPaymentEntry {
    orderId: string
    key: string
    body: unknown
}

/**
 * Состояние сессии и экшены для токена, заказа, черновика и идемпотентности.
 */
interface SessionState {
    /** Токен сессии из POST /api/sessions, подставляется в Authorization. */
    token: string | null
    /** Текущий заказ для страниц оплаты и статуса. */
    orderId: string | null
    /** Текущая оплата для отслеживания статуса. */
    paymentId: string | null
    /** Черновик формы чекаута, переживает перезагрузку вкладки. */
    draft: CheckoutDraft
    /** Последняя попытка заказа с ключом идемпотентности для безопасного ретрая. */
    lastOrder: LastOrderEntry | null
    /** Последняя попытка оплаты с ключом идемпотентности для безопасного ретрая. */
    lastPayment: LastPaymentEntry | null
    /**
     * Кладёт токен сессии.
     * @param token - Токен из POST /api/sessions
     */
    setToken: (token: string) => void
    /** Чистит токен сессии (выход). */
    clearToken: () => void
    /**
     * Кладёт текущий заказ.
     * @param orderId - Идентификатор заказа или null для сброса
     */
    setOrder: (orderId: string | null) => void
    /**
     * Кладёт текущую оплату.
     * @param paymentId - Идентификатор оплаты или null для сброса
     */
    setPayment: (paymentId: string | null) => void
    /**
     * Заменяет черновик чекаута целиком.
     * @param draft - Новый черновик формы
     */
    setDraft: (draft: CheckoutDraft) => void
    /**
     * Частично обновляет черновик чекаута.
     * @param patch - Часть полей черновика для слияния
     */
    patchDraft: (patch: Partial<CheckoutDraft>) => void
    /**
     * Кладёт последнюю попытку заказа для ретрая тем же ключом.
     * @param entry - Запись с ключом и телом или null для сброса
     */
    setLastOrder: (entry: LastOrderEntry | null) => void
    /**
     * Кладёт последнюю попытку оплаты для ретрая тем же ключом.
     * @param entry - Запись с заказом, ключом и телом или null для сброса
     */
    setLastPayment: (entry: LastPaymentEntry | null) => void
    /** Чистит обе последние попытки (заказ и оплату). */
    clearLast: () => void
}

/**
 * Пустой черновик чекаута для инициализации и сброса формы.
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
 * Хук zustand-стора сессии с персистом в sessionStorage под ключом checkout.v1.
 * Хранит токен, заказ/оплату, черновик и последние идемпотентные попытки.
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
            setDraft: (draft) => set({ draft }),
            patchDraft: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
            setLastOrder: (entry) => set({ lastOrder: entry }),
            setLastPayment: (entry) => set({ lastPayment: entry }),
            clearLast: () => set({ lastOrder: null, lastPayment: null }),
        }),
        {
            name: 'checkout.v1',
            storage: createJSONStorage(() => sessionStorage),
        },
    ),
)
