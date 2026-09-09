/**
 * Краткая сводка заказа: позиции, доставка и итоги.
 */
import type { Order } from '@/shared/api/endpoints'
import { formatMoney } from '@/shared/lib/money'

/**
 * Пропсы сводки заказа.
 * @property order заказ с сервера для отображения
 */
interface OrderSummaryProps {
    order: Order
}

/**
 * Формирует строку доставки: самовывоз или адрес курьера.
 * @param order заказ с сервера
 */
function deliveryText(order: Order): string {
    if (order.delivery.method === 'pickup') {
        return `Самовывоз: ${order.delivery.pickupPointId}`
    }
    const address = order.delivery.address
    const apartment = address.apartment ? `, кв. ${address.apartment}` : ''
    return `Курьер: ${address.city}, ${address.street}, ${address.house}${apartment}`
}

/**
 * Сводка заказа: позиции, способ доставки и итоги.
 * @param order заказ с сервера для отображения
 */
export function OrderSummary({ order }: OrderSummaryProps) {
    return (
        <div className='flex min-w-0 flex-col gap-4'>
            <p className='text-muted-foreground text-sm'>Заказ {order.number}</p>
            <ul className='flex min-w-0 flex-col gap-2'>
                {order.items.map((item) => (
                    <li
                        className='flex min-w-0 flex-wrap items-baseline justify-between gap-2 text-sm'
                        key={item.productId}
                    >
                        <span className='min-w-0 flex-1'>
                            {item.title} × {item.quantity}
                        </span>
                        <span className='font-medium'>{formatMoney(item.lineTotal)}</span>
                    </li>
                ))}
            </ul>
            <p className='min-w-0 text-sm'>{deliveryText(order)}</p>
            <div className='flex min-w-0 flex-col gap-1 border-t pt-3 text-sm'>
                <p className='flex min-w-0 flex-wrap justify-between gap-2'>
                    <span className='text-muted-foreground'>Товары</span>
                    <span className='font-medium'>{formatMoney(order.subtotal)}</span>
                </p>
                <p className='flex min-w-0 flex-wrap justify-between gap-2'>
                    <span className='text-muted-foreground'>Доставка</span>
                    <span className='font-medium'>{formatMoney(order.shipping)}</span>
                </p>
                <p className='flex min-w-0 flex-wrap justify-between gap-2 font-semibold'>
                    <span>Итого</span>
                    <span>{formatMoney(order.total)}</span>
                </p>
            </div>
        </div>
    )
}
