/**
 * Тема оформления. Выбор в localStorage (в отличие от сессии — переживает вкладку).
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/** Светлая или тёмная; системного «auto» после первого выбора нет — toggle бинарный. */
export type Theme = 'light' | 'dark'

/** Отдельный ключ от checkout.v1, чтобы сброс сессии не сбрасывал тему. */
export const THEME_STORAGE_KEY = 'checkout.theme'

/**
 * Тема ОС до первого выбора пользователя. Без window (SSR/тесты) — light.
 * @returns 'dark' при prefers-color-scheme: dark.
 */
function systemTheme(): Theme {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
}

/**
 * Класс `dark` на <html> — так работает Tailwind v4. Не на body.
 * @param theme Тема для применения.
 */
function applyTheme(theme: Theme): void {
    document.documentElement.classList.toggle('dark', theme === 'dark')
}

/** Состояние стора темы. */
interface ThemeState {
    /** Текущая тема, уже применённая к документу. */
    theme: Theme
    /** Переключает тему и сразу пишет класс на html, не дожидаясь рендера. */
    toggle: () => void
}

/** persist в localStorage: тема не привязана к гостевой сессии магазина. */
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
 * До createRoot, иначе первый кадр вспыхнет системной/светлой темой.
 */
export function initTheme(): void {
    applyTheme(useThemeStore.getState().theme)
}
