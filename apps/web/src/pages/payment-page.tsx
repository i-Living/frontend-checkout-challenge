/**
 * Экран оплаты (`/orders/:orderId/pay`).
 * Отвечает за тестовые карты, создание попытки оплаты, симуляцию, опрос статуса и повторы.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleAlert, Info, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { CardPicker } from '@/features/payment/card-picker'
import { usePaymentPoll } from '@/features/payment/use-payment-poll'
import {
    createPayment,
    createSimulation,
    getOrder,
    getSandbox,
    listOrders,
    listPayments,
    type Payment,
    type SimulationScenario,
} from '@/shared/api/endpoints'
import { isApiError } from '@/shared/api/errors'
import { clearPaymentKey, getOrCreatePaymentKey } from '@/shared/api/idempotency'
import { keys } from '@/shared/api/query-keys'
import { orThrow } from '@/shared/lib/assert'
import { useSessionStore } from '@/shared/store/session-store'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

interface AttemptVariables {
    scenario: SimulationScenario
}

/**
 * Превращает ошибку оплаты/загрузки в текст для алерта.
 * @param error Произвольная ошибка запроса
 * @returns Текст сообщения пользователю
 */
function toErrorMessage(error: unknown): string {
    return isApiError(error) ? error.message : 'Попробуйте ещё раз.'
}

/**
 * Экран оплаты (`/orders/:orderId/pay`): выбор тестовой карты, запуск и отмена попытки.
 * Параметр orderId — через useParams, пропсов нет. Ветки: восстановление id, скелетоны,
 * редиректы для не-карты/оплаченного, decline/cancel/in-progress/finalized.
 * @returns Разметка страницы оплаты
 */
