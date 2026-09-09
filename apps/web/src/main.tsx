/**
 * Точка входа SPA: монтирует React-дерево с провайдерами и роутером в элемент #root.
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
