import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CartLine } from '@/features/cart/cart-line'
import { formatMoney } from '@/shared/lib/money'
import { byNormalizedText, makeCart } from '@/test/fixtures'

const item = makeCart().items[0]

describe('CartLine', () => {
    it('показывает название, цену из API и шлёт абсолютное количество', async () => {
        const user = userEvent.setup()
        const onQuantity = vi.fn()
        const onRemove = vi.fn()
        render(<CartLine isPending={false} item={item} onQuantity={onQuantity} onRemove={onRemove} stock={10} />)
        expect(screen.getByText('Лампа Orbit')).toBeInTheDocument()
        expect(screen.getByText(byNormalizedText(`${formatMoney(249000)} / шт.`))).toBeInTheDocument()
        expect(screen.getAllByText(byNormalizedText(formatMoney(249000))).length).toBeGreaterThan(0)
        await user.click(screen.getByRole('button', { name: 'Увеличить количество' }))
        expect(onQuantity).toHaveBeenCalledWith(2)
        await user.click(screen.getByRole('button', { name: 'Удалить' }))
        expect(onRemove).toHaveBeenCalledTimes(1)
    })

    it('не даёт увеличить количество сверх остатка', () => {
        render(
            <CartLine
                isPending={false}
                item={{ ...item, quantity: 10 }}
                onQuantity={() => {}}
                onRemove={() => {}}
                stock={10}
            />,
        )
        expect(screen.getByRole('button', { name: 'Увеличить количество' })).toBeDisabled()
        expect(screen.getByRole('button', { name: 'Уменьшить количество' })).toBeEnabled()
    })
})
