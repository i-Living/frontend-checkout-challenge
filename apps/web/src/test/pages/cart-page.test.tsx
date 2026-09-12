import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routes } from '@/app/routes'
import { CartPage } from '@/pages/cart-page'
import { getCart, listProducts, removeCartItem, setCartItem } from '@/shared/api/endpoints'
import { formatMoney } from '@/shared/lib/money'
import { byNormalizedText, makeApiError, makeCart, makeProduct } from '@/test/fixtures'
import { renderApp } from '@/test/render'

vi.mock('@/shared/api/endpoints', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/api/endpoints')>()
    return {
        ...actual,
        getCart: vi.fn(),
        listProducts: vi.fn(),
        setCartItem: vi.fn(),
        removeCartItem: vi.fn(),
    }
})

const getCartMock = vi.mocked(getCart)
const listProductsMock = vi.mocked(listProducts)
const setCartItemMock = vi.mocked(setCartItem)
const removeCartItemMock = vi.mocked(removeCartItem)

describe('CartPage', () => {
    beforeEach(() => {
        listProductsMock.mockResolvedValue([makeProduct()])
        setCartItemMock.mockResolvedValue(makeCart().items[0])
        removeCartItemMock.mockResolvedValue(undefined)
    })

    it('не даёт оформить пустую корзину', async () => {
        getCartMock.mockResolvedValue(makeCart({ items: [], quantity: 0, subtotal: 0 }))
        renderApp(<CartPage />)
        expect(await screen.findByText('Корзина пуста')).toBeInTheDocument()
        expect(screen.queryByRole('link', { name: /Перейти к оформлению/ })).not.toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Вернуться в каталог' })).toHaveAttribute('href', routes.catalog)
    })

    it('меняет количество абсолютным PUT и показывает итог из API', async () => {
        const user = userEvent.setup()
        getCartMock.mockResolvedValue(makeCart())
        renderApp(<CartPage />)
        expect(await screen.findByText('Лампа Orbit')).toBeInTheDocument()
        expect(screen.getAllByText(byNormalizedText(formatMoney(249000))).length).toBeGreaterThan(0)
        expect(screen.getByRole('link', { name: /Перейти к оформлению/ })).toHaveAttribute('href', routes.checkout)
        await user.click(screen.getByRole('button', { name: 'Увеличить количество' }))
        await waitFor(() => expect(setCartItemMock).toHaveBeenCalledWith('lamp-orbit', 2))
        await user.click(screen.getByRole('button', { name: 'Удалить' }))
        await waitFor(() => expect(removeCartItemMock).toHaveBeenCalledWith('lamp-orbit'))
    })

    it('показывает ошибку остатка и оставляет корзину', async () => {
        const user = userEvent.setup()
        getCartMock.mockResolvedValue(makeCart())
        setCartItemMock.mockRejectedValue(
            makeApiError({ code: 'INSUFFICIENT_STOCK', message: 'Доступно не более 10 шт.', status: 409 }),
        )
        renderApp(<CartPage />)
        expect(await screen.findByText('Лампа Orbit')).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Увеличить количество' }))
        expect(await screen.findByText('Не удалось обновить корзину')).toBeInTheDocument()
        expect(screen.getByText('Доступно не более 10 шт.')).toBeInTheDocument()
        expect(screen.getByText('Лампа Orbit')).toBeInTheDocument()
    })
})
