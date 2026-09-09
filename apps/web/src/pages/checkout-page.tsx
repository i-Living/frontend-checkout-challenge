import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Loader2 } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { type CheckoutFieldErrors, CheckoutForm } from '@/features/checkout/checkout-form'
import { createOrder, createQuote, getCart, getCheckoutOptions } from '@/shared/api/endpoints'
import { isAbortError, isApiError } from '@/shared/api/errors'
import { forgetOrderIdempotency, rememberOrderIdempotency } from '@/shared/api/idempotency'
import { queryKeys } from '@/shared/api/query-keys'
import { formatMoney } from '@/shared/lib/money'
import { useSessionStore } from '@/shared/store/session-store'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

type Quote = Awaited<ReturnType<typeof createQuote>>
type QuoteBody = Parameters<typeof createQuote>[0]
type DeliveryPayload = QuoteBody['delivery']

const PHONE_PATTERN = /^\+[1-9]\d{9,14}$/

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function validateCheckout(input: {
    name: string
    email: string
    phone: string
    deliveryMethod: 'pickup' | 'courier' | ''
    pickupPointId: string
    address: { city: string; street: string; house: string }
}): CheckoutFieldErrors {
    const errors: CheckoutFieldErrors = {}

    if (input.name.trim() === '') {
        errors.name = 'Укажите имя'
    }

    if (!isValidEmail(input.email)) {
        errors.email = 'Укажите корректный email'
    }

    if (!PHONE_PATTERN.test(input.phone)) {
        errors.phone = 'Телефон в формате + и 10–15 цифр'
    }

    if (input.deliveryMethod === 'pickup' && input.pickupPointId === '') {
        errors.pickupPointId = 'Выберите пункт выдачи'
    }

    if (input.deliveryMethod === 'courier') {
        if (input.address.city.trim() === '') {
            errors.city = 'Укажите город'
        }
        if (input.address.street.trim() === '') {
            errors.street = 'Укажите улицу'
        }
        if (input.address.house.trim() === '') {
            errors.house = 'Укажите дом'
        }
    }

    return errors
}

function hasCheckoutErrors(errors: CheckoutFieldErrors) {
    return Boolean(
        errors.name ||
            errors.email ||
            errors.phone ||
            errors.pickupPointId ||
            errors.city ||
            errors.street ||
            errors.house,
    )
}

function buildDelivery(input: {
    deliveryMethod: 'pickup' | 'courier' | ''
    pickupPointId: string
    address: { city: string; street: string; house: string; apartment: string }
}): DeliveryPayload | null {
    if (input.deliveryMethod === 'pickup') {
        if (input.pickupPointId === '') {
            return null
        }
        return {
            method: 'pickup',
            pickupPointId: input.pickupPointId as Extract<DeliveryPayload, { method: 'pickup' }>['pickupPointId'],
        }
    }

    if (input.deliveryMethod === 'courier') {
        const city = input.address.city.trim()
        const street = input.address.street.trim()
        const house = input.address.house.trim()
        const apartment = input.address.apartment.trim()
        if (city === '' || street === '' || house === '') {
            return null
        }
        return {
            method: 'courier',
            address: apartment === '' ? { city, street, house } : { city, street, house, apartment },
        }
    }

    return null
}

function networkErrorText(error: unknown, fallback: string) {
    if (isApiError(error)) {
        return error.message
    }
    return fallback
}

