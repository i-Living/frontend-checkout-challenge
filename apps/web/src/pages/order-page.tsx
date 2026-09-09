/**
 * Экран заказа (`/orders/:orderId`).
 * Отвечает за итог по серверному заказу: успех карты/наличных, ожидание, decline/cancel.
 */
import { useQuery } from '@tanstack/react-query'
import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { OrderSummary } from '@/features/order/order-summary'
import { getOrder } from '@/shared/api/endpoints'
import { isApiError } from '@/shared/api/errors'
import { keys } from '@/shared/api/query-keys'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

/**
 * Экран заказа (`/orders/:orderId`): показывает статус только по серверному заказу.
 * Параметр orderId — через useParams, пропсов нет. Ветки: нет id, скелетон, ошибка,
 * успех карты, успех наличных, обработка, decline/cancel, прочий статус.
 * @returns Разметка страницы заказа
 */
export function OrderPage() {
    const { orderId } = useParams()
    const orderQuery = useQuery({
        queryKey: keys.order(orderId),
        queryFn: ({ signal }) => getOrder(orderId as string, signal),
        enabled: Boolean(orderId),
    })

    if (!orderId) {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-xl'>Заказ</h1>
                <Alert variant='destructive'>
                    <CircleAlert />
                    <AlertTitle>Не удалось загрузить заказ</AlertTitle>
                    <AlertDescription>Нет идентификатора заказа.</AlertDescription>
                </Alert>
                <Button asChild className='mt-4 w-full sm:w-auto'>
                    <Link to='/'>Вернуться в каталог</Link>
                </Button>
            </div>
        )
    }

    if (orderQuery.isPending) {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-xl'>Заказ</h1>
                <div className='flex min-w-0 max-w-xl flex-col gap-3'>
                    <Skeleton className='h-5 w-1/3' />
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-4 w-full' />
                    <Skeleton className='h-10 w-40' />
                </div>
            </div>
        )
    }

    if (orderQuery.isError) {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-xl'>Заказ</h1>
                <Alert variant='destructive'>
                    <CircleAlert />
                    <AlertTitle>Не удалось загрузить заказ</AlertTitle>
                    <AlertDescription>
                        {isApiError(orderQuery.error) ? orderQuery.error.message : 'Попробуйте ещё раз.'}
                    </AlertDescription>
                </Alert>
                <Button className='mt-4 w-full sm:w-auto' onClick={() => void orderQuery.refetch()} type='button'>
                    Повторить
                </Button>
            </div>
        )
    }

    const order = orderQuery.data
    const isCardSuccess =
        order.paymentMethod === 'card' && order.status === 'paid' && order.paymentStatus === 'succeeded'
    const isCashSuccess =
        order.paymentMethod === 'cash_on_delivery' && order.status === 'confirmed' && order.paymentStatus === 'unpaid'

    if (isCardSuccess) {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-xl'>Заказ оплачен</h1>
                <Card className='min-w-0 max-w-xl'>
                    <CardContent className='flex min-w-0 flex-col gap-4 pt-6'>
                        <CircleCheck aria-hidden className='size-6 shrink-0 text-green-600 dark:text-green-500' />
                        <OrderSummary order={order} />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (isCashSuccess) {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-xl'>Заказ оформлен, оплата при получении</h1>
                <Card className='min-w-0 max-w-xl'>
                    <CardContent className='flex min-w-0 flex-col gap-4 pt-6'>
                        <CircleCheck aria-hidden className='size-6 shrink-0 text-green-600 dark:text-green-500' />
                        <OrderSummary order={order} />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (order.status === 'awaiting_payment' && order.paymentStatus === 'pending') {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-xl'>Заказ</h1>
                <p aria-live='polite' className='flex min-w-0 items-center gap-2 text-sm'>
                    <LoaderCircle aria-hidden className='size-4 shrink-0 animate-spin' />
                    Оплата ещё обрабатывается
                </p>
                <Button asChild className='mt-4 w-full sm:w-auto' variant='outline'>
                    <Link to={`/orders/${orderId}/pay`}>Вернуться к оплате</Link>
                </Button>
            </div>
        )
    }

    if (
        order.status === 'awaiting_payment' &&
        (order.paymentStatus === 'failed' || order.paymentStatus === 'cancelled' || order.paymentStatus === 'unpaid')
    ) {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-xl'>Заказ</h1>
                <div className='min-w-0 max-w-xl'>
                    <OrderSummary order={order} />
                </div>
                <Button asChild className='mt-4 w-full sm:w-auto'>
                    <Link to={`/orders/${orderId}/pay`}>Вернуться к оплате</Link>
                </Button>
            </div>
        )
    }

    return (
        <div>
            <h1 className='mb-4 font-semibold text-xl'>Заказ</h1>
            <div className='min-w-0 max-w-xl'>
                <OrderSummary order={order} />
            </div>
        </div>
    )
}
