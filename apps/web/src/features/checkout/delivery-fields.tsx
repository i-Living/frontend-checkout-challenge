/**
 * Поля доставки: адрес курьера или выбор пункта выдачи.
 */
import type { CheckoutOptions } from '@/shared/api/endpoints'
import type { CheckoutDraft } from '@/shared/store/session-store'
import { FormField } from '@/shared/ui/form-field'
import { Input } from '@/shared/ui/input'

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
 */
export function DeliveryFields({ method, pickupPoints, values, errors, onChange }: DeliveryFieldsProps) {
    if (method === 'courier') {
        return (
            <div className='flex min-w-0 flex-col gap-4'>
                <FormField error={errors.city} id='checkout-city' label='Город'>
                    <Input
                        autoComplete='address-level2'
                        onChange={(event) => onChange({ city: event.target.value })}
                        value={values.city}
                    />
                </FormField>
                <FormField error={errors.street} id='checkout-street' label='Улица'>
                    <Input
                        autoComplete='street-address'
                        onChange={(event) => onChange({ street: event.target.value })}
                        value={values.street}
                    />
                </FormField>
                <div className='grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2'>
                    <FormField error={errors.house} id='checkout-house' label='Дом'>
                        <Input onChange={(event) => onChange({ house: event.target.value })} value={values.house} />
                    </FormField>
                    <FormField id='checkout-apartment' label='Квартира'>
                        <Input
                            onChange={(event) => onChange({ apartment: event.target.value })}
                            value={values.apartment}
                        />
                    </FormField>
                </div>
            </div>
        )
    }

    return (
        <FormField error={errors.pickupPointId} id='checkout-pickup-point' label='Пункт выдачи'>
            <select
                className='border-input flex h-11 min-h-[44px] w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm'
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
        </FormField>
    )
}
