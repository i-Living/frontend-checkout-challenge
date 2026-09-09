import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CheckoutForm } from '@/features/checkout/checkout-form'
import { makeCheckoutOptions, validPickupDraft } from '@/test/fixtures'

const options = makeCheckoutOptions()

describe('CheckoutForm', () => {
    it('связывает подписи с полями и показывает ошибки у полей', () => {
        render(
            <CheckoutForm
                draft={validPickupDraft}
                errors={{ name: 'Укажите имя', email: 'Укажите корректный email' }}
                isPending={false}
                onDraftChange={() => {}}
                onSubmit={() => {}}
                options={options}
                submitLabel='Оформить'
            />,
        )
        expect(screen.getByLabelText('Имя')).toHaveAttribute('aria-invalid', 'true')
        expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
        expect(screen.getByLabelText('Телефон')).toHaveAttribute('aria-invalid', 'false')
        expect(screen.getByText('Укажите имя')).toHaveAttribute('role', 'alert')
        expect(document.getElementById('checkout-name-error')).toHaveTextContent('Укажите имя')
        expect(screen.getByLabelText('Имя')).toHaveAccessibleDescription('Укажите имя')
    })

    it('отправляет текущий черновик и блокирует кнопку на время запроса', async () => {
        const user = userEvent.setup()
        const onSubmit = vi.fn()
        const onDraftChange = vi.fn()
        const { rerender } = render(
            <CheckoutForm
                draft={validPickupDraft}
                errors={{}}
                isPending={false}
                onDraftChange={onDraftChange}
                onSubmit={onSubmit}
                options={options}
                submitLabel='Оформить и перейти к оплате'
            />,
        )
        await user.type(screen.getByLabelText('Имя'), 'а')
        expect(onDraftChange).toHaveBeenCalled()
        await user.click(screen.getByRole('button', { name: 'Оформить и перейти к оплате' }))
        expect(onSubmit).toHaveBeenCalledWith(validPickupDraft)
        rerender(
            <CheckoutForm
                draft={validPickupDraft}
                errors={{}}
                isPending
                onDraftChange={onDraftChange}
                onSubmit={onSubmit}
                options={options}
                submitLabel='Оформить и перейти к оплате'
            />,
        )
        expect(screen.getByRole('button', { name: 'Оформить и перейти к оплате' })).toBeDisabled()
    })

    it('даёт выбрать оба способа доставки и оплаты с клавиатуры', async () => {
        const user = userEvent.setup()
        const onDraftChange = vi.fn()
        render(
            <CheckoutForm
                draft={validPickupDraft}
                errors={{}}
                isPending={false}
                onDraftChange={onDraftChange}
                onSubmit={() => {}}
                options={options}
                submitLabel='Оформить'
            />,
        )
        await user.click(screen.getByLabelText('Курьер'))
        expect(onDraftChange).toHaveBeenCalledWith({ deliveryMethod: 'courier' })
        await user.click(screen.getByLabelText('Наличными при получении'))
        expect(onDraftChange).toHaveBeenCalledWith({ paymentMethod: 'cash_on_delivery' })
    })
})