export function CheckoutPage() {
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const cartQuery = useQuery({
        queryKey: queryKeys.cart(),
        queryFn: ({ signal }) => getCart(signal),
    })
    const optionsQuery = useQuery({
        queryKey: queryKeys.checkoutOptions(),
        queryFn: ({ signal }) => getCheckoutOptions(signal),
    })

    const deliveryMethod = useSessionStore((state) => state.deliveryMethod)
    const pickupPointId = useSessionStore((state) => state.pickupPointId)
    const addressCity = useSessionStore((state) => state.address.city)
    const addressStreet = useSessionStore((state) => state.address.street)
    const addressHouse = useSessionStore((state) => state.address.house)
    const addressApartment = useSessionStore((state) => state.address.apartment)
    const paymentMethod = useSessionStore((state) => state.paymentMethod)
    const name = useSessionStore((state) => state.name)
    const email = useSessionStore((state) => state.email)
    const phone = useSessionStore((state) => state.phone)
    const setOrderId = useSessionStore((state) => state.setOrderId)
    const setPaymentId = useSessionStore((state) => state.setPaymentId)

    const [showFieldErrors, setShowFieldErrors] = useState(false)
    const [quote, setQuote] = useState<Quote | null>(null)
    const [quoteLoading, setQuoteLoading] = useState(false)
    const [quoteError, setQuoteError] = useState<unknown>(null)
    const [conflictMessage, setConflictMessage] = useState<string | null>(null)
    const [quoteRetry, setQuoteRetry] = useState(0)
    const [orderPending, setOrderPending] = useState(false)
    const [orderError, setOrderError] = useState<unknown>(null)
    const quoteGeneration = useRef(0)

    const cart = cartQuery.data
    const cartVersion = cart?.version
    const isEmptyCart = Boolean(cart && (cart.quantity === 0 || cart.items.length === 0))
    const address = {
        city: addressCity,
        street: addressStreet,
        house: addressHouse,
        apartment: addressApartment,
    }

    useEffect(() => {
        const generation = ++quoteGeneration.current
        const controller = new AbortController()
        const retryAttempt = quoteRetry
        const delivery = buildDelivery({
            deliveryMethod,
            pickupPointId,
            address: {
                city: addressCity,
                street: addressStreet,
                house: addressHouse,
                apartment: addressApartment,
            },
        })

        async function run() {
            if (cartVersion === undefined || delivery === null) {
                setQuote(null)
                setQuoteLoading(false)
                setQuoteError(null)
                return
            }

            setQuoteLoading(true)
            if (retryAttempt >= 0) {
                setQuoteError(null)
            }

            try {
                const result = await createQuote({ cartVersion, delivery }, controller.signal)
                if (generation !== quoteGeneration.current) {
                    return
                }
                setQuote(result)
                setQuoteLoading(false)
                setConflictMessage(null)
            } catch (error) {
                if (generation !== quoteGeneration.current || isAbortError(error)) {
                    return
                }

                if (isApiError(error) && error.status === 409 && error.code === 'CART_VERSION_CONFLICT') {
                    setQuote(null)
                    setQuoteLoading(false)
                    setConflictMessage(error.message)
                    void queryClient.invalidateQueries({ queryKey: queryKeys.cart() })
                    return
                }

                if (isApiError(error) && error.status === 409 && error.code === 'QUOTE_EXPIRED') {
                    try {
                        const retry = await createQuote({ cartVersion, delivery }, controller.signal)
                        if (generation !== quoteGeneration.current) {
                            return
                        }
                        setQuote(retry)
                        setQuoteLoading(false)
                        setConflictMessage(null)
                    } catch (retryError) {
                        if (generation !== quoteGeneration.current || isAbortError(retryError)) {
                            return
                        }
                        setQuote(null)
                        setQuoteLoading(false)
                        setQuoteError(retryError)
                    }
                    return
                }

                setQuote(null)
                setQuoteLoading(false)
                setQuoteError(error)
            }
        }

        void run()
        return () => {
            controller.abort()
        }
    }, [
        addressApartment,
        addressCity,
        addressHouse,
        addressStreet,
        cartVersion,
        deliveryMethod,
        pickupPointId,
        queryClient,
        quoteRetry,
    ])

    const currentErrors = validateCheckout({
        name,
        email,
        phone,
        deliveryMethod,
        pickupPointId,
        address,
    })
    const isInvalid = hasCheckoutErrors(currentErrors) || paymentMethod === ''

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (orderPending) {
            return
        }
        setShowFieldErrors(true)
        if (isInvalid) {
            return
        }
        if ((paymentMethod !== 'card' && paymentMethod !== 'cash_on_delivery') || !quote) {
            return
        }

        setOrderPending(true)
        setOrderError(null)
        const body = {
            quoteId: quote.id,
            paymentMethod,
            customer: {
                name: name.trim(),
                email: email.trim(),
                phone,
            },
        }
        const key = rememberOrderIdempotency(body)

        try {
            const order = await createOrder(body, key)
            setOrderId(order.id)
            setPaymentId(null)
            queryClient.setQueryData(queryKeys.order(order.id), order)
            void queryClient.invalidateQueries({ queryKey: queryKeys.cart() })
            forgetOrderIdempotency()
            navigate(paymentMethod === 'cash_on_delivery' ? `/orders/${order.id}` : `/orders/${order.id}/pay`)
        } catch (error) {
            if (isApiError(error) && error.code === 'CART_VERSION_CONFLICT') {
                setQuote(null)
                setConflictMessage(error.message)
                void queryClient.invalidateQueries({ queryKey: queryKeys.cart() })
                return
            }
            if (isApiError(error) && error.code === 'QUOTE_EXPIRED') {
                setQuoteRetry((value) => value + 1)
                return
            }
            if (isApiError(error) && error.code === 'CART_EMPTY') {
                navigate('/cart')
                return
            }
            setOrderError(error)
        } finally {
            setOrderPending(false)
        }
    }

    function retryNetwork() {
        setQuoteError(null)
        void cartQuery.refetch()
        void optionsQuery.refetch()
        setQuoteRetry((value) => value + 1)
    }

    if (cartQuery.isPending) {
        return (
            <div className='flex flex-col gap-4' role='status' aria-busy='true' aria-label='Загрузка оформления'>
                <Skeleton className='h-8 w-56' />
                <Skeleton className='h-40 w-full' />
                <Skeleton className='h-40 w-full' />
            </div>
        )
    }

    if (cart && isEmptyCart) {
        return <Navigate to='/cart' replace />
    }

    const displayedErrors = showFieldErrors ? currentErrors : {}
    const networkError =
        orderError ?? quoteError ?? optionsQuery.error ?? (cartQuery.error && !cart ? cartQuery.error : null)
    const submitLabel = paymentMethod === 'card' ? 'Оформить и перейти к оплате' : 'Оформить заказ'
    const submitDisabled = orderPending || quoteLoading || isEmptyCart || !cart

    return (
        <div className='flex min-w-0 flex-col gap-6'>
            <h1 className='text-2xl font-semibold'>Оформление заказа</h1>
            {conflictMessage ? (
                <Alert>
                    <AlertCircle />
                    <AlertTitle>Корзина обновилась</AlertTitle>
                    <AlertDescription>{conflictMessage}</AlertDescription>
                </Alert>
            ) : null}
            {networkError ? (
                <Alert variant='destructive'>
                    <AlertCircle />
                    <AlertTitle>Ошибка</AlertTitle>
                    <AlertDescription className='gap-3'>
                        <p>{networkErrorText(networkError, 'Не удалось получить данные оформления')}</p>
                        <Button type='button' variant='outline' className='h-11 min-h-11 w-full' onClick={retryNetwork}>
                            Повторить
                        </Button>
                    </AlertDescription>
                </Alert>
            ) : null}
            <div className='grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]'>
                <CheckoutForm options={optionsQuery.data} fieldErrors={displayedErrors} onSubmit={handleSubmit} />
                <Card className='min-w-0 lg:sticky lg:top-4'>
                    <CardHeader>
                        <CardTitle>Итог</CardTitle>
                    </CardHeader>
                    <CardContent className='flex flex-col gap-4'>
                        {quoteLoading ? (
                            <Alert role='status' aria-busy='true'>
                                <Loader2 className='animate-spin' />
                                <AlertTitle className='line-clamp-none'>Считаем доставку…</AlertTitle>
                            </Alert>
                        ) : null}
                        {quote && !quoteLoading ? (
                            <>
                                <div className='flex items-center justify-between gap-4 text-sm'>
                                    <span>Доставка</span>
                                    <span>{formatMoney(quote.shipping)}</span>
                                </div>
                                <div className='flex items-center justify-between gap-4 text-lg font-semibold'>
                                    <span>Итого</span>
                                    <span>{formatMoney(quote.total)}</span>
                                </div>
                            </>
                        ) : null}
                        <Button
                            type='submit'
                            form='checkout-form'
                            className='h-11 min-h-11 w-full'
                            disabled={submitDisabled}
                        >
                            {submitLabel}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
