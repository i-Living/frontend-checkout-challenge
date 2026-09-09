import type { getOrder } from '@/shared/api/endpoints'
import { formatMoney } from '@/shared/lib/money'

type Order = Awaited<ReturnType<typeof getOrder>>

function formatDelivery(delivery: Order['delivery']) {
    if (delivery.method === 'pickup') {
        return `Самовывоз, ${delivery.pickupPointId}`
    }
    const { city, street, house, apartment } = delivery.address
    const parts = [city, street, house]
    if (apartment) {
        parts.push(`кв. ${apartment}`)
    }
    return `Курьер, ${parts.join(', ')}`
}

export function OrderSummary({ order }: { order: Order }) {
    return (
        <div className='flex min-w-0 flex-col gap-4'>
            <div className='flex flex-col gap-1'>
                <p className='text-lg font-semibold'>Заказ {order.number}</p>
                <p className='text-sm text-muted-foreground'>{order.id}</p>
            </div>
            <ul className='flex min-w-0 flex-col gap-2'>
                {order.items.map((item) => (
                    <li key={item.productId} className='flex min-w-0 items-start justify-between gap-4'>
                        <span className='min-w-0 break-words'>
                            {item.title} × {item.quantity}
                        </span>
                        <span className='shrink-0'>{formatMoney(item.lineTotal)}</span>
                    </li>
                ))}
            </ul>
            <p>{formatDelivery(order.delivery)}</p>
            <p className='text-lg font-semibold'>{formatMoney(order.total)}</p>
        </div>
    )
}
