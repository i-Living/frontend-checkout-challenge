/**
 * Точка входа. initTheme() до render — иначе первый кадр вспыхнет светлой темой.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { Providers } from '@/app/providers'
import { router } from '@/app/router'
import '@/app/styles.css'
import { initTheme } from '@/shared/store/theme-store'

initTheme()

const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('Корневой элемент #root не найден')
}

createRoot(rootElement).render(
    <StrictMode>
        <Providers>
            <RouterProvider router={router} />
        </Providers>
    </StrictMode>,
)
