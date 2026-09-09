/**
 * Переключатель темы оформления в шапке приложения.
 */
import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/shared/store/theme-store'
import { Button } from '@/shared/ui/button'

/**
 * Кнопка-тоггл светлой/тёмной темы с иконкой текущего состояния.
 * Доступна с клавиатуры, состояние озвучено через aria-label и aria-pressed.
 * @returns Кнопка переключения темы.
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
