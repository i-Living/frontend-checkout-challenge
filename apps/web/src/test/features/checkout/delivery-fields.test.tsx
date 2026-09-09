import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DeliveryFields } from '@/features/checkout/delivery-fields'
import { makeCheckoutOptions } from '@/test/fixtures'

const pickupPoints = makeCheckoutOptions().deliveryMethods[0].pickupPoints ?? []

describe('DeliveryFields', () => {
    it('показывает адрес курьера с подписями', () => {
        render(
            <DeliveryFields
                errors={{ city: 'Укажите город' }}
                method='courier'
                onChange={() => {}}
                pickupPoints={pickupPoints}
                values={{ pickupPointId: '', city: '', street: '', house: '', apartment: '' }}
            />,
        )
        expect(screen.getByLabelText('Город')).toHaveAccessibleDescription('Укажите город')
        expect(screen.getByLabelText('Улица')).toBeInTheDocument()
        expect(screen.getByLabelText('Дом')).toBeInTheDocument()
        expect(screen.getByLabelText('Квартира')).toBeInTheDocument()
        expect(screen.queryByLabelText('Пункт выдачи')).not.toBeInTheDocument()
    })

    it('показывает пункты самовывоза из API', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(
            <DeliveryFields
                errors={{}}
                method='pickup'
                onChange={onChange}
                pickupPoints={pickupPoints}
                values={{ pickupPointId: '', city: '', street: '', house: '', apartment: '' }}
            />,
        )
        expect(screen.getByRole('option', { name: 'Центр — Учебная, 1' })).toBeInTheDocument()
        await user.selectOptions(screen.getByLabelText('Пункт выдачи'), 'point-north')
        expect(onChange).toHaveBeenCalledWith({ pickupPointId: 'point-north' })
    })
})
