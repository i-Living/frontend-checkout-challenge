/**
 * Гвард загрузки/ошибки. Happy-path страницы вызывать только если вернул null —
 * иначе во время pending полезем в data и словим undefined.
 */
import type { ReactNode } from 'react'
import { PageError, PagePending } from '@/shared/ui/query-state'

/** Достаточно isPending/isError/error/refetch — полный UseQueryResult тащить не нужно. */
export interface QueryLike {
    isPending: boolean
    isError: boolean
    error: unknown
    refetch: () => unknown
}

/** Тексты и скелетон экрана. notFound* включают ветку 404 вместо «повторить». */
export interface QueryStateOptions {
    title: string
    errorTitle: string
    skeleton: ReactNode
    notFoundTitle?: string
    notFoundDescription?: string
}

/**
 * pending любого запроса → скелетон; иначе первая ошибка → PageError с повтором всех упавших.
 * @param queries Один запрос или список (корзина+опции на чекауте).
 * @param options Заголовок страницы, скелетон, тексты ошибки; notFoundTitle включает ветку 404.
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
