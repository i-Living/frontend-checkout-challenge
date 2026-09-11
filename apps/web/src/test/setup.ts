/**
 * setupFiles Vitest. Сброс session-store и storage между тестами — иначе токен/черновик утекает в соседний it.
 * matchMedia/pointer capture/ResizeObserver — jsdom их не умеет, Radix без полифиллов падает.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { useSessionStore } from '@/shared/store/session-store'

const emptyDraft = {
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

beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    useSessionStore.setState({
        token: null,
        orderId: null,
        paymentId: null,
        draft: emptyDraft,
        lastOrder: null,
        lastPayment: null,
    })
})

afterEach(() => {
    cleanup()
})

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    }),
})

if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = () => false
    HTMLElement.prototype.setPointerCapture = () => {}
    HTMLElement.prototype.releasePointerCapture = () => {}
}

if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = () => {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
    }
}
