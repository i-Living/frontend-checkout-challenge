/**
 * Поля доставки: адрес курьера или выбор пункта выдачи.
 */
import type { CheckoutOptions } from '@/shared/api/endpoints'
import type { CheckoutDraft } from '@/shared/store/session-store'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

/**
 * Список пунктов выдачи из опций доставки.
 */
type PickupPoints = CheckoutOptions['deliveryMethods'][number]['pickupPoints']

/**
 * Значения полей доставки.
 */
type DeliveryValues = Pick<CheckoutDraft, 'pickupPointId' | 'city' | 'street' | 'house' | 'apartment'>

/**
 * Ошибки полей доставки.
 */
type DeliveryErrors = Partial<Record<'pickupPointId' | 'city' | 'street' | 'house', string>>

/**
 * Пропсы полей доставки.
 * @property method выбранный способ доставки
 * @property pickupPoints список пунктов выдачи для самовывоза
 * @property values текущие значения полей доставки
 * @property errors ошибки валидации полей доставки
 * @property onChange обработчик изменения полей доставки
 */
interface DeliveryFieldsProps {
    method: string
    pickupPoints: PickupPoints
    values: DeliveryValues
    errors: DeliveryErrors
    onChange: (patch: Partial<DeliveryValues>) => void
}

/**
 * Поля доставки под выбранный способ: адрес курьера или пункт выдачи.
 * @param method выбранный способ доставки
 * @param pickupPoints список пунктов выдачи для самовывоза
 * @param values текущие значения полей доставки
 * @param errors ошибки валидации полей доставки
 * @param onChange обработчик изменения полей доставки
 */
export function DeliveryFields({ method, pickupPoints, values, errors, onChange }: DeliveryFieldsProps) {
    if (method === 'courier') {
        return (
            <div className='flex min-w-0 flex-col gap-4'>
                <div className='flex min-w-0 flex-col gap-1.5'>
                    <Label htmlFor='checkout-city'>Город</Label>
                    <Input
                        aria-describedby={errors.city ? 'checkout-city-error' : undefined}
                        aria-invalid={Boolean(errors.city)}
                        autoComplete='address-level2'
                        id='checkout-city'
                        onChange={(event) => onChange({ city: event.target.value })}
                        value={values.city}
                    />
                    {errors.city ? (
                        <p className='text-destructive text-sm' id='checkout-city-error' role='alert'>
                            {errors.city}
                        </p>
                    ) : null}
                </div>
                <div className='flex min-w-0 flex-col gap-1.5'>
                    <Label htmlFor='checkout-street'>Улица</Label>
                    <Input
                        aria-describedby={errors.street ? 'checkout-street-error' : undefined}
                        aria-invalid={Boolean(errors.street)}
                        autoComplete='street-address'
                        id='checkout-street'
                        onChange={(event) => onChange({ street: event.target.value })}
                        value={values.street}
                    />
                    {errors.street ? (
                        <p className='text-destructive text-sm' id='checkout-street-error' role='alert'>
                            {errors.street}
                        </p>
                    ) : null}
                </div>
                <div className='grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2'>
                    <div className='flex min-w-0 flex-col gap-1.5'>
                        <Label htmlFor='checkout-house'>Дом</Label>
                        <Input
                            aria-describedby={errors.house ? 'checkout-house-error' : undefined}
                            aria-invalid={Boolean(errors.house)}
                            id='checkout-house'
                            onChange={(event) => onChange({ house: event.target.value })}
                            value={values.house}
                        />
                        {errors.house ? (
                            <p className='text-destructive text-sm' id='checkout-house-error' role='alert'>
                                {errors.house}
                            </p>
                        ) : null}
                    </div>
                    <div className='flex min-w-0 flex-col gap-1.5'>
                        <Label htmlFor='checkout-apartment'>Квартира</Label>
                        <Input
                            id='checkout-apartment'
                            onChange={(event) => onChange({ apartment: event.target.value })}
                            value={values.apartment}
                        />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='flex min-w-0 flex-col gap-1.5'>
            <Label htmlFor='checkout-pickup-point'>Пункт выдачи</Label>
            <select
                aria-describedby={errors.pickupPointId ? 'checkout-pickup-point-error' : undefined}
                aria-invalid={Boolean(errors.pickupPointId)}
                className='border-input flex h-11 min-h-[44px] w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm'
                id='checkout-pickup-point'
                onChange={(event) => onChange({ pickupPointId: event.target.value })}
                value={values.pickupPointId}
            >
                <option value=''>Выберите пункт выдачи</option>
                {pickupPoints.map((point) => (
                    <option key={point.id} value={point.id}>
                        {point.title} — {point.address}
                    </option>
                ))}
            </select>
            {errors.pickupPointId ? (
                <p className='text-destructive text-sm' id='checkout-pickup-point-error' role='alert'>
                    {errors.pickupPointId}
                </p>
            ) : null}
        </div>
    )
}
