import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CardPicker } from '@/features/payment/card-picker'
import { sandbox } from '@/test/fixtures'

describe('CardPicker', () => {
    it('показывает название и маску из API, без PAN/CVC', async () => {
        const user = userEvent.setup()
        const onSelect = vi.fn()
        render(<CardPicker cards={sandbox.cards} onSelect={onSelect} selectedId='card-success' />)
        expect(screen.getByText('Тестовая карта: успешная оплата')).toBeInTheDocument()
        expect(screen.getByText('•••• 4242')).toBeInTheDocument()
        expect(screen.getByText('Тестовая карта: отказ банка')).toBeInTheDocument()
        expect(screen.getByText('•••• 0002')).toBeInTheDocument()
        expect(screen.queryByLabelText(/cvc/i)).not.toBeInTheDocument()
        expect(screen.queryByPlaceholderText(/номер карты/i)).not.toBeInTheDocument()
        await user.click(screen.getByText('Тестовая карта: отказ банка'))
        expect(onSelect).toHaveBeenCalledWith('card-decline')
    })
})
