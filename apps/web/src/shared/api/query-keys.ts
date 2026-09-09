export const queryKeys = {
    session: () => ['session'] as const,
    products: () => ['products'] as const,
    cart: () => ['cart'] as const,
    checkoutOptions: () => ['checkout-options'] as const,
    quote: (quoteId: string) => ['quote', quoteId] as const,
    sandbox: () => ['sandbox'] as const,
    order: (orderId: string) => ['order', orderId] as const,
    payments: (orderId: string) => ['payments', orderId] as const,
    payment: (paymentId: string) => ['payment', paymentId] as const,
}
