/**
 * Фикстуры формы OpenAPI. Не урезать поля: лишний Partial в тесте маскирует, что экран ждёт title/stock.
 */
import type { Cart, CheckoutOptions, Order, Payment, Product, Quote, Sandbox } from '@/shared/api/endpoints'
import type { ApiError } from '@/shared/api/errors'
import type { CheckoutDraft } from '@/shared/store/session-store'

/** Все поля пустые — для тестов валидации и «quote ещё не слать». */
export const emptyDraft: CheckoutDraft = {
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

/** Самовывоз + карта, проходит validateDraft. Для курьера патчить method и адрес. */
export const validPickupDraft: CheckoutDraft = {
    name: 'Тестовый Покупатель',
    email: 'buyer@example.test',
    phone: '+79990000000',
    deliveryMethod: 'pickup',
    paymentMethod: 'card',
    pickupPointId: 'point-center',
    city: '',
    street: '',
    house: '',
    apartment: '',
}

/**
 * Товар по умолчанию в наличии (stock 10). Для «нет в наличии» передавать stock: 0.
 * @param overrides Частичные поля
 */
export function makeProduct(overrides: Partial<Product> = {}): Product {
    return {
        id: 'lamp-orbit',
        sku: 'LAMP-ORBIT',
        title: 'Лампа Orbit',
        description: 'Настольная лампа',
        price: 249000,
        currency: 'RUB',
        stock: 10,
        ...overrides,
    }
}

/**
 * Одна лампа, version 1. Пустая корзина — items: [], quantity: 0, subtotal: 0 (не только items).
 * @param overrides Частичные поля
 */
export function makeCart(overrides: Partial<Cart> = {}): Cart {
    return {
        id: 'cart-1',
        version: 1,
        items: [
            {
                productId: 'lamp-orbit',
                title: 'Лампа Orbit',
                unitPrice: 249000,
                quantity: 1,
                lineTotal: 249000,
            },
        ],
        quantity: 1,
        subtotal: 249000,
        currency: 'RUB',
        ...overrides,
    }
}

/**
 * Два способа доставки и две оплаты как у API. Тесты клавиатуры и пунктов опираются на эти id.
 * @param overrides Частичные поля
 */
export function makeCheckoutOptions(overrides: Partial<CheckoutOptions> = {}): CheckoutOptions {
    return {
        cart: makeCart(),
        deliveryMethods: [
            {
                id: 'pickup',
                title: 'Самовывоз',
                price: 0,
                freeFrom: null,
                pickupPoints: [
                    { id: 'point-center', title: 'Центр', address: 'Учебная, 1' },
                    { id: 'point-north', title: 'Север', address: 'Северная, 5' },
                ],
            },
            {
                id: 'courier',
                title: 'Курьер',
                price: 39000,
                freeFrom: 500000,
                pickupPoints: [],
            },
        ],
        paymentMethods: [
            { id: 'card', title: 'Картой онлайн' },
            { id: 'cash_on_delivery', title: 'Наличными при получении' },
        ],
        ...overrides,
    }
}

/**
 * Самовывоз, shipping 0. Для курьера переопределять shipping/total — не складывать на клиенте.
 * @param overrides Частичные поля
 */
export function makeQuote(overrides: Partial<Quote> = {}): Quote {
    return {
        id: 'quote-1',
        cartVersion: 1,
        items: [
            {
                productId: 'lamp-orbit',
                title: 'Лампа Orbit',
                unitPrice: 249000,
                quantity: 1,
                lineTotal: 249000,
            },
        ],
        delivery: { method: 'pickup', pickupPointId: 'point-center' },
        subtotal: 249000,
        shipping: 0,
        total: 249000,
        currency: 'RUB',
        expiresAt: '2026-01-01T00:10:00.000Z',
        ...overrides,
    }
}

/**
 * По умолчанию awaiting_payment / unpaid / card — ещё не успех. Успех карты и наличных задавать явно.
 * @param overrides Частичные поля
 */
export function makeOrder(overrides: Partial<Order> = {}): Order {
    return {
        id: 'order-1',
        number: 'A-1001',
        status: 'awaiting_payment',
        paymentStatus: 'unpaid',
        paymentMethod: 'card',
        customer: {
            name: 'Тестовый Покупатель',
            email: 'buyer@example.test',
            phone: '+79990000000',
        },
        items: [
            {
                productId: 'lamp-orbit',
                title: 'Лампа Orbit',
                unitPrice: 249000,
                quantity: 1,
                lineTotal: 249000,
            },
        ],
        delivery: { method: 'pickup', pickupPointId: 'point-center' },
        subtotal: 249000,
        shipping: 0,
        total: 249000,
        currency: 'RUB',
        createdAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
    }
}

/**
 * По умолчанию pending. failed + CARD_DECLINED — отказ банка (HTTP 200).
 * @param overrides Частичные поля
 */
export function makePayment(overrides: Partial<Payment> = {}): Payment {
    return {
        id: 'pay-1',
        orderId: 'order-1',
        status: 'pending',
        amount: 249000,
        currency: 'RUB',
        createdAt: '2026-01-01T00:00:00.000Z',
        failureCode: null,
        ...overrides,
    }
}

/** Две карты: success и decline. Форма не должна требовать PAN/CVC. */
export const sandbox: Sandbox = {
    settlementDelayMs: 1200,
    cards: [
        {
            id: 'card-success',
            title: 'Тестовая карта: успешная оплата',
            maskedNumber: '•••• 4242',
            scenario: 'success',
        },
        {
            id: 'card-decline',
            title: 'Тестовая карта: отказ банка',
            maskedNumber: '•••• 0002',
            scenario: 'decline',
        },
    ],
}

/**
 * Intl.NumberFormat ставит NBSP/узкие пробелы — обычный getByText('2 490,00 ₽') флапает.
 * @param expected Строка formatMoney, пробелы любого вида
 */
export function byNormalizedText(expected: string) {
    const compact = expected.replace(/[\s\u00a0\u202f]/g, '')
    return (_content: string, node: Element | null) => {
        if (!(node instanceof HTMLElement)) {
            return false
        }
        const nodeCompact = (node.textContent ?? '').replace(/[\s\u00a0\u202f]/g, '')
        if (!nodeCompact.includes(compact)) {
            return false
        }
        return Array.from(node.children).every(
            (child) => !(child.textContent ?? '').replace(/[\s\u00a0\u202f]/g, '').includes(compact),
        )
    }
}

/**
 * ApiError как из client.ts (name: 'ApiError'). `new Error()` isApiError не пройдёт.
 * @param overrides code/status/fields
 */
export function makeApiError(overrides: Partial<ApiError> = {}): ApiError {
    return {
        name: 'ApiError',
        message: 'Request failed',
        code: 'UNKNOWN_ERROR',
        status: 400,
        ...overrides,
    }
}
