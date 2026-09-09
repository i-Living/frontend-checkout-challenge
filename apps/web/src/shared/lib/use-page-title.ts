/**
 * Устанавливает document.title страницы в формате «Заголовок — Магазин».
 */
import { useEffect } from 'react'

/**
 * Пишет заголовок вкладки.
 * @param title Человекочитаемое имя экрана без суффикса магазина.
 */
export function usePageTitle(title: string): void {
    useEffect(() => {
        document.title = `${title} — Магазин`
    }, [title])
}
