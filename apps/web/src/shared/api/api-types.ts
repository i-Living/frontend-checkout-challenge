/**
 * Типы OpenAPI. Импортировать отсюда, не из generated.d.ts — тот файл перезаписывает
 * `npm run generate:api-types` и руками не редактируется.
 */
/** Реэкспорт сгенерированных paths/operations: ручные DTO ответов API не заводим. */
export type { $defs, components, operations, paths, webhooks } from './generated'
