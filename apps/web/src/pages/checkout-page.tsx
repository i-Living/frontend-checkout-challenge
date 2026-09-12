/**
 * `/checkout`. Quote и заказ. Пустая корзина → редирект на /cart. Суммы только из quote, не из корзины.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleAlert, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { routes } from '@/app/routes'
import { type CheckoutFieldErrors, CheckoutForm } from '@/features/checkout/checkout-form'
import { buildDelivery, toServerFieldErrors, validateDraft } from '@/features/checkout/checkout-rules'
import { useQuote } from '@/features/checkout/use-quote'
import { type CreateOrderBody, createOrder } from '@/shared/api/endpoints'
import { getErrorCode, toErrorDescription, toErrorTitle } from '@/shared/api/errors'
import { clearOrderKey, getOrCreateOrderKey } from '@/shared/api/idempotency'
import { invalidateCart } from '@/shared/api/invalidate'
import { useCart, useCheckoutOptions } from '@/shared/api/queries'
import { formatMoney } from '@/shared/lib/money'
import { usePageTitle } from '@/shared/lib/use-page-title'
import { type CheckoutDraft, useSessionStore } from '@/shared/store/session-store'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { MutationAlert } from '@/shared/ui/mutation-alert'
import { queryGate } from '@/shared/ui/query-gate'
import { Skeleton } from '@/shared/ui/skeleton'

/**
 * Две колонки как у готовой страницы, чтобы сайдбар «Итого» не прыгал.
 */
function CheckoutSkeleton() {
    return (
        <div className='grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]' role='status'>
            <div className='flex min-w-0 flex-col gap-4'>
                <Skeleton className='h-11 w-full' />
                <Skeleton className='h-11 w-full' />
                <Skeleton className='h-11 w-full' />
                <Skeleton className='h-24 w-full' />
            </div>
            <Skeleton className='h-48 w-full' />
        </div>
    )
}

/**
 * Черновик в session-store: ошибка API и F5 не стирают поля. Адрес для quote дебаунсится 300 мс.
 * @returns Страница оформления
 */