export function PaymentPage() {
    const { orderId } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const storedPaymentId = useSessionStore((state) => state.paymentId)
    const storedOrderId = useSessionStore((state) => state.orderId)
    const setPayment = useSessionStore((state) => state.setPayment)
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
    const [attemptPaymentId, setAttemptPaymentId] = useState<string | null>(null)
    const [pollIntervalMs, setPollIntervalMs] = useState(800)
    const generationRef = useRef(0)

    const orderQuery = useQuery({
        queryKey: keys.order(orderId),
        queryFn: ({ signal }) => getOrder(orThrow(orderId, 'orderId'), signal),
        enabled: Boolean(orderId),
    })
    const isCashOrder = orderQuery.data?.paymentMethod !== undefined && orderQuery.data.paymentMethod !== 'card'
    const isCardOrder = orderQuery.data?.paymentMethod === 'card'
    const sandboxQuery = useQuery({
        queryKey: keys.sandbox,
        queryFn: ({ signal }) => getSandbox(signal),
        enabled: Boolean(orderId) && isCardOrder,
    })
    const paymentsQuery = useQuery({
        queryKey: keys.payments(orderId),
        queryFn: ({ signal }) => listPayments(orThrow(orderId, 'orderId'), signal),
        enabled: Boolean(orderId) && isCardOrder,
    })
    const recoveryOrdersQuery = useQuery({
        queryKey: keys.ordersList,
        queryFn: ({ signal }) => listOrders(signal),
        enabled: !orderId && !storedOrderId,
    })

    const sandboxCards = sandboxQuery.data?.cards ?? []
    useEffect(() => {
        if (selectedCardId === null && sandboxCards.length > 0) {
            setSelectedCardId(sandboxCards[0].id)
        }
    }, [sandboxCards, selectedCardId])

    const resumeId =
        paymentsQuery.data?.find((item) => item.status === 'pending' || item.status === 'processing')?.id ?? null
    // B3: reload продолжает poll. stored paymentId используем, только если он принадлежит
    // ТЕКУЩЕМУ заказу (есть в его списке попыток): иначе опрос чужого succeeded после
    // прошлой покупки редиректит на order-экран, откуда ведёт обратно — петля туда-обратно.
    // Список — источник правды с сервера; resumeId покрывает reload и без stored.
    const orderPaymentIds = useMemo(
        () => new Set((paymentsQuery.data ?? []).map((item) => item.id)),
        [paymentsQuery.data],
    )
    const storedForThisOrder = storedPaymentId && orderPaymentIds.has(storedPaymentId) ? storedPaymentId : null
    const effectivePaymentId = attemptPaymentId ?? storedForThisOrder ?? resumeId
    const { payment, isTerminal } = usePaymentPoll(effectivePaymentId, !isCashOrder, pollIntervalMs)

    useEffect(() => {
        document.title = 'Оплата заказа — Магазин'
    }, [])

    useEffect(() => {
        if (isTerminal && orderId) {
            void queryClient.invalidateQueries({ queryKey: keys.order(orderId) })
            void queryClient.invalidateQueries({ queryKey: keys.payments(orderId) })
        }
    }, [isTerminal, orderId, queryClient])

    // B2: повтор сети / двойной клик — те же key+body через getOrCreate.
    // Новый ключ только после успеха (clear в onSuccess) или смены body/orderId,
    // а также после PAYMENT_FINALIZED (см. onError ниже): иначе retry реплеит
    // ту же финализированную попытку и вечно получает 409.
    /**
     * Создаёт платёж с ключом идемпотентности и запускает симуляцию сценария карты.
     * @param scenario Сценарий песочницы выбранной карты
     * @param generation Поколение попытки для отсева устаревших ответов
     * @returns Созданный платёж и серверная пауза Retry-After для поллинга
     */
    async function runAttempt(
        scenario: SimulationScenario,
        generation: number,
    ): Promise<{ payment: Payment; retryAfterMs: number | null }> {
        const id = orThrow(orderId, 'orderId')
        const key = getOrCreatePaymentKey(id, {})
        const created = await createPayment(id, key)
        if (generation !== generationRef.current) {
            throw new Error('stale')
        }
        const { retryAfterMs } = await createSimulation(created.id, scenario)
        if (generation !== generationRef.current) {
            throw new Error('stale')
        }
        return { payment: created, retryAfterMs }
    }

    const payMutation = useMutation({
        mutationFn: ({ scenario }: AttemptVariables) => runAttempt(scenario, generationRef.current),
        onSuccess: (result) => {
            // B2: успех — новый ключ для следующей попытки (retry после fail/cancel).
            clearPaymentKey()
            setPollIntervalMs(result.retryAfterMs ?? 800)
            setAttemptPaymentId(result.payment.id)
            setPayment(result.payment.id)
            void queryClient.invalidateQueries({ queryKey: keys.payment(result.payment.id) })
            if (orderId) {
                void queryClient.invalidateQueries({ queryKey: keys.payments(orderId) })
            }
        },
        onError: (error: unknown) => {
            if (!isApiError(error)) {
                return
            }
            if (error.code === 'PAYMENT_FINALIZED') {
                // Попытка финализирована: старый ключ бесполезен, сбрасываем,
                // чтобы «Оплатить снова» создала новую попытку с новым ключом.
                clearPaymentKey()
            }
            if ((error.code === 'PAYMENT_FINALIZED' || error.code === 'PAYMENT_IN_PROGRESS') && orderId) {
                void queryClient.invalidateQueries({ queryKey: keys.payments(orderId) })
            }
        },
    })

    /**
     * Создаёт попытку и запускает сценарий cancel — закрытие формы без оплаты.
     * Не вызывается во время processing: у попытки уже есть симуляция, второй сценарий даст 409.
     * @param generation Поколение попытки для отсева устаревших ответов
     * @returns Созданный платёж и серверная пауза Retry-After для поллинга
     */
    async function runCancel(generation: number): Promise<{ payment: Payment; retryAfterMs: number | null }> {
        const id = orThrow(orderId, 'orderId')
        const key = getOrCreatePaymentKey(id, {})
        const created = await createPayment(id, key)
        if (generation !== generationRef.current) {
            throw new Error('stale')
        }
        const { retryAfterMs } = await createSimulation(created.id, 'cancel')
        if (generation !== generationRef.current) {
            throw new Error('stale')
        }
        return { payment: created, retryAfterMs }
    }

    const cancelMutation = useMutation({
        mutationFn: () => runCancel(generationRef.current),
        onSuccess: (result) => {
            clearPaymentKey()
            setPollIntervalMs(result.retryAfterMs ?? 800)
            setAttemptPaymentId(result.payment.id)
            setPayment(result.payment.id)
            void queryClient.invalidateQueries({ queryKey: keys.payment(result.payment.id) })
            if (orderId) {
                void queryClient.invalidateQueries({ queryKey: keys.payments(orderId) })
            }
        },
        onError: (error: unknown) => {
            if (!isApiError(error)) {
                return
            }
            if (error.code === 'PAYMENT_FINALIZED') {
                clearPaymentKey()
            }
            if ((error.code === 'PAYMENT_FINALIZED' || error.code === 'PAYMENT_IN_PROGRESS') && orderId) {
                void queryClient.invalidateQueries({ queryKey: keys.payments(orderId) })
            }
        },
    })

    const payErrorCode = isApiError(payMutation.error) ? payMutation.error.code : null
    const cancelErrorCode = isApiError(cancelMutation.error) ? cancelMutation.error.code : null

    useEffect(() => {
        if (payment?.status === 'succeeded' && orderId) {
            void queryClient.invalidateQueries({ queryKey: keys.order(orderId) })
            void queryClient.invalidateQueries({ queryKey: keys.payments(orderId) })
            navigate(`/orders/${orderId}`, { replace: true })
        }
    }, [payment?.status, orderId, queryClient, navigate])

    useEffect(() => {
        if (payErrorCode === 'ORDER_ALREADY_PAID' && orderId) {
            void queryClient.invalidateQueries({ queryKey: keys.order(orderId) })
            navigate(`/orders/${orderId}`, { replace: true })
        }
    }, [payErrorCode, orderId, queryClient, navigate])

    if (!orderId) {
        // B3: orderId потерян — не выдумывать id. Сначала stored из checkout.v1,
        // иначе GET /api/orders и взять актуальный (сервер отдаёт новые сверху).
        if (storedOrderId) {
            return <Navigate replace to={`/orders/${storedOrderId}/pay`} />
        }
        if (recoveryOrdersQuery.isPending) {
            return (
                <div>
                    <h1 className='mb-4 font-semibold text-2xl tracking-tight'>Оплата заказа</h1>
                    <div aria-busy='true' className='flex min-w-0 flex-col gap-3' role='status'>
                        <Skeleton className='h-11 w-full' />
                        <Skeleton className='h-11 w-full' />
                        <Skeleton className='h-10 w-40' />
                    </div>
                </div>
            )
        }
        if (recoveryOrdersQuery.isError) {
            return (
                <div>
                    <h1 className='mb-4 font-semibold text-2xl tracking-tight'>Оплата заказа</h1>
                    <Alert variant='destructive'>
                        <CircleAlert />
                        <AlertTitle>Не удалось загрузить заказ</AlertTitle>
                        <AlertDescription>{toErrorMessage(recoveryOrdersQuery.error)}</AlertDescription>
                    </Alert>
                    <Button
                        className='mt-4 w-full sm:w-auto'
                        onClick={() => void recoveryOrdersQuery.refetch()}
                        type='button'
                    >
                        Повторить
                    </Button>
                </div>
            )
        }
        const latest = recoveryOrdersQuery.data?.[0]
        if (latest) {
            return <Navigate replace to={`/orders/${latest.id}/pay`} />
        }
        return <Navigate replace to='/' />
    }

    if (orderQuery.isPending) {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-2xl tracking-tight'>Оплата заказа</h1>
                <div aria-busy='true' className='flex min-w-0 flex-col gap-3' role='status'>
                    <Skeleton className='h-11 w-full' />
                    <Skeleton className='h-11 w-full' />
                    <Skeleton className='h-10 w-40' />
                </div>
            </div>
        )
    }

    if (orderQuery.isError) {
        const isNotFound = isApiError(orderQuery.error) && orderQuery.error.status === 404
        return (
            <div>
                <h1 className='mb-4 font-semibold text-2xl tracking-tight'>Оплата заказа</h1>
                <Alert variant='destructive'>
                    <CircleAlert />
                    <AlertTitle>{isNotFound ? 'Заказ не найден' : 'Не удалось загрузить заказ'}</AlertTitle>
                    <AlertDescription>
                        {isNotFound
                            ? 'Такого заказа нет. Возможно, данные были сброшены.'
                            : toErrorMessage(orderQuery.error)}
                    </AlertDescription>
                </Alert>
                <div className='mt-4 flex min-w-0 flex-wrap gap-2'>
                    {isNotFound ? (
                        <Button asChild className='w-full sm:w-auto'>
                            <Link to='/'>Вернуться в каталог</Link>
                        </Button>
                    ) : (
                        <Button className='w-full sm:w-auto' onClick={() => void orderQuery.refetch()} type='button'>
                            Повторить
                        </Button>
                    )}
                </div>
            </div>
        )
    }

    const order = orderQuery.data

    if (order.paymentMethod !== 'card') {
        return <Navigate replace to={`/orders/${orderId}`} />
    }

    if (order.status === 'paid' && order.paymentStatus === 'succeeded') {
        return <Navigate replace to={`/orders/${orderId}`} />
    }

    if (isApiError(payMutation.error) && payMutation.error.code === 'PAYMENT_NOT_REQUIRED') {
        return <Navigate replace to={`/orders/${orderId}`} />
    }

    // ORDER_ALREADY_PAID обрабатывается эффектом выше (инвалидация + навигация),
    // отдельный render-редирект не нужен.
    if (sandboxQuery.isPending) {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-2xl tracking-tight'>Оплата заказа</h1>
                <div aria-busy='true' className='flex min-w-0 flex-col gap-3' role='status'>
                    <Skeleton className='h-11 w-full' />
                    <Skeleton className='h-11 w-full' />
                    <Skeleton className='h-10 w-40' />
                </div>
            </div>
        )
    }

    if (sandboxQuery.isError) {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-2xl tracking-tight'>Оплата заказа</h1>
                <Alert variant='destructive'>
                    <CircleAlert />
                    <AlertTitle>Не удалось загрузить тестовые карты</AlertTitle>
                    <AlertDescription>{toErrorMessage(sandboxQuery.error)}</AlertDescription>
                </Alert>
                <Button className='mt-4 w-full sm:w-auto' onClick={() => void sandboxQuery.refetch()} type='button'>
                    Повторить
                </Button>
            </div>
        )
    }

    const isDeclined = payment?.status === 'failed'
    const isCancelled = payment?.status === 'cancelled'
    const showRetry =
        isDeclined || isCancelled || payErrorCode === 'PAYMENT_FINALIZED' || cancelErrorCode === 'PAYMENT_FINALIZED'
    const showInProgress = payErrorCode === 'PAYMENT_IN_PROGRESS'
    const showFinalized = payErrorCode === 'PAYMENT_FINALIZED' || cancelErrorCode === 'PAYMENT_FINALIZED'
    const isProcessing =
        payMutation.isPending ||
        cancelMutation.isPending ||
        payment?.status === 'pending' ||
        payment?.status === 'processing'
    const mutationError = payMutation.error
    const isStaleError = mutationError instanceof Error && mutationError.message === 'stale'
    const isHandledPayCode =
        payErrorCode === 'PAYMENT_IN_PROGRESS' ||
        payErrorCode === 'PAYMENT_FINALIZED' ||
        payErrorCode === 'ORDER_ALREADY_PAID' ||
        payErrorCode === 'PAYMENT_NOT_REQUIRED'
    const showGenericPayError = mutationError !== null && !isStaleError && !isHandledPayCode
    const isStaleCancel = cancelMutation.error instanceof Error && cancelMutation.error.message === 'stale'
    const showGenericCancelError =
        cancelMutation.error !== null && cancelErrorCode !== 'PAYMENT_FINALIZED' && !isStaleCancel
    const selectedCard = sandboxCards.find((card) => card.id === selectedCardId) ?? null

    /**
     * Запускает новую попытку оплаты по выбранной карте.
     * @returns void
     */
    function handlePay() {
        if (!selectedCard || isProcessing) {
            return
        }
        if (payErrorCode === 'PAYMENT_FINALIZED' || cancelErrorCode === 'PAYMENT_FINALIZED') {
            // Прошлая попытка финализирована (на случай, если onError не успел
            // сбросить ключ): новая попытка обязана идти с новым ключом.
            clearPaymentKey()
            if (orderId) {
                void queryClient.invalidateQueries({ queryKey: keys.payments(orderId) })
            }
        }
        generationRef.current += 1
        payMutation.reset()
        cancelMutation.reset()
        payMutation.mutate({ scenario: selectedCard.scenario })
    }

    /**
     * Закрывает форму без оплаты: новая попытка со сценарием cancel.
     * Во время processing не вызывается — у попытки уже есть симуляция.
     * @returns void
     */
    function handleCancel() {
        if (payMutation.isPending || cancelMutation.isPending || isTerminal || isProcessing) {
            return
        }
        generationRef.current += 1
        payMutation.reset()
        cancelMutation.reset()
        cancelMutation.mutate()
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
                    {showGenericPayError ? (
                        <Alert variant='destructive'>
                            <CircleAlert />
                            <AlertTitle>Не удалось оплатить</AlertTitle>
                            <AlertDescription>{toErrorMessage(mutationError)}</AlertDescription>
                        </Alert>
                    ) : null}
                    {showGenericCancelError ? (
                        <Alert variant='destructive'>
                            <CircleAlert />
                            <AlertTitle>Не удалось отменить</AlertTitle>
                            <AlertDescription>{toErrorMessage(cancelMutation.error)}</AlertDescription>
                        </Alert>
                    ) : null}
                    <div className='flex min-w-0 flex-wrap gap-2'>
                        {showRetry ? (
                            <Button
                                className='w-full sm:w-auto'
                                disabled={isProcessing || !selectedCard}
                                onClick={handlePay}
                                type='button'
                            >
                                Оплатить снова
                            </Button>
                        ) : (
                            <Button
                                className='w-full sm:w-auto'
                                disabled={isProcessing || !selectedCard}
                                onClick={handlePay}
                                type='button'
                            >
                                Оплатить
                            </Button>
                        )}
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
                        <Link to={`/orders/${orderId}`}>К заказу</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
