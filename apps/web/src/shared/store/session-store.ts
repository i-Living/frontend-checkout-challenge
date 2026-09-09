import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type IdempotencyEntry = {
    key: string
    body: unknown
}

export type SessionIdempotency = {
    orders?: IdempotencyEntry
    payments?: Record<string, IdempotencyEntry>
}

export type DeliveryMethod = 'pickup' | 'courier' | ''
export type PaymentMethod = 'card' | 'cash_on_delivery' | ''

export type CheckoutAddress = {
    city: string
    street: string
    house: string
    apartment: string
}

const emptyAddress: CheckoutAddress = {
    city: '',
    street: '',
    house: '',
    apartment: '',
}

type SessionState = {
    token: string | null
    orderId: string | null
    paymentId: string | null
    idempotency: SessionIdempotency
    name: string
    email: string
    phone: string
    deliveryMethod: DeliveryMethod
    pickupPointId: string
    address: CheckoutAddress
    paymentMethod: PaymentMethod
    setToken: (token: string | null) => void
    setOrderId: (orderId: string | null) => void
    setPaymentId: (paymentId: string | null) => void
    setOrderIdempotency: (entry: IdempotencyEntry | undefined) => void
    setPaymentIdempotency: (orderId: string, entry: IdempotencyEntry | undefined) => void
    setName: (name: string) => void
    setEmail: (email: string) => void
    setPhone: (phone: string) => void
    setDeliveryMethod: (deliveryMethod: DeliveryMethod) => void
    setPickupPointId: (pickupPointId: string) => void
    setAddress: (patch: Partial<CheckoutAddress>) => void
    setPaymentMethod: (paymentMethod: PaymentMethod) => void
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            token: null,
            orderId: null,
            paymentId: null,
            idempotency: {},
            name: '',
            email: '',
            phone: '',
            deliveryMethod: '',
            pickupPointId: '',
            address: emptyAddress,
            paymentMethod: '',
            setToken: (token) => set({ token }),
            setOrderId: (orderId) => set({ orderId }),
            setPaymentId: (paymentId) => set({ paymentId }),
            setOrderIdempotency: (entry) =>
                set((state) => ({
                    idempotency: { ...state.idempotency, orders: entry },
                })),
            setPaymentIdempotency: (orderId, entry) =>
                set((state) => {
                    const payments = { ...state.idempotency.payments }
                    if (entry) {
                        payments[orderId] = entry
                    } else {
                        delete payments[orderId]
                    }
                    return { idempotency: { ...state.idempotency, payments } }
                }),
            setName: (name) => set({ name }),
            setEmail: (email) => set({ email }),
            setPhone: (phone) => set({ phone }),
            setDeliveryMethod: (deliveryMethod) => set({ deliveryMethod }),
            setPickupPointId: (pickupPointId) => set({ pickupPointId }),
            setAddress: (patch) => set((state) => ({ address: { ...state.address, ...patch } })),
            setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
        }),
        {
            name: 'checkout.v1',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                token: state.token,
                orderId: state.orderId,
                paymentId: state.paymentId,
                idempotency: state.idempotency,
                name: state.name,
                email: state.email,
                phone: state.phone,
                deliveryMethod: state.deliveryMethod,
                pickupPointId: state.pickupPointId,
                address: state.address,
                paymentMethod: state.paymentMethod,
            }),
        },
    ),
)

export function waitForPersist() {
    if (useSessionStore.persist.hasHydrated()) {
        return Promise.resolve()
    }
    return new Promise<void>((resolve) => {
        const unsub = useSessionStore.persist.onFinishHydration(() => {
            unsub()
            resolve()
        })
        if (useSessionStore.persist.hasHydrated()) {
            unsub()
            resolve()
        }
    })
}
