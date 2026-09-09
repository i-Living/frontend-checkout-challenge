/**
 * Форма оформления заказа: контакты, способ доставки и способ оплаты.
 */

import { Truck, User, Wallet } from 'lucide-react'
import type { FormEvent } from 'react'
import type { CheckoutOptions } from '@/shared/api/endpoints'
import type { CheckoutDraft } from '@/shared/store/session-store'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { DeliveryFields } from './delivery-fields'

/**
 * Ошибки полей формы оформления заказа.
 */
export type CheckoutFieldErrors = Partial<
    Record<'name' | 'email' | 'phone' | 'pickupPointId' | 'city' | 'street' | 'house', string>
>

/**
 * Пропсы формы оформления заказа.
 * @property draft черновик данных покупателя и доставки
 * @property errors ошибки валидации по полям
 * @property options доступные способы доставки и оплаты
 * @property isPending блокировка отправки на время запроса
 * @property submitLabel текст кнопки отправки
 * @property onDraftChange обработчик изменения черновика
 * @property onSubmit обработчик отправки формы
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
 * @param draft черновик данных покупателя и доставки
 * @param errors ошибки валидации по полям
 * @param options доступные способы доставки и оплаты
 * @param isPending блокировка отправки на время запроса
 * @param submitLabel текст кнопки отправки
 * @param onDraftChange обработчик изменения черновика
 * @param onSubmit обработчик отправки формы
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
                    <div className='flex min-w-0 flex-col gap-1.5'>
                        <Label htmlFor='checkout-name'>Имя</Label>
                        <Input
                            aria-describedby={errors.name ? 'checkout-name-error' : undefined}
                            aria-invalid={Boolean(errors.name)}
                            autoComplete='name'
                            id='checkout-name'
                            onChange={(event) => onDraftChange({ name: event.target.value })}
                            value={draft.name}
                        />
                        {errors.name ? (
                            <p className='text-destructive text-sm' id='checkout-name-error' role='alert'>
                                {errors.name}
                            </p>
                        ) : null}
                    </div>
                    <div className='flex min-w-0 flex-col gap-1.5'>
                        <Label htmlFor='checkout-email'>Email</Label>
                        <Input
                            aria-describedby={errors.email ? 'checkout-email-error' : undefined}
                            aria-invalid={Boolean(errors.email)}
                            autoComplete='email'
                            id='checkout-email'
                            onChange={(event) => onDraftChange({ email: event.target.value })}
                            type='email'
                            value={draft.email}
                        />
                        {errors.email ? (
                            <p className='text-destructive text-sm' id='checkout-email-error' role='alert'>
                                {errors.email}
                            </p>
                        ) : null}
                    </div>
                    <div className='flex min-w-0 flex-col gap-1.5'>
                        <Label htmlFor='checkout-phone'>Телефон</Label>
                        <Input
                            aria-describedby={errors.phone ? 'checkout-phone-error' : undefined}
                            aria-invalid={Boolean(errors.phone)}
                            autoComplete='tel'
                            id='checkout-phone'
                            onChange={(event) => onDraftChange({ phone: event.target.value })}
                            placeholder='+79990000000'
                            type='tel'
                            value={draft.phone}
                        />
                        {errors.phone ? (
                            <p className='text-destructive text-sm' id='checkout-phone-error' role='alert'>
                                {errors.phone}
                            </p>
                        ) : null}
                    </div>
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
                    <fieldset className='flex min-w-0 flex-col gap-2'>
                        <legend className='mb-1 font-medium text-sm'>Способ доставки</legend>
                        {options.deliveryMethods.map((item) => {
                            const id = `delivery-${item.id}`
                            return (
                                <label
                                    className='flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors has-checked:border-primary/60 has-checked:bg-primary/5'
                                    htmlFor={id}
                                    key={item.id}
                                >
                                    <input
                                        checked={draft.deliveryMethod === item.id}
                                        className='size-4 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                                        id={id}
                                        name='deliveryMethod'
                                        onChange={() => onDraftChange({ deliveryMethod: item.id })}
                                        type='radio'
                                        value={item.id}
                                    />
                                    <span className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                                        {item.title}
                                    </span>
                                </label>
                            )
                        })}
                    </fieldset>

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
                    <fieldset className='flex min-w-0 flex-col gap-2'>
                        <legend className='mb-1 font-medium text-sm'>Способ оплаты</legend>
                        {options.paymentMethods.map((item) => {
                            const id = `payment-${item.id}`
                            return (
                                <label
                                    className='flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors has-checked:border-primary/60 has-checked:bg-primary/5'
                                    htmlFor={id}
                                    key={item.id}
                                >
                                    <input
                                        checked={draft.paymentMethod === item.id}
                                        className='size-4 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                                        id={id}
                                        name='paymentMethod'
                                        onChange={() => onDraftChange({ paymentMethod: item.id })}
                                        type='radio'
                                        value={item.id}
                                    />
                                    <span className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
                                        {item.title}
                                    </span>
                                </label>
                            )
                        })}
                    </fieldset>
                </CardContent>
            </Card>

            <Button className='w-full sm:w-auto sm:self-start' disabled={isPending} size='lg' type='submit'>
                {submitLabel}
            </Button>
        </form>
    )
}
