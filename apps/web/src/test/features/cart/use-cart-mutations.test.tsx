import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRemoveCartItem, useSetCartItem } from '@/features/cart/use-cart-mutations'
import { removeCartItem, setCartItem } from '@/shared/api/endpoints'
import { keys } from '@/shared/api/query-keys'
import { makeApiError, makeCart } from '@/test/fixtures'
import { createTestQueryClient } from '@/test/render'

vi.mock('@/shared/api/endpoints', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/shared/api/endpoints')>()
    return { ...actual, setCartItem: vi.fn(), removeCartItem: vi.fn() }
})

const setCartItemMock = vi.mocked(setCartItem)
const removeCartItemMock = vi.mocked(removeCartItem)

describe('use-cart-mutations', () => {
    beforeEach(() => {
        setCartItemMock.mockReset()
        removeCartItemMock.mockReset()
    })

    it('после успеха и INSUFFICIENT_STOCK сбрасывает и корзину, и каталог', async () => {
        const queryClient = createTestQueryClient()
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
        function Wrapper({ children }: { children: ReactNode }) {
            return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        }
        setCartItemMock.mockResolvedValueOnce(makeCart().items[0])
        const { result, rerender } = renderHook(() => useSetCartItem(), { wrapper: Wrapper })
        result.current.mutate({ productId: 'lamp-orbit', quantity: 2 })
        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(invalidate).toHaveBeenCalledWith({ queryKey: keys.cart })
        expect(invalidate).toHaveBeenCalledWith({ queryKey: keys.products })

        setCartItemMock.mockRejectedValueOnce(
            makeApiError({ code: 'INSUFFICIENT_STOCK', message: 'Доступно не более 10 шт.', status: 409 }),
        )
        rerender()
        result.current.mutate({ productId: 'lamp-orbit', quantity: 99 })
        await waitFor(() => expect(result.current.isError).toBe(true))
        expect(invalidate).toHaveBeenCalledWith({ queryKey: keys.cart })
        expect(invalidate).toHaveBeenCalledWith({ queryKey: keys.products })
    })

    it('при CART_ITEM_NOT_FOUND сбрасывает только корзину', async () => {
        const queryClient = createTestQueryClient()
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
        function Wrapper({ children }: { children: ReactNode }) {
            return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        }
        removeCartItemMock.mockRejectedValue(
            makeApiError({ code: 'CART_ITEM_NOT_FOUND', message: 'нет позиции', status: 404 }),
        )
        const { result } = renderHook(() => useRemoveCartItem(), { wrapper: Wrapper })
        result.current.mutate('lamp-orbit')
        await waitFor(() => expect(result.current.isError).toBe(true))
        expect(invalidate).toHaveBeenCalledWith({ queryKey: keys.cart })
        expect(invalidate).not.toHaveBeenCalledWith({ queryKey: keys.products })
    })
})
