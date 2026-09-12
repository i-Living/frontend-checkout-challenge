/**
 * `/orders/:orderId/pay`. Карта: sandbox + попытка + поллинг. Наличные сюда не пускаем.
 * «Отменить» закрывает форму до «Оплатить»; ушедшую в банк попытку API не отменяет.
 */
import { useQueryClient } from '@tanstack/react-query'
import { CircleAlert, Info, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { routes } from '@/app/routes'
import { CardPicker } from '@/features/payment/card-picker'
import { refreshOrderAfterPayment, usePaymentAttempt } from '@/features/payment/use-payment-attempt'
import { usePaymentPoll } from '@/features/payment/use-payment-poll'
import { getErrorCode } from '@/shared/api/errors'
import { useOrder, useOrdersList, usePayments, useSandbox } from '@/shared/api/queries'
import { usePageTitle } from '@/shared/lib/use-page-title'
import { useSessionStore } from '@/shared/store/session-store'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { MutationAlert } from '@/shared/ui/mutation-alert'
import { queryGate } from '@/shared/ui/query-gate'
import { Skeleton } from '@/shared/ui/skeleton'

/**
 * Пока GET заказа/sandbox. Не показывать карты-заглушки с выдуманными масками.
 */
function PaymentSkeleton() {
    return (
        <div aria-busy='true' className='flex min-w-0 flex-col gap-3' role='status'>
            <Skeleton className='h-11 w-full' />
            <Skeleton className='h-11 w-full' />
            <Skeleton className='h-10 w-40' />
        </div>
    )
}

/**
 * Resume: попытка из стора, иначе pending/processing из списка, иначе новая. Успех — редирект
 * только после payment.status=succeeded, не после 201 createPayment.
 * @returns Страница оплаты
 */
export function PaymentPage() {
    usePageTitle('Оплата заказа')
    const { orderId } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const storedPaymentId = useSessionStore((state) => state.paymentId)
    const storedOrderId = useSessionStore((state) => state.orderId)
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

    const orderQuery = useOrder(orderId)
    const isCashOrder = orderQuery.data?.paymentMethod !== undefined && orderQuery.data.paymentMethod !== 'card'
    const isCardOrder = orderQuery.data?.paymentMethod === 'card'
    const sandboxQuery = useSandbox(Boolean(orderId) && isCardOrder)
    const paymentsQuery = usePayments(orderId, Boolean(orderId) && isCardOrder)
    const recoveryOrdersQuery = useOrdersList(!orderId && !storedOrderId)
    const attempt = usePaymentAttempt(orderId)

    const sandboxCards = sandboxQuery.data?.cards ?? []
    useEffect(() => {
        if (selectedCardId === null && sandboxCards.length > 0) {
            setSelectedCardId(sandboxCards[0].id)
        }
    }, [sandboxCards, selectedCardId])

    const resumeId =
        paymentsQuery.data?.find((item) => item.status === 'pending' || item.status === 'processing')?.id ?? null
    const orderPaymentIds = useMemo(
        () => new Set((paymentsQuery.data ?? []).map((item) => item.id)),
        [paymentsQuery.data],
    )
    const storedForThisOrder = storedPaymentId && orderPaymentIds.has(storedPaymentId) ? storedPaymentId : null
    const effectivePaymentId = attempt.attemptPaymentId ?? storedForThisOrder ?? resumeId
    const { payment, isTerminal } = usePaymentPoll(effectivePaymentId, !isCashOrder, attempt.pollIntervalMs)

    useEffect(() => {
        if (isTerminal && orderId) {
            refreshOrderAfterPayment(queryClient, orderId)
        }
    }, [isTerminal, orderId, queryClient])

    useEffect(() => {
        if (payment?.status === 'succeeded' && orderId) {
            refreshOrderAfterPayment(queryClient, orderId)
            navigate(routes.orderRoute(orderId), { replace: true })
        }
    }, [payment?.status, orderId, queryClient, navigate])

    useEffect(() => {
        if (attempt.errorCode === 'ORDER_ALREADY_PAID' && orderId) {
            refreshOrderAfterPayment(queryClient, orderId)
            navigate(routes.orderRoute(orderId), { replace: true })
        }
    }, [attempt.errorCode, orderId, queryClient, navigate])

    if (!orderId) {
        if (storedOrderId) {
            return <Navigate replace to={routes.paymentRoute(storedOrderId)} />
        }
        const recoveryBlocked = queryGate(recoveryOrdersQuery, {
            title: 'Оплата заказа',
            errorTitle: 'Не удалось загрузить заказ',
            skeleton: <PaymentSkeleton />,
        })
        if (recoveryBlocked) {
            return recoveryBlocked
        }
        const latest = recoveryOrdersQuery.data?.[0]
        if (latest) {
            return <Navigate replace to={routes.paymentRoute(latest.id)} />
        }
        return <Navigate replace to={routes.catalog} />
    }

    const orderBlocked = queryGate(orderQuery, {
        title: 'Оплата заказа',
        errorTitle: 'Не удалось загрузить заказ',
        skeleton: <PaymentSkeleton />,
        notFoundTitle: 'Заказ не найден',
        notFoundDescription: 'Такого заказа нет. Возможно, данные были сброшены.',
    })
    if (orderBlocked) {
        return orderBlocked
    }

    const order = orderQuery.data
    if (!order) {
        return null
    }

    if (order.paymentMethod !== 'card') {
        return <Navigate replace to={routes.orderRoute(orderId)} />
    }

    if (order.status === 'paid' && order.paymentStatus === 'succeeded') {
        return <Navigate replace to={routes.orderRoute(orderId)} />
    }

    if (attempt.errorCode === 'PAYMENT_NOT_REQUIRED') {
        return <Navigate replace to={routes.orderRoute(orderId)} />
    }

    const sandboxBlocked = queryGate(sandboxQuery, {
        title: 'Оплата заказа',
        errorTitle: 'Не удалось загрузить тестовые карты',
        skeleton: <PaymentSkeleton />,
    })
    if (sandboxBlocked) {
        return sandboxBlocked
    }

    const isDeclined = payment?.status === 'failed'
    const isCancelled = payment?.status === 'cancelled'
    const showRetry = isDeclined || isCancelled || attempt.errorCode === 'PAYMENT_FINALIZED'
    const showInProgress = attempt.errorCode === 'PAYMENT_IN_PROGRESS'
    const showFinalized = attempt.errorCode === 'PAYMENT_FINALIZED'
    const isProcessing = attempt.isPending || payment?.status === 'pending' || payment?.status === 'processing'
    const isHandledPayCode =
        attempt.errorCode === 'PAYMENT_IN_PROGRESS' ||
        attempt.errorCode === 'PAYMENT_FINALIZED' ||
        attempt.errorCode === 'ORDER_ALREADY_PAID' ||
        attempt.errorCode === 'PAYMENT_NOT_REQUIRED'
    const showGenericPayError =
        attempt.error != null && !attempt.isStaleError && !isHandledPayCode && attempt.lastAction !== 'cancel'
    const showGenericCancelError =
        attempt.error != null &&
        getErrorCode(attempt.error) !== 'PAYMENT_FINALIZED' &&
        !attempt.isStaleError &&
        attempt.lastAction === 'cancel'
    const selectedCard = sandboxCards.find((card) => card.id === selectedCardId) ?? null

    /**
     * Сценарий берётся с выбранной карты sandbox, не хардкодится. Пока processing — выход.
     */
    function handlePay() {
        if (!selectedCard || isProcessing) {
            return
        }
        attempt.startPay(selectedCard.scenario)
    }

    /**
     * cancel до «Оплатить». Во время processing кнопка disabled — у попытки одна симуляция.
     */
    function handleCancel() {
        if (attempt.isPending || isTerminal || isProcessing) {
            return
        }
        attempt.startCancel()
    }

    return (
        <div>
            <h1 className='mb-1 font-semibold text-2xl tracking-tight'>Оплата заказа</h1>
            <p className='mb-5 text-muted-foreground text-sm'>
                Заказ {order.number} · тестовая оплата, деньги не списываются
            </p>
            <Card className='min-w-0 max-w-xl'>
                <CardContent className='flex min-w-0 flex-col gap-4 pt-6'>
                    <CardPicker
                        cards={sandboxCards}
                        disabled={isProcessing}
                        onSelect={setSelectedCardId}
                        selectedId={selectedCardId}
                    />
                    {isProcessing ? (
                        <p aria-live='polite' className='flex min-w-0 items-center gap-2 text-sm'>
                            <LoaderCircle aria-hidden className='size-4 shrink-0 animate-spin' />
                            Обрабатываем оплату…
                        </p>
                    ) : null}
                    {payment ? (
                        <p aria-live='polite' className='text-muted-foreground text-sm'>
                            Статус оплаты: {payment.status}
                            {payment.failureCode ? ` (${payment.failureCode})` : ''}
                        </p>
                    ) : null}
                    {isDeclined ? (
                        <Alert variant='destructive'>
                            <CircleAlert />
                            <AlertTitle>Банк отклонил карту</AlertTitle>
                            <AlertDescription>
                                Заказ сохранён в статусе awaiting_payment, деньги не списаны. Нажмите «Оплатить снова»,
                                чтобы создать новую попытку.
                            </AlertDescription>
                        </Alert>
                    ) : null}
                    {isCancelled ? (
                        <Alert>
                            <Info />
                            <AlertTitle>Оплата отменена</AlertTitle>
                            <AlertDescription>
                                Заказ сохранён. Нажмите «Оплатить снова», чтобы создать новую попытку.
                            </AlertDescription>
                        </Alert>
                    ) : null}
                    {showInProgress ? (
                        <Alert>
                            <LoaderCircle />
                            <AlertTitle>Оплата уже выполняется</AlertTitle>
                            <AlertDescription>Показана текущая попытка, продолжаем опрос.</AlertDescription>
                        </Alert>
                    ) : null}
                    {showFinalized ? (
                        <Alert variant='destructive'>
                            <CircleAlert />
                            <AlertTitle>Оплата уже завершена</AlertTitle>
                            <AlertDescription>
                                Сценарий не меняем. Нажмите «Оплатить снова», чтобы создать новую попытку.
                            </AlertDescription>
                        </Alert>
                    ) : null}
                    {showGenericPayError ? <MutationAlert error={attempt.error} title='Не удалось оплатить' /> : null}
                    {showGenericCancelError ? (
                        <MutationAlert error={attempt.error} title='Не удалось отменить' />
                    ) : null}
                    <div className='flex min-w-0 flex-wrap gap-2'>
                        <Button
                            className='w-full sm:w-auto'
                            disabled={isProcessing || !selectedCard}
                            onClick={handlePay}
                            type='button'
                        >
                            {showRetry ? 'Оплатить снова' : 'Оплатить'}
                        </Button>
                        <Button
                            className='w-full sm:w-auto'
                            disabled={isProcessing || isTerminal}
                            onClick={handleCancel}
                            type='button'
                            variant='outline'
                        >
                            Отменить оплату
                        </Button>
                    </div>
                    <Button asChild className='w-fit' variant='link'>
                        <Link to={routes.orderRoute(orderId)}>К заказу</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
