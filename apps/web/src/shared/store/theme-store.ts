/**
 * Хранилище темы оформления: светлая/тёмная, выбор пользователя в localStorage.
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/** Доступные темы оформления. */
export type Theme = 'light' | 'dark'

/** Ключ persisted-состояния темы в localStorage. */
export const THEME_STORAGE_KEY = 'checkout.theme'

/**
 * Системная тема из prefers-color-scheme (дефолт до первого выбора).
 * @returns 'dark', если система тёмная, иначе 'light'.
 */
function systemTheme(): Theme {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
}

/**
 * Применяет тему к документу через класс dark на html.
 * @param theme Тема для применения.
 */
function applyTheme(theme: Theme): void {
    document.documentElement.classList.toggle('dark', theme === 'dark')
}

/** Состояние стора темы. */
interface ThemeState {
    /** Текущая тема. */
    theme: Theme
    /** Переключает тему и применяет её к документу. */
    toggle: () => void
}

/** Стор темы с персистом выбора в localStorage. */
export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: systemTheme(),
            toggle: () => {
                const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
                applyTheme(next)
                set({ theme: next })
            },
        }),
        { name: THEME_STORAGE_KEY, storage: createJSONStorage(() => localStorage) },
    ),
)

/**
 * Применяет сохранённую тему до первого рендера, чтобы не мигало.
 */
export function initTheme(): void {
    applyTheme(useThemeStore.getState().theme)
}
