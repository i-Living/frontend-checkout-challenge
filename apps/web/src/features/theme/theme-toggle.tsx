/**
 * Тоггл темы в шапке. Состояние в localStorage, не в session-store — тема не привязана к корзине.
 */
import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/shared/store/theme-store'
import { Button } from '@/shared/ui/button'

/**
 * aria-pressed = тёмная тема сейчас. Иконка — противоположное действие (луна → «включить тёмную»).
 * @returns Кнопка size=icon, 44px по минимуму кнопки.
 */
export function ThemeToggle() {
    const theme = useThemeStore((state) => state.theme)
    const toggle = useThemeStore((state) => state.toggle)
    const isDark = theme === 'dark'
    return (
        <Button
            aria-label={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
            aria-pressed={isDark}
            onClick={toggle}
            size='icon'
            title={isDark ? 'Светлая тема' : 'Тёмная тема'}
            type='button'
            variant='ghost'
        >
            {isDark ? <Sun aria-hidden='true' /> : <Moon aria-hidden='true' />}
        </Button>
    )
}
