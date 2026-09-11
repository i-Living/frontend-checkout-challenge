/**
 * Успех заказа. Карта и наличные делят каркас; различаются title/description со страницы.
 * Суммы внутри — из order, не из только что завершённого платежа.
 */
import { CircleCheck } from 'lucide-react'
import type { Order } from '@/shared/api/endpoints'
import { Card, CardContent } from '@/shared/ui/card'
import { OrderSummary } from './order-summary'

/**
 * Показывать только после проверки статусов на OrderPage. Сама карточка статусы не проверяет.
 * @param title «Заказ оплачен» или «Заказ оформлен, оплата при получении»
 * @param description Короткий подзаголовок
 * @param order GET /api/orders/:id, не ответ 201 создания
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
