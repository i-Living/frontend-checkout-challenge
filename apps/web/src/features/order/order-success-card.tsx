/**
 * Карточка успешного заказа: общий каркас для карты и наличных.
 */
import { CircleCheck } from 'lucide-react'
import type { Order } from '@/shared/api/endpoints'
import { Card, CardContent } from '@/shared/ui/card'
import { OrderSummary } from './order-summary'

/**
 * Зелёная карточка успеха с сводкой заказа.
 * @param title Заголовок (оплачен / оплата при получении).
 * @param description Подзаголовок.
 * @param order Заказ с сервера.
 */
export function OrderSuccessCard({ title, description, order }: { title: string; description: string; order: Order }) {
    return (
        <Card className='min-w-0 max-w-xl gap-0 overflow-hidden py-0'>
            <div className='bg-green-600/10 px-6 pt-6 pb-5 dark:bg-green-500/10'>
                <span className='flex size-12 items-center justify-center rounded-full bg-green-600 text-white dark:bg-green-500 dark:text-green-950'>
                    <CircleCheck aria-hidden className='size-6' />
                </span>
                <h1 className='mt-3 font-semibold text-2xl tracking-tight'>{title}</h1>
                <p className='text-muted-foreground text-sm'>{description}</p>
            </div>
            <CardContent className='pt-5 pb-6'>
                <OrderSummary order={order} />
            </CardContent>
        </Card>
    )
}
