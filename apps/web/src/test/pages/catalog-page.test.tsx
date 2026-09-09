import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CatalogPage } from '@/pages/catalog-page'
import { getCart, listProducts, setCartItem } from '@/shared/api/endpoints'
import { makeApiError, makeCart, makeProduct } from '@/test/fixtures'
import { renderApp } from '@/test/render'

vi.mock('@/shared/api/endpoints', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/api/endpoints')>()
    return {
        ...actual,
        listProducts: vi.fn(),
        getCart: vi.fn(),
        setCartItem: vi.fn(),
        removeCartItem: vi.fn(),
    }
})

const listProductsMock = vi.mocked(listProducts)
const getCartMock = vi.mocked(getCart)
const setCartItemMock = vi.mocked(setCartItem)

describe('CatalogPage', () => {
    beforeEach(() => {
        listProductsMock.mockResolvedValue([
            makeProduct(),
            makeProduct({ id: 'clock-dot', sku: 'CLOCK', title: 'Часы Dot', stock: 0, price: 329000 }),
        ])
        getCartMock.mockResolvedValue(makeCart({ items: [], quantity: 0, subtotal: 0 }))
        setCartItemMock.mockResolvedValue(makeCart().items[0])
    })

    it('загружает каталог из API и добавляет доступный товар абсолютным количеством', async () => {
        const user = userEvent.setup()
        renderApp(<CatalogPage />)
        expect(await screen.findByText('Лампа Orbit')).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'В корзину' }))
        await waitFor(() => expect(setCartItemMock).toHaveBeenCalledWith('lamp-orbit', 1))
    })

    it('не даёт добавить товар без остатка', async () => {
        renderApp(<CatalogPage />)
        expect(await screen.findByRole('button', { name: 'Нет в наличии' })).toBeDisabled()
        expect(setCartItemMock).not.toHaveBeenCalled()
    })

    it('показывает ошибку загрузки и повтор', async () => {
        const user = userEvent.setup()
        listProductsMock.mockRejectedValueOnce(makeApiError({ message: 'Сеть недоступна' }))
        listProductsMock.mockResolvedValueOnce([makeProduct()])
        renderApp(<CatalogPage />)
        expect(await screen.findByText('Не удалось загрузить каталог')).toBeInTheDocument()
        expect(screen.getByText('Сеть недоступна')).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Повторить' }))
        expect(await screen.findByText('Лампа Orbit')).toBeInTheDocument()
    })
})
