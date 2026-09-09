import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { Providers } from './app/providers'
import { router } from './app/router'
import './app/styles.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
    throw new Error('Не найден элемент #root')
}

createRoot(rootElement).render(
    <StrictMode>
        <Providers>
            <RouterProvider router={router} />
        </Providers>
    </StrictMode>,
)
