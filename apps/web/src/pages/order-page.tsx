import { useQuery } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { OrderSummary } from '@/features/order/order-summary'
import { getOrder, listOrders } from '@/shared/api/endpoints'
import { isAbortError, isApiError } from '@/shared/api/errors'
import { queryKeys } from '@/shared/api/query-keys'
import { newestByCreatedAt } from '@/shared/lib/newest'
import { useSessionStore } from '@/shared/store/session-store'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

function errorText(error: unknown) {
    if (isApiError(error)) {
        return error.message
    }
    return 'Не удалось загрузить заказ'
}

export function OrderPage() {
    const { orderId: routeOrderId } = useParams<{ orderId: string }>()
    const storedOrderId = useSessionStore((state) => state.orderId)
    const setOrderId = useSessionStore((state) => state.setOrderId)
    const [listedOrderId, setListedOrderId] = useState<string | null>(null)
    const [recoverError, setRecoverError] = useState<unknown>(null)
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
                setRecoverError(error)
            }
        })
        return () => {
            controller.abort()
        }
    }, [recoverMissingOrder, routeOrderId, setOrderId, storedOrderId])

    const orderQuery = useQuery({
        queryKey: queryKeys.order(orderId ?? ''),
        queryFn: ({ signal }) => getOrder(orderId!, signal),
        enabled: Boolean(orderId),
    })

    if (!orderId && recoverError) {
        return (
            <Alert variant='destructive'>
                <AlertCircle />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription className='gap-3'>
                    <p>{errorText(recoverError)}</p>
                    <Button
                        type='button'
                        variant='outline'
                        className='h-11 min-h-11 w-full'
                        onClick={() => {
                            setRecoverError(null)
                            void recoverMissingOrder().catch((error) => {
                                if (!isAbortError(error)) {
                                    setRecoverError(error)
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

    if (!orderId || orderQuery.isPending) {
        return (
            <div className='flex flex-col gap-4' role='status' aria-busy='true' aria-label='Загрузка заказа'>
                <Skeleton className='h-8 w-56' />
                <Skeleton className='h-40 w-full' />
            </div>
        )
    }

    if (orderQuery.error) {
        return (
            <Alert variant='destructive'>
                <AlertCircle />
                <AlertTitle>Ошибка</AlertTitle>
                <AlertDescription className='gap-3'>
                    <p>{errorText(orderQuery.error)}</p>
                    <Button
                        type='button'
                        variant='outline'
                        className='h-11 min-h-11 w-full'
                        onClick={() => void orderQuery.refetch()}
                    >
                        Повторить
                    </Button>
                </AlertDescription>
            </Alert>
        )
    }

    const order = orderQuery.data
    if (!order) {
        return null
    }

    const isCardPaid = order.paymentMethod === 'card' && order.status === 'paid' && order.paymentStatus === 'succeeded'
    const isCashConfirmed = order.status === 'confirmed' && order.paymentStatus === 'unpaid'
    const isProcessing = order.status === 'awaiting_payment' && order.paymentStatus === 'pending'
    const canReturnToPay =
        order.status === 'awaiting_payment' &&
        (order.paymentStatus === 'failed' || order.paymentStatus === 'cancelled' || order.paymentStatus === 'unpaid')

    return (
        <div className='flex min-w-0 flex-col gap-6'>
            {isCardPaid ? (
                <div className='flex min-w-0 flex-col gap-4 rounded-lg border border-emerald-600/40 bg-emerald-50 p-4 text-emerald-950'>
                    <h1 className='flex min-w-0 items-start gap-2 text-2xl font-semibold'>
                        <CheckCircle2 className='mt-1 size-6 shrink-0' aria-hidden='true' />
                        <span className='min-w-0 break-words'>Заказ оплачен</span>
                    </h1>
                    <OrderSummary order={order} />
                </div>
            ) : isCashConfirmed ? (
                <div className='flex min-w-0 flex-col gap-4 rounded-lg border border-emerald-600/40 bg-emerald-50 p-4 text-emerald-950'>
                    <h1 className='flex min-w-0 items-start gap-2 text-2xl font-semibold'>
                        <CheckCircle2 className='mt-1 size-6 shrink-0' aria-hidden='true' />
                        <span className='min-w-0 break-words'>Заказ оформлен, оплата при получении</span>
                    </h1>
                    <OrderSummary order={order} />
                </div>
            ) : (
                <h1 className='text-2xl font-semibold'>Заказ</h1>
            )}
            {isProcessing ? (
                <Alert role='status' aria-busy='true'>
                    <Loader2 className='animate-spin' />
                    <AlertTitle className='line-clamp-none'>Оплата ещё обрабатывается</AlertTitle>
                </Alert>
            ) : null}
            {canReturnToPay ? (
                <Button asChild className='h-11 min-h-11 w-full'>
                    <Link to={`/orders/${order.id}/pay`}>Вернуться к оплате</Link>
                </Button>
            ) : null}
            <Button asChild variant='outline' className='h-11 min-h-11 w-full'>
                <Link to='/'>Вернуться в каталог</Link>
            </Button>
        </div>
    )
}
