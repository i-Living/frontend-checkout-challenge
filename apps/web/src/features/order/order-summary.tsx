/**
 * Сводка заказа с сервера. Итоги не пересчитывать: subtotal/shipping/total уже в order.
 */
import type { Order } from '@/shared/api/endpoints'
import { useCheckoutOptions } from '@/shared/api/queries'
import { formatMoney } from '@/shared/lib/money'

/**
 * Пропсы сводки.
 * @property order GET заказа; quote после создания заказа уже не актуален
 */
interface OrderSummaryProps {
    order: Order
}

/**
 * Самовывоз без названия пункта — запасной текст с id, пока options не загрузились.
 * @param order Заказ
 * @param pickupTitle «Центр — Учебная, 1» из options, не сырой pickupPointId
 */
function deliveryText(order: Order, pickupTitle?: string): string {
    if (order.delivery.method === 'pickup') {
        return pickupTitle ? `Самовывоз: ${pickupTitle}` : `Самовывоз (ID пункта: ${order.delivery.pickupPointId})`
    }
    const address = order.delivery.address
    const apartment = address.apartment ? `, кв. ${address.apartment}` : ''
    return `Курьер: ${address.city}, ${address.street}, ${address.house}${apartment}`
}

/**
 * Название пункта — из GET options (staleTime 60s), не из id в заказе.
 * @param order Заказ с сервера
 */
export function OrderSummary({ order }: OrderSummaryProps) {
    // Название пункта выдачи — только из API, сырой id не показываем без подписи.
    const optionsQuery = useCheckoutOptions(60_000)
    const pickupPoints = optionsQuery.data?.deliveryMethods.find((item) => item.id === 'pickup')?.pickupPoints ?? []
    const pickupPointId = order.delivery.method === 'pickup' ? order.delivery.pickupPointId : undefined
    const pickupPoint = pickupPointId ? pickupPoints.find((point) => point.id === pickupPointId) : undefined
    const pickupTitle = pickupPoint ? `${pickupPoint.title} — ${pickupPoint.address}` : undefined
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
            <p className='min-w-0 text-sm'>{deliveryText(order, pickupTitle)}</p>
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
