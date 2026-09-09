/**
 * Форма оформления заказа: контакты, способ доставки и способ оплаты.
 */

import { Truck, User, Wallet } from 'lucide-react'
import type { FormEvent } from 'react'
import type { CheckoutOptions } from '@/shared/api/endpoints'
import type { CheckoutDraft } from '@/shared/store/session-store'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { FormField } from '@/shared/ui/form-field'
import { Input } from '@/shared/ui/input'
import { OptionRadioGroup } from '@/shared/ui/option-radio-group'
import { DeliveryFields } from './delivery-fields'

/**
 * Ошибки полей формы оформления заказа.
 */
export type CheckoutFieldErrors = Partial<
    Record<'name' | 'email' | 'phone' | 'pickupPointId' | 'city' | 'street' | 'house', string>
>

/**
 * Пропсы формы оформления заказа.
 */
interface CheckoutFormProps {
    draft: CheckoutDraft
    errors: CheckoutFieldErrors
    options: CheckoutOptions
    isPending: boolean
    submitLabel: string
    onDraftChange: (patch: Partial<CheckoutDraft>) => void
    onSubmit: (draft: CheckoutDraft) => void
}

/**
 * Форма оформления заказа с контактами, доставкой и оплатой.
 */
export function CheckoutForm({
    draft,
    errors,
    options,
    isPending,
    submitLabel,
    onDraftChange,
    onSubmit,
}: CheckoutFormProps) {
    const pickupMethod = options.deliveryMethods.find((item) => item.id === 'pickup')
    const pickupPoints = pickupMethod?.pickupPoints ?? []

    /**
     * Отменяет стандартную отправку и передает черновик наружу.
     * @param event событие отправки формы
     */
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        onSubmit(draft)
    }

    return (
        <form className='flex min-w-0 flex-col gap-4' noValidate onSubmit={handleSubmit}>
            <Card className='min-w-0'>
                <CardHeader className='flex min-w-0 flex-row items-center gap-2.5'>
                    <span className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                        <User aria-hidden='true' className='size-4' />
                    </span>
                    <CardTitle className='text-base'>Контакты</CardTitle>
                </CardHeader>
                <CardContent className='flex min-w-0 flex-col gap-4'>
                    <FormField error={errors.name} id='checkout-name' label='Имя'>
                        <Input
                            autoComplete='name'
                            onChange={(event) => onDraftChange({ name: event.target.value })}
                            value={draft.name}
                        />
                    </FormField>
                    <FormField error={errors.email} id='checkout-email' label='Email'>
                        <Input
                            autoComplete='email'
                            onChange={(event) => onDraftChange({ email: event.target.value })}
                            type='email'
                            value={draft.email}
                        />
                    </FormField>
                    <FormField error={errors.phone} id='checkout-phone' label='Телефон'>
                        <Input
                            autoComplete='tel'
                            onChange={(event) => onDraftChange({ phone: event.target.value })}
                            placeholder='+79990000000'
                            type='tel'
                            value={draft.phone}
                        />
                    </FormField>
                </CardContent>
            </Card>

            <Card className='min-w-0'>
                <CardHeader className='flex min-w-0 flex-row items-center gap-2.5'>
                    <span className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                        <Truck aria-hidden='true' className='size-4' />
                    </span>
                    <CardTitle className='text-base'>Доставка</CardTitle>
                </CardHeader>
                <CardContent className='flex min-w-0 flex-col gap-4'>
                    <OptionRadioGroup
                        legend='Способ доставки'
                        name='delivery'
                        onChange={(id) => onDraftChange({ deliveryMethod: id })}
                        options={options.deliveryMethods.map((item) => ({ id: item.id, title: item.title }))}
                        value={draft.deliveryMethod}
                    />
                    <DeliveryFields
                        errors={errors}
                        method={draft.deliveryMethod}
                        onChange={(patch) => onDraftChange(patch)}
                        pickupPoints={pickupPoints}
                        values={{
                            pickupPointId: draft.pickupPointId,
                            city: draft.city,
                            street: draft.street,
                            house: draft.house,
                            apartment: draft.apartment,
                        }}
                    />
                </CardContent>
            </Card>

            <Card className='min-w-0'>
                <CardHeader className='flex min-w-0 flex-row items-center gap-2.5'>
                    <span className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                        <Wallet aria-hidden='true' className='size-4' />
                    </span>
                    <CardTitle className='text-base'>Оплата</CardTitle>
                </CardHeader>
                <CardContent className='flex min-w-0 flex-col gap-4'>
                    <OptionRadioGroup
                        legend='Способ оплаты'
                        name='payment'
                        onChange={(id) => onDraftChange({ paymentMethod: id })}
                        options={options.paymentMethods.map((item) => ({ id: item.id, title: item.title }))}
                        value={draft.paymentMethod}
                    />
                </CardContent>
            </Card>

            <Button className='w-full sm:w-auto sm:self-start' disabled={isPending} size='lg' type='submit'>
                {submitLabel}
            </Button>
        </form>
    )
}
