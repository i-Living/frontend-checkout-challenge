import type { FormEvent } from 'react'
import type { getCheckoutOptions } from '@/shared/api/endpoints'
import type { DeliveryMethod, PaymentMethod } from '@/shared/store/session-store'
import { useSessionStore } from '@/shared/store/session-store'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { DeliveryFields } from './delivery-fields'

type CheckoutOptions = Awaited<ReturnType<typeof getCheckoutOptions>>

export type CheckoutFieldErrors = {
    name?: string
    email?: string
    phone?: string
    pickupPointId?: string
    city?: string
    street?: string
    house?: string
}

type CheckoutFormProps = {
    options: CheckoutOptions | undefined
    fieldErrors: CheckoutFieldErrors
    onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function CheckoutForm({ options, fieldErrors, onSubmit }: CheckoutFormProps) {
    const name = useSessionStore((state) => state.name)
    const email = useSessionStore((state) => state.email)
    const phone = useSessionStore((state) => state.phone)
    const deliveryMethod = useSessionStore((state) => state.deliveryMethod)
    const pickupPointId = useSessionStore((state) => state.pickupPointId)
    const address = useSessionStore((state) => state.address)
    const paymentMethod = useSessionStore((state) => state.paymentMethod)
    const setName = useSessionStore((state) => state.setName)
    const setEmail = useSessionStore((state) => state.setEmail)
    const setPhone = useSessionStore((state) => state.setPhone)
    const setDeliveryMethod = useSessionStore((state) => state.setDeliveryMethod)
    const setPickupPointId = useSessionStore((state) => state.setPickupPointId)
    const setAddress = useSessionStore((state) => state.setAddress)
    const setPaymentMethod = useSessionStore((state) => state.setPaymentMethod)

    const pickupPoints = options?.deliveryMethods.find((method) => method.id === 'pickup')?.pickupPoints ?? []

    return (
        <form id='checkout-form' className='flex min-w-0 flex-col gap-6' noValidate onSubmit={onSubmit}>
            <div className='flex flex-col gap-2'>
                <Label htmlFor='checkout-name'>Имя</Label>
                <Input
                    id='checkout-name'
                    className='h-11 min-h-11'
                    name='name'
                    autoComplete='name'
                    value={name}
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? 'checkout-name-error' : undefined}
                    onChange={(event) => setName(event.target.value)}
                />
                {fieldErrors.name ? (
                    <p id='checkout-name-error' className='text-sm text-destructive'>
                        {fieldErrors.name}
                    </p>
                ) : null}
            </div>
            <div className='flex flex-col gap-2'>
                <Label htmlFor='checkout-email'>Email</Label>
                <Input
                    id='checkout-email'
                    className='h-11 min-h-11'
                    name='email'
                    type='email'
                    autoComplete='email'
                    value={email}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'checkout-email-error' : undefined}
                    onChange={(event) => setEmail(event.target.value)}
                />
                {fieldErrors.email ? (
                    <p id='checkout-email-error' className='text-sm text-destructive'>
                        {fieldErrors.email}
                    </p>
                ) : null}
            </div>
            <div className='flex flex-col gap-2'>
                <Label htmlFor='checkout-phone'>Телефон</Label>
                <Input
                    id='checkout-phone'
                    className='h-11 min-h-11'
                    name='phone'
                    type='tel'
                    autoComplete='tel'
                    value={phone}
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={fieldErrors.phone ? 'checkout-phone-error' : undefined}
                    onChange={(event) => setPhone(event.target.value)}
                />
                {fieldErrors.phone ? (
                    <p id='checkout-phone-error' className='text-sm text-destructive'>
                        {fieldErrors.phone}
                    </p>
                ) : null}
            </div>
            {options ? (
                <fieldset className='flex flex-col gap-3'>
                    <legend className='text-sm font-medium'>Доставка</legend>
                    <RadioGroup
                        value={deliveryMethod || undefined}
                        onValueChange={(value) => setDeliveryMethod(value as DeliveryMethod)}
                    >
                        {options.deliveryMethods.map((method) => {
                            const fieldId = `checkout-delivery-${method.id}`
                            return (
                                <div key={method.id} className='flex min-h-11 items-center gap-3'>
                                    <RadioGroupItem id={fieldId} value={method.id} />
                                    <Label htmlFor={fieldId} className='font-normal'>
                                        {method.title}
                                    </Label>
                                </div>
                            )
                        })}
                    </RadioGroup>
                </fieldset>
            ) : null}
            <DeliveryFields
                deliveryMethod={deliveryMethod}
                pickupPoints={pickupPoints}
                pickupPointId={pickupPointId}
                address={address}
                errors={fieldErrors}
                onPickupPointIdChange={setPickupPointId}
                onAddressChange={setAddress}
            />
            {options ? (
                <fieldset className='flex flex-col gap-3'>
                    <legend className='text-sm font-medium'>Оплата</legend>
                    <RadioGroup
                        value={paymentMethod || undefined}
                        onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                    >
                        {options.paymentMethods.map((method) => {
                            const fieldId = `checkout-payment-${method.id}`
                            return (
                                <div key={method.id} className='flex min-h-11 items-center gap-3'>
                                    <RadioGroupItem id={fieldId} value={method.id} />
                                    <Label htmlFor={fieldId} className='font-normal'>
                                        {method.title}
                                    </Label>
                                </div>
                            )
                        })}
                    </RadioGroup>
                </fieldset>
            ) : null}
        </form>
    )
}
