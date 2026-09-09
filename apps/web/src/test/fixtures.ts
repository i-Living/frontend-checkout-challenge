/**
 * Фикстуры API-сущностей для юнит- и компонентных тестов.
 */
import type { Cart, CheckoutOptions, Order, Payment, Product, Quote, Sandbox } from '@/shared/api/endpoints'
import type { ApiError } from '@/shared/api/errors'
import type { CheckoutDraft } from '@/shared/store/session-store'

/** Пустой черновик оформления. */
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

/** Валидный черновик самовывоза и оплаты картой. */
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
 * Собирает товар каталога.
 * @param overrides Частичные поля товара
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
 * Собирает корзину сессии.
 * @param overrides Частичные поля корзины
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
 * Собирает опции оформления.
 * @param overrides Частичные поля опций
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
 * Собирает расчёт заказа.
 * @param overrides Частичные поля расчёта
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
 * Собирает заказ.
 * @param overrides Частичные поля заказа
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
 * Собирает платёж.
 * @param overrides Частичные поля платежа
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

/** Тестовые карты песочницы. */
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
 * Matcher Testing Library: сравнивает текст без различия обычных и неразрывных пробелов Intl.
 * @param expected Ожидаемая строка, например formatMoney(249000)
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
 * Собирает нормализованную ошибку API.
 * @param overrides Частичные поля ошибки
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
