/**
 * Узкое место queryFn: `enabled: Boolean(id)` не сужает тип, TypeScript всё ещё видит `string | undefined`.
 * @param value id из маршрута или стора; пустая строка тоже считается отсутствием.
 * @param name Имя поля в тексте ошибки (для логов, не для UI).
 * @returns То же значение, уже как `string`.
 * @throws Error если value пустое — значит, query ушёл при выключенном enabled (гонка).
 */
export function orThrow(value: string | undefined, name: string): string {
    if (!value) {
        throw new Error(`${name} is required`)
    }
    return value
}
