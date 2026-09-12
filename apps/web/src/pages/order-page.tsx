/**
 * `/orders/:orderId`. Успех только по GET заказа: карта paid+succeeded, наличные confirmed+unpaid.
 * 201 создания и succeeded платежа сами по себе сюда не ведут.
 */
import { CircleAlert, LoaderCircle } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { routes } from '@/app/routes'
import { OrderSuccessCard } from '@/features/order/order-success-card'
import { OrderSummary } from '@/features/order/order-summary'
import { useOrder } from '@/shared/api/queries'
import { usePageTitle } from '@/shared/lib/use-page-title'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { queryGate } from '@/shared/ui/query-gate'
import { Skeleton } from '@/shared/ui/skeleton'

/**
 * Пока GET заказа. Не показывать «оплачено» по данным из стора.
 */
function OrderSkeleton() {
    return (
        <div className='flex min-w-0 max-w-xl flex-col gap-3' role='status'>
            <Skeleton className='h-5 w-1/3' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-10 w-40' />
        </div>
    )
}

/**
 * Поллинг заказа только при awaiting_payment + pending. Decline/cancel оставляют заказ и ссылку на /pay.
 * @returns Страница заказа
 */
export function OrderPage() {
    usePageTitle('Заказ')
    const { orderId } = useParams()
    const orderQuery = useOrder(orderId, (order) =>
        order && order.status === 'awaiting_payment' && order.paymentStatus === 'pending' ? 2000 : false,
    )

    if (!orderId) {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-2xl tracking-tight'>Заказ</h1>
                <Alert variant='destructive'>
                    <CircleAlert />
                    <AlertTitle>Не удалось загрузить заказ</AlertTitle>
                    <AlertDescription>Нет идентификатора заказа.</AlertDescription>
                </Alert>
                <Button asChild className='mt-4 w-full sm:w-auto'>
                    <Link to={routes.catalog}>Вернуться в каталог</Link>
                </Button>
            </div>
        )
    }

    const blocked = queryGate(orderQuery, {
        title: 'Заказ',
        errorTitle: 'Не удалось загрузить заказ',
        skeleton: <OrderSkeleton />,
        notFoundTitle: 'Заказ не найден',
        notFoundDescription: 'Такого заказа нет. Возможно, данные были сброшены.',
    })
    if (blocked) {
        return blocked
    }

    const order = orderQuery.data
    if (!order) {
        return null
    }

    const isCardSuccess =
        order.paymentMethod === 'card' && order.status === 'paid' && order.paymentStatus === 'succeeded'
    const isCashSuccess =
        order.paymentMethod === 'cash_on_delivery' && order.status === 'confirmed' && order.paymentStatus === 'unpaid'

    if (isCardSuccess) {
        return (
            <OrderSuccessCard
                description='Спасибо за покупку! Детали заказа ниже.'
                order={order}
                title='Заказ оплачен'
            />
        )
    }

    if (isCashSuccess) {
        return (
            <OrderSuccessCard
                description='Детали заказа ниже.'
                order={order}
                title='Заказ оформлен, оплата при получении'
            />
        )
    }

    if (order.status === 'awaiting_payment' && order.paymentStatus === 'pending') {
        return (
            <div>
                <h1 className='mb-4 font-semibold text-2xl tracking-tight'>Заказ</h1>
                <p aria-live='polite' className='flex min-w-0 items-center gap-2 text-sm'>
                    <LoaderCircle aria-hidden className='size-4 shrink-0 animate-spin' />
                    Оплата ещё обрабатывается
                </p>
                <Button asChild className='mt-4 w-full sm:w-auto' variant='outline'>
                    <Link to={routes.paymentRoute(orderId)}>Вернуться к оплате</Link>
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
                <h1 className='mb-4 font-semibold text-2xl tracking-tight'>Заказ</h1>
                <div className='min-w-0 max-w-xl'>
                    <OrderSummary order={order} />
                </div>
                <Button asChild className='mt-4 w-full sm:w-auto'>
                    <Link to={routes.paymentRoute(orderId)}>Вернуться к оплате</Link>
                </Button>
            </div>
        )
    }

    return (
        <div>
            <h1 className='mb-4 font-semibold text-2xl tracking-tight'>Заказ</h1>
            <div className='min-w-0 max-w-xl'>
                <OrderSummary order={order} />
            </div>
        </div>
    )
}
