import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProductCard } from '@/features/catalog/product-card'
import { makeProduct } from '@/test/fixtures'

describe('ProductCard', () => {
    it('добавляет доступный товар в корзину', async () => {
        const user = userEvent.setup()
        const onAdd = vi.fn()
        render(
            <ProductCard
                isPending={false}
                onAdd={onAdd}
                onQuantity={() => {}}
                onRemove={() => {}}
                product={makeProduct()}
                quantityInCart={0}
            />,
        )
        await user.click(screen.getByRole('button', { name: 'В корзину' }))
        expect(onAdd).toHaveBeenCalledTimes(1)
        expect(screen.getByText('Осталось: 10 шт.')).toBeInTheDocument()
    })

    it('блокирует товар с нулевым остатком', () => {
        render(
            <ProductCard
                isPending={false}
                onAdd={() => {}}
                onQuantity={() => {}}
                onRemove={() => {}}
                product={makeProduct({ id: 'clock-dot', title: 'Часы Dot', stock: 0 })}
                quantityInCart={0}
            />,
        )
        expect(screen.getByRole('button', { name: 'Нет в наличии' })).toBeDisabled()
        expect(screen.getAllByText('Нет в наличии')).toHaveLength(1)
        expect(screen.queryByText(/Осталось/)).not.toBeInTheDocument()
    })

    it('ставит абсолютное количество через степпер, не инкремент API', async () => {
        const user = userEvent.setup()
        const onQuantity = vi.fn()
        render(
            <ProductCard
                isPending={false}
                onAdd={() => {}}
                onQuantity={onQuantity}
                onRemove={() => {}}
                product={makeProduct()}
                quantityInCart={2}
            />,
        )
        await user.click(screen.getByRole('button', { name: 'Увеличить количество «Лампа Orbit»' }))
        expect(onQuantity).toHaveBeenCalledWith(3)
        await user.click(screen.getByRole('button', { name: 'Уменьшить количество «Лампа Orbit»' }))
        expect(onQuantity).toHaveBeenCalledWith(1)
    })
})