export function CheckoutPage() {
    usePageTitle('Оформление заказа')
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const draft = useSessionStore((state) => state.draft)
    const patchDraft = useSessionStore((state) => state.patchDraft)
    const setOrderId = useSessionStore((state) => state.setOrder)
    const setPaymentId = useSessionStore((state) => state.setPayment)
    const [errors, setErrors] = useState<CheckoutFieldErrors>({})
    const [debouncedAddress, setDebouncedAddress] = useState({
        city: draft.city,
        street: draft.street,
        house: draft.house,
        apartment: draft.apartment,
    })

    const cartQuery = useCart()
    const optionsQuery = useCheckoutOptions()

    useEffect(() => {
        if (!optionsQuery.data) {
            return
        }
        const patch: Partial<CheckoutDraft> = {}
        if (!draft.deliveryMethod) {
            const firstDelivery = optionsQuery.data.deliveryMethods[0]?.id
            if (firstDelivery) {
                patch.deliveryMethod = firstDelivery
            }
        }
        if (!draft.paymentMethod) {
            const firstPayment = optionsQuery.data.paymentMethods[0]?.id
            if (firstPayment) {
                patch.paymentMethod = firstPayment
            }
        }
        if (Object.keys(patch).length > 0) {
            patchDraft(patch)
        }
    }, [optionsQuery.data, draft.deliveryMethod, draft.paymentMethod, patchDraft])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedAddress({
                city: draft.city,
                street: draft.street,
                house: draft.house,
                apartment: draft.apartment,
            })
        }, 300)
        return () => clearTimeout(timer)
    }, [draft.city, draft.street, draft.house, draft.apartment])

    const effectiveDraft = useMemo<CheckoutDraft>(() => {
        if (draft.deliveryMethod === 'courier') {
            return { ...draft, ...debouncedAddress }
        }
        return draft
    }, [draft, debouncedAddress])

    const effectiveDelivery = useMemo(() => buildDelivery(effectiveDraft), [effectiveDraft])
    const cartVersion = cartQuery.data?.version
    const hasItems = (cartQuery.data?.items.length ?? 0) > 0
    const quoteEnabled =
        cartQuery.data !== undefined && hasItems && cartVersion !== undefined && effectiveDelivery !== null
    const quoteQuery = useQuote(cartVersion, effectiveDelivery, quoteEnabled)

    const createOrderMutation = useMutation({
        mutationFn: ({ body, key }: { body: CreateOrderBody; key: string }) => createOrder(body, key),
        onSuccess: (order) => {
            clearOrderKey()
            setOrderId(order.id)
            setPaymentId(null)
            void invalidateCart(queryClient)
            if (order.paymentMethod === 'cash_on_delivery') {
                navigate(routes.orderRoute(order.id))
            } else {
                navigate(routes.paymentRoute(order.id))
            }
        },
        onError: (error: unknown) => {
            const fieldErrors = toServerFieldErrors(error)
            if (fieldErrors) {
                setErrors((prev) => ({ ...prev, ...fieldErrors }))
            }
            const code = getErrorCode(error)
            if (code === 'CART_VERSION_CONFLICT' || code === 'CART_EMPTY') {
                void invalidateCart(queryClient)
            } else if (code === 'QUOTE_EXPIRED') {
                void quoteQuery.refetch()
            } else if (code === 'IDEMPOTENCY_CONFLICT') {
                clearOrderKey()
            }
        },
    })

    /**
     * Смена deliveryMethod сбрасывает ошибки адреса и пункта вместе: они взаимоисключающие.
     * @param patch Часть черновика
     */
    function handleDraftChange(patch: Partial<CheckoutDraft>) {
        patchDraft(patch)
        setErrors((prev) => {
            if (Object.keys(prev).length === 0) {
                return prev
            }
            const next = { ...prev }
            for (const key of Object.keys(patch) as (keyof CheckoutDraft)[]) {
                if (key === 'deliveryMethod') {
                    delete next.pickupPointId
                    delete next.city
                    delete next.street
                    delete next.house
                } else if (
                    key === 'name' ||
                    key === 'email' ||
                    key === 'phone' ||
                    key === 'pickupPointId' ||
                    key === 'city' ||
                    key === 'street' ||
                    key === 'house'
                ) {
                    delete next[key]
                }
            }
            return next
        })
    }

    /**
     * Без quote — refetch расчёта, заказ не создаём. Ключ от тела: двойной клик не сделает второй заказ.
     * @param validData Черновик на момент submit (тот же, что в сторе)
     */
    function handleSubmit(validData: CheckoutDraft) {
        const validation = validateDraft(validData)
        setErrors(validation)
        if (Object.keys(validation).length > 0) {
            return
        }
        const quote = quoteQuery.data
        if (!quote) {
            void quoteQuery.refetch()
            return
        }
        const body: CreateOrderBody = {
            quoteId: quote.id,
            paymentMethod: validData.paymentMethod === 'cash_on_delivery' ? 'cash_on_delivery' : 'card',
            customer: {
                name: validData.name.trim(),
                email: validData.email.trim(),
                phone: validData.phone.trim(),
            },
        }
        const key = getOrCreateOrderKey(body)
        createOrderMutation.mutate({ body, key })
    }

    const blocked = queryGate([cartQuery, optionsQuery], {
        title: 'Оформление заказа',
        errorTitle: 'Не удалось загрузить оформление',
        skeleton: <CheckoutSkeleton />,
    })
    if (blocked) {
        return blocked
    }

    const cart = cartQuery.data
    const options = optionsQuery.data
    if (!cart || !options) {
        return null
    }

    if (cart.items.length === 0) {
        return <Navigate replace to={routes.cart} />
    }

    const submitLabel = draft.paymentMethod === 'cash_on_delivery' ? 'Оформить заказ' : 'Оформить и перейти к оплате'
    const quote = quoteQuery.data
    const subtotal = quote?.subtotal ?? cart.subtotal
    const quoteError = quoteQuery.error
    const isQuoteLoading = quoteEnabled && !quote && !quoteQuery.isError

    return (
        <div>
            <h1 className='mb-4 font-semibold text-2xl tracking-tight'>Оформление заказа</h1>
            <div className='grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]'>
                <div className='min-w-0'>
                    <MutationAlert
                        className='mb-4'
                        error={createOrderMutation.error}
                        title='Не удалось создать заказ'
                    />
                    <CheckoutForm
                        draft={draft}
                        errors={errors}
                        isPending={createOrderMutation.isPending || isQuoteLoading}
                        onDraftChange={handleDraftChange}
                        onSubmit={handleSubmit}
                        options={options}
                        submitLabel={submitLabel}
                    />
                    {createOrderMutation.isError ? (
                        <Button
                            className='mt-4 w-full sm:w-auto'
                            disabled={createOrderMutation.isPending}
                            onClick={() => handleSubmit(draft)}
                            type='button'
                            variant='outline'
                        >
                            Повторить
                        </Button>
                    ) : null}
                </div>
                <aside className='min-w-0 lg:sticky lg:top-24 lg:self-start'>
                    <Card className='min-w-0'>
                        <CardHeader>
                            <CardTitle>Итого</CardTitle>
                        </CardHeader>
                        <CardContent className='flex min-w-0 flex-col gap-2'>
                            <p className='flex min-w-0 flex-wrap justify-between gap-2 text-sm'>
                                <span className='text-muted-foreground'>Товары</span>
                                <span className='font-medium'>{formatMoney(subtotal)}</span>
                            </p>
                            {quote ? (
                                <>
                                    <p className='flex min-w-0 flex-wrap justify-between gap-2 text-sm'>
                                        <span className='text-muted-foreground'>Доставка</span>
                                        <span className='font-medium'>{formatMoney(quote.shipping)}</span>
                                    </p>
                                    <p className='flex min-w-0 flex-wrap justify-between gap-2 font-semibold'>
                                        <span>К оплате</span>
                                        <span>{formatMoney(quote.total)}</span>
                                    </p>
                                </>
                            ) : quoteQuery.isError ? (
                                <>
                                    <Alert variant='destructive'>
                                        <CircleAlert />
                                        <AlertTitle>
                                            {toErrorTitle(quoteError, 'Не удалось посчитать доставку')}
                                        </AlertTitle>
                                        <AlertDescription>{toErrorDescription(quoteError)}</AlertDescription>
                                    </Alert>
                                    <Button
                                        className='w-full sm:w-auto'
                                        disabled={quoteQuery.isFetching}
                                        onClick={() => {
                                            if (getErrorCode(quoteError) === 'CART_VERSION_CONFLICT') {
                                                void invalidateCart(queryClient).then(() => quoteQuery.refetch())
                                            } else {
                                                void quoteQuery.refetch()
                                            }
                                        }}
                                        type='button'
                                        variant='outline'
                                    >
                                        Повторить
                                    </Button>
                                </>
                            ) : isQuoteLoading ? (
                                <p
                                    aria-live='polite'
                                    className='flex min-w-0 items-center gap-2 text-muted-foreground text-sm'
                                >
                                    <LoaderCircle aria-hidden className='size-4 shrink-0 animate-spin' />
                                    Считаем доставку…
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    )
}
