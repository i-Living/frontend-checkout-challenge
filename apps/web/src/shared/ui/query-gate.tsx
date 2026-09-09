/**
 * Гвард загрузки/ошибки: страницы рендерят happy-path только если queryGate вернул null.
 */
import type { ReactNode } from 'react'
import { PageError, PagePending } from '@/shared/ui/query-state'

/** Минимальный контракт результата useQuery, нужный для экрана состояния. */
export interface QueryLike {
    isPending: boolean
    isError: boolean
    error: unknown
    refetch: () => unknown
}

/** Параметры общего экрана загрузки/ошибки. */
export interface QueryStateOptions {
    title: string
    errorTitle: string
    skeleton: ReactNode
    notFoundTitle?: string
    notFoundDescription?: string
}

/**
 * Если запросы ещё грузятся или упали — возвращает экран состояния, иначе null.
 * Дети страницы рендерятся только после этого гварда, без eager-оценки happy-path.
 * @param queries Один или несколько результатов useQuery.
 * @param options Заголовок, скелетон и тексты ошибки.
 */
export function queryGate(queries: QueryLike | QueryLike[], options: QueryStateOptions): ReactNode | null {
    const list = Array.isArray(queries) ? queries : [queries]
    if (list.some((item) => item.isPending)) {
        return <PagePending skeleton={options.skeleton} title={options.title} />
    }
    const failed = list.filter((item) => item.isError)
    if (failed.length === 0) {
        return null
    }
    return (
        <PageError
            error={failed[0].error}
            errorTitle={options.errorTitle}
            notFoundDescription={options.notFoundDescription}
            notFoundTitle={options.notFoundTitle}
            onRetry={() => {
                for (const item of failed) {
                    void item.refetch()
                }
            }}
            title={options.title}
        />
    )
}
