/**
 * Проверяет обязательное строковое значение (например id из useParams после enabled).
 * @param value Значение для проверки.
 * @param name Имя значения для текста ошибки.
 * @returns То же значение, если оно непустое.
 * @throws Error если значение пустое.
 */
export function orThrow(value: string | undefined, name: string): string {
    if (!value) {
        throw new Error(`${name} is required`)
    }
    return value
}
