/**
 * Заголовок вкладки. Суффикс « — Магазин» общий, чтобы страницы не копировали его.
 */
import { useEffect } from 'react'

/**
 * Пишет `document.title` на маунте и при смене экрана.
 * @param title Имя экрана без суффикса («Корзина», не «Корзина — Магазин»).
 */
export function usePageTitle(title: string): void {
    useEffect(() => {
        document.title = `${title} — Магазин`
    }, [title])
}
