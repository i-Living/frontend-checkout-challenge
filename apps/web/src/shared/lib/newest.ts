export function newestByCreatedAt<T extends { createdAt: string }>(items: T[]) {
    return items.reduce<T | undefined>((best, item) => {
        if (!best || item.createdAt > best.createdAt) {
            return item
        }
        return best
    }, undefined)
}
