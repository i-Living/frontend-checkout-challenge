import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { CardPicker } from '@/features/payment/card-picker'
import { usePaymentPoll } from '@/features/payment/use-payment-poll'
import {
    createPayment,
    getOrder,
    getSandbox,
    listOrderPayments,
    listOrders,
    simulatePayment,
} from '@/shared/api/endpoints'
import { isAbortError, isApiError } from '@/shared/api/errors'
import { forgetPaymentIdempotency, rememberPaymentIdempotency } from '@/shared/api/idempotency'
import { queryKeys } from '@/shared/api/query-keys'
import { newestByCreatedAt } from '@/shared/lib/newest'
import { useSessionStore } from '@/shared/store/session-store'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

type PaymentScenario = 'success' | 'decline' | 'cancel'

function errorText(error: unknown, fallback: string) {
    if (isApiError(error)) {
        return error.message
    }
    return fallback
}

function isActiveStatus(status: string | undefined) {
    return status === 'pending' || status === 'processing'
}

export function PaymentPage() {
    const { orderId: routeOrderId } = useParams<{ orderId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const storedOrderId = useSessionStore((state) => state.orderId)
    const setOrderId = useSessionStore((state) => state.setOrderId)
    const paymentId = useSessionStore((state) => state.paymentId)
    const setPaymentId = useSessionStore((state) => state.setPaymentId)

    const [listedOrderId, setListedOrderId] = useState<string | null>(null)
    const [selectedCardId, setSelectedCardId] = useState('')
    const [payPending, setPayPending] = useState(false)
    const [payError, setPayError] = useState<unknown>(null)
    const orderId = routeOrderId || storedOrderId || listedOrderId

    const recoverMissingOrder = useCallback(
        async (signal?: AbortSignal) => {
            const orders = await listOrders(signal)
            const newest = newestByCreatedAt(orders)
            if (newest) {
                setOrderId(newest.id)
                setListedOrderId(newest.id)
            }
        },
        [setOrderId],
    )

    const orderQuery = useQuery({
        queryKey: queryKeys.order(orderId ?? ''),
        queryFn: ({ signal }) => getOrder(orderId!, signal),
        enabled: Boolean(orderId),
    })
    const sandboxQuery = useQuery({
        queryKey: queryKeys.sandbox(),
        queryFn: ({ signal }) => getSandbox(signal),
    })
    const paymentQuery = usePaymentPoll(paymentId)

    const order = orderQuery.data
    const cards = sandboxQuery.data?.cards ?? []
    const payment = paymentQuery.data
    const selectedCard = cards.find((card) => card.id === selectedCardId)
    const isProcessing = isActiveStatus(payment?.status)
    const isBusy = payPending || isProcessing
    const isDeclined = !isBusy && payment?.status === 'failed'
    const isCancelled = !isBusy && payment?.status === 'cancelled'
    const canRetry = isDeclined || isCancelled

    useEffect(() => {
        const first = cards[0]
        if (!selectedCardId && first) {
            setSelectedCardId(first.id)
        }
    }, [cards, selectedCardId])

    useEffect(() => {
        if (routeOrderId) {
            if (storedOrderId !== routeOrderId) {
                setOrderId(routeOrderId)
            }
            return
        }
        if (storedOrderId) {
            return
        }
        const controller = new AbortController()
        void recoverMissingOrder(controller.signal).catch((error) => {
            if (!isAbortError(error)) {
                setPayError(error)
            }
        })
        return () => {
            controller.abort()
        }
    }, [recoverMissingOrder, routeOrderId, setOrderId, storedOrderId])

    useEffect(() => {
        if (!orderId || !order) {
            return
        }
        if (order.status === 'paid' && order.paymentStatus === 'succeeded') {
            navigate(`/orders/${orderId}`, { replace: true })
        }
    }, [navigate, order, orderId])

    useEffect(() => {
        if (!orderId || !order || paymentId) {
            return
        }
        if (!isActiveStatus(order.paymentStatus)) {
            return
        }
        const controller = new AbortController()
        void listOrderPayments(orderId, controller.signal)
            .then((payments) => {
                const newest = newestByCreatedAt(payments)
                if (newest) {
                    setPaymentId(newest.id)
                }
            })
            .catch((error) => {
                if (!isAbortError(error)) {
                    setPayError(error)
                }
            })
        return () => {
            controller.abort()
        }
    }, [order, orderId, paymentId, setPaymentId])

    useEffect(() => {
        if (!orderId || payment?.status !== 'succeeded') {
            return
        }
        const controller = new AbortController()
        void getOrder(orderId, controller.signal)
            .then((fresh) => {
                queryClient.setQueryData(queryKeys.order(orderId), fresh)
                if (fresh.status === 'paid' && fresh.paymentStatus === 'succeeded') {
                    navigate(`/orders/${orderId}`)
                }
            })
            .catch((error) => {
                if (!isAbortError(error)) {
                    setPayError(error)
                }
            })
        return () => {
            controller.abort()
        }
    }, [navigate, orderId, payment?.status, queryClient])

    async function attachExistingPayment() {
        if (!orderId) {
            return
        }
        const payments = await listOrderPayments(orderId)
        const newest = newestByCreatedAt(payments)
        if (newest) {
            setPaymentId(newest.id)
        }
        return newest
    }

    async function handleKnownPaymentError(error: unknown) {
        if (isApiError(error) && error.code === 'ORDER_ALREADY_PAID' && orderId) {
            try {
                const fresh = await getOrder(orderId)
                queryClient.setQueryData(queryKeys.order(orderId), fresh)
                if (fresh.status === 'paid' && fresh.paymentStatus === 'succeeded') {
                    navigate(`/orders/${orderId}`)
                }
            } catch (orderError) {
                setPayError(orderError)
            }
            return true
        }
        if (isApiError(error) && error.code === 'PAYMENT_IN_PROGRESS' && orderId && !paymentId) {
            try {
                await attachExistingPayment()
            } catch (listError) {
                setPayError(listError)
            }
            return true
        }
        if (isApiError(error) && error.code === 'PAYMENT_FINALIZED') {
            try {
                if (paymentId) {
                    void queryClient.invalidateQueries({ queryKey: queryKeys.payment(paymentId) })
                } else {
                    await attachExistingPayment()
                }
            } catch (listError) {
                setPayError(listError)
            }
            return true
        }
        return false
    }

    async function createAndSimulate(scenario: PaymentScenario) {
        if (!orderId) {
            return
        }
        const key = rememberPaymentIdempotency(orderId)
        const created = await createPayment(orderId, key)
        setPaymentId(created.id)
        queryClient.setQueryData(queryKeys.payment(created.id), created)
        if (created.status === 'pending') {
            await simulatePayment(created.id, { scenario })
        }
        void queryClient.invalidateQueries({ queryKey: queryKeys.payment(created.id) })
    }

    async function handlePay() {
        if (!orderId || !selectedCard || isBusy) {
            return
        }
        setPayPending(true)
        setPayError(null)
        try {
            await createAndSimulate(selectedCard.scenario)
        } catch (error) {
            if (await handleKnownPaymentError(error)) {
                return
            }
            setPayError(error)
        } finally {
            setPayPending(false)
        }
    }

    async function handleCancel() {
        if (!orderId || isBusy) {
            return
        }
        setPayPending(true)
        setPayError(null)
        try {
            if (paymentId && isActiveStatus(payment?.status)) {
                await simulatePayment(paymentId, { scenario: 'cancel' })
                void queryClient.invalidateQueries({ queryKey: queryKeys.payment(paymentId) })
                return
            }
            await createAndSimulate('cancel')
        } catch (error) {
            if (isApiError(error) && error.code === 'PAYMENT_IN_PROGRESS' && orderId) {
                try {
                    const newest = await attachExistingPayment()
                    if (newest && isActiveStatus(newest.status)) {
                        await simulatePayment(newest.id, { scenario: 'cancel' })
                        void queryClient.invalidateQueries({ queryKey: queryKeys.payment(newest.id) })
                    }
                } catch (cancelError) {
                    if (await handleKnownPaymentError(cancelError)) {
                        return
                    }
                    setPayError(cancelError)
                }
                return
            }
            if (await handleKnownPaymentError(error)) {
                return
            }
            setPayError(error)
        } finally {
            setPayPending(false)
        }
    }

    async function handleRetry() {
        if (!orderId || !selectedCard || isBusy) {
            return
        }
        setPayPending(true)
        setPayError(null)
        try {
            forgetPaymentIdempotency(orderId)
            setPaymentId(null)
            await createAndSimulate(selectedCard.scenario)
        } catch (error) {
            if (await handleKnownPaymentError(error)) {
                return
            }
            setPayError(error)
        } finally {
            setPayPending(false)
        }
    }

    if (!orderId && payError) {
        return (
            <Alert variant='destructive'>
                <AlertCircle />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription className='gap-3'>
                    <p>{errorText(payError, 'Не удалось загрузить оплату')}</p>
                    <Button
                        type='button'
                        variant='outline'
                        className='h-11 min-h-11 w-full'
                        onClick={() => {
                            setPayError(null)
                            void recoverMissingOrder().catch((error) => {
                                if (!isAbortError(error)) {
                                    setPayError(error)
                                }
                            })
                        }}
                    >
                        Повторить
                    </Button>
                </AlertDescription>
            </Alert>
        )
    }

    if (!orderId || orderQuery.isPending || sandboxQuery.isPending) {
        return (
            <div className='flex flex-col gap-4' role='status' aria-busy='true' aria-label='Загрузка оплаты'>
                <Skeleton className='h-8 w-40' />
                <Skeleton className='h-40 w-full' />
            </div>
        )
    }

    const pageError = orderQuery.error ?? sandboxQuery.error
    if (pageError) {
        return (
            <Alert variant='destructive'>
                <AlertCircle />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription className='gap-3'>
                    <p>{errorText(pageError, 'Не удалось загрузить оплату')}</p>
                    <Button
                        type='button'
                        variant='outline'
                        className='h-11 min-h-11 w-full'
                        onClick={() => {
                            void orderQuery.refetch()
                            void sandboxQuery.refetch()
                        }}
                    >
                        Повторить
                    </Button>
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <div className='flex min-w-0 flex-col gap-6'>
            <h1 className='text-2xl font-semibold'>Оплата</h1>
            {payError ? (
                <Alert variant='destructive'>
                    <AlertCircle />
                    <AlertTitle>Ошибка</AlertTitle>
                    <AlertDescription>{errorText(payError, 'Не удалось оплатить заказ')}</AlertDescription>
                </Alert>
            ) : null}
            {isDeclined ? (
                <Alert variant='destructive'>
                    <AlertCircle />
                    <AlertTitle className='line-clamp-none'>Банк отклонил карту</AlertTitle>
                </Alert>
            ) : null}
            {isCancelled ? (
                <Alert>
                    <AlertCircle />
                    <AlertTitle className='line-clamp-none'>Оплата отменена</AlertTitle>
                </Alert>
            ) : null}
            {isBusy ? (
                <Alert role='status' aria-busy='true'>
                    <Loader2 className='animate-spin' />
                    <AlertTitle className='line-clamp-none'>Обрабатываем оплату…</AlertTitle>
                </Alert>
            ) : null}
            <CardPicker
                cards={cards}
                value={selectedCardId}
                disabled={isBusy}
                onChange={(card) => setSelectedCardId(card.id)}
            />
            {canRetry ? (
                <Button
                    type='button'
                    className='h-11 min-h-11 w-full'
                    disabled={isBusy || !selectedCard}
                    onClick={() => void handleRetry()}
                >
                    Оплатить снова
                </Button>
            ) : (
                <>
                    <Button
                        type='button'
                        className='h-11 min-h-11 w-full'
                        disabled={isBusy || !selectedCard}
                        onClick={() => void handlePay()}
                    >
                        Оплатить
                    </Button>
                    <Button
                        type='button'
                        variant='outline'
                        className='h-11 min-h-11 w-full'
                        disabled={isBusy}
                        onClick={() => void handleCancel()}
                    >
                        Отменить оплату
                    </Button>
                </>
            )}
        </div>
    )
}
