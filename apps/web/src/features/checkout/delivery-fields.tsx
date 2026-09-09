import type { CheckoutAddress } from '@/shared/store/session-store'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'

export type PickupPointOption = {
    id: string
    title: string
}

export type DeliveryFieldErrors = {
    pickupPointId?: string
    city?: string
    street?: string
    house?: string
}

type DeliveryFieldsProps = {
    deliveryMethod: 'pickup' | 'courier' | ''
    pickupPoints: PickupPointOption[]
    pickupPointId: string
    address: CheckoutAddress
    errors: DeliveryFieldErrors
    onPickupPointIdChange: (pickupPointId: string) => void
    onAddressChange: (patch: Partial<CheckoutAddress>) => void
}

export function DeliveryFields({
    deliveryMethod,
    pickupPoints,
    pickupPointId,
    address,
    errors,
    onPickupPointIdChange,
    onAddressChange,
}: DeliveryFieldsProps) {
    if (deliveryMethod === 'pickup') {
        return (
            <div className='flex flex-col gap-2'>
                <Label htmlFor='checkout-pickup-point'>Пункт выдачи</Label>
                <Select value={pickupPointId || undefined} onValueChange={onPickupPointIdChange}>
                    <SelectTrigger
                        id='checkout-pickup-point'
                        className='h-11 w-full min-h-11'
                        aria-invalid={Boolean(errors.pickupPointId)}
                        aria-describedby={errors.pickupPointId ? 'checkout-pickup-point-error' : undefined}
                    >
                        <SelectValue placeholder='Выберите пункт выдачи' />
                    </SelectTrigger>
                    <SelectContent>
                        {pickupPoints.map((point) => (
                            <SelectItem key={point.id} value={point.id}>
                                {point.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.pickupPointId ? (
                    <p id='checkout-pickup-point-error' className='text-sm text-destructive'>
                        {errors.pickupPointId}
                    </p>
                ) : null}
            </div>
        )
    }

    if (deliveryMethod === 'courier') {
        return (
            <div className='flex flex-col gap-4'>
                <div className='flex flex-col gap-2'>
                    <Label htmlFor='checkout-city'>Город</Label>
                    <Input
                        id='checkout-city'
                        className='h-11 min-h-11'
                        value={address.city}
                        autoComplete='address-level2'
                        aria-invalid={Boolean(errors.city)}
                        aria-describedby={errors.city ? 'checkout-city-error' : undefined}
                        onChange={(event) => onAddressChange({ city: event.target.value })}
                    />
                    {errors.city ? (
                        <p id='checkout-city-error' className='text-sm text-destructive'>
                            {errors.city}
                        </p>
                    ) : null}
                </div>
                <div className='flex flex-col gap-2'>
                    <Label htmlFor='checkout-street'>Улица</Label>
                    <Input
                        id='checkout-street'
                        className='h-11 min-h-11'
                        value={address.street}
                        autoComplete='address-line1'
                        aria-invalid={Boolean(errors.street)}
                        aria-describedby={errors.street ? 'checkout-street-error' : undefined}
                        onChange={(event) => onAddressChange({ street: event.target.value })}
                    />
                    {errors.street ? (
                        <p id='checkout-street-error' className='text-sm text-destructive'>
                            {errors.street}
                        </p>
                    ) : null}
                </div>
                <div className='flex flex-col gap-2'>
                    <Label htmlFor='checkout-house'>Дом</Label>
                    <Input
                        id='checkout-house'
                        className='h-11 min-h-11'
                        value={address.house}
                        autoComplete='address-line2'
                        aria-invalid={Boolean(errors.house)}
                        aria-describedby={errors.house ? 'checkout-house-error' : undefined}
                        onChange={(event) => onAddressChange({ house: event.target.value })}
                    />
                    {errors.house ? (
                        <p id='checkout-house-error' className='text-sm text-destructive'>
                            {errors.house}
                        </p>
                    ) : null}
                </div>
                <div className='flex flex-col gap-2'>
                    <Label htmlFor='checkout-apartment'>Квартира</Label>
                    <Input
                        id='checkout-apartment'
                        className='h-11 min-h-11'
                        value={address.apartment}
                        onChange={(event) => onAddressChange({ apartment: event.target.value })}
                    />
                </div>
            </div>
        )
    }

    return null
}
