# Аудит фронтенда `@checkout/web`

Дата: 2026-09-09  
Объект: `apps/web` (React + Vite)  
Критерии: `docs/ASSIGNMENT.md`, `docs/INTEGRATION.md`, `docs/EVALUATION.md`  
Фокус: соответствие требованиям и максимальная обобщённость (DRY). Ошибки не должны обрабатываться в каждом вызове, fetch не должен быть разным в каждом компоненте.

---

## Итог

Функционально решение закрывает основной сценарий, устойчивость и интерфейс. HTTP-слой централизован: один `fetch` в `apps/web/src/shared/api/client.ts`, страницы его не вызывают. Это плюс для пункта D2.

Слабое место — не HTTP, а всё вокруг него. Перевод ошибок, обвязка `useQuery` / `useMutation`, loading/error UI и правила корзины повторяются по страницам и уже разошлись. README утверждает, что `errors.ts` переводит коды в понятный вид — сейчас файл этого не делает.

Ориентир по шкале задания: **~82–88 / 100**. Потеря баллов почти наверняка на **D1** (расходящиеся копии одного правила) и частично на **D2** («перевод ошибки можно менять без обхода всех страниц» — сейчас нельзя).

---

## Оценка по EVALUATION.md

| Блок | Пункты | Оценка | Комментарий |
| --- | --- | --- | --- |
| Основной сценарий | A1–A8 | 40/40 | Каталог → корзина → quote из API → заказ → poll → успех только по статусу заказа; cash без online-оплаты |
| Устойчивость | B1–B6 | 28–30/30 | Decline/cancel/retry, идемпотентность, F5, conflict quote, форма жива, poll стоп. Отмена уже ушедшей в банк попытки невозможна — ограничение API, честно описано в README |
| Интерфейс | C1–C3 | 15/15 | Loading / processing / error / success различимы; поля с label; 1280/390 учтены |
| Код | D1–D2 | 5–7 / 10 | HTTP централизован, но query/ошибки/мутации корзины копируются и расходятся |
| Запуск и описание | E1 | 5/5 | Запуск, путь D2, сценарии, недоработки, время |

---

## Что уже обобщено хорошо

Правильный каркас D2:

- Один `fetch` — `apps/web/src/shared/api/client.ts`. Страницы `fetch` не вызывают.
- Заголовки, JSON, `204`, маппинг в `ApiError` — там же.
- Эндпоинты — `apps/web/src/shared/api/endpoints.ts`, типы из OpenAPI (`generated.d.ts`), не руками.
- Сессия — `ensureSession` + retry 401 в `withAuth`.
- Ключи кэша — `query-keys.ts`, идемпотентность — `idempotency.ts`.
- Query vs Zustand: серверное состояние в TanStack Query, UI/черновик/токен в Zustand.

Новый HTTP-метод действительно добавляется без копирования `fetch`. Этого недостаточно для «самого обобщённого кода»: повторяется не транспорт, а обвязка запросов и ошибок в UI.

---

## Главные проблемы DRY

Именно то, что важно для оценки кода: ошибки не должны обрабатываться в каждом вызове, fetch не должен быть разным в каждом компоненте. Fetch уже один. Обработка ошибок и query-обвязка — нет.

### 1. Перевод ошибки скопирован по страницам (критично для D2)

README пишет, что `errors.ts` переводит код в понятный вид. Файл этого **не делает**: там только тип `ApiError` и `isApiError`.

Одна и та же формула живёт минимум в восьми местах:

```ts
isApiError(error) ? error.message : 'Попробуйте ещё раз.'
```

Локальные копии:

| Место | Как сделано |
| --- | --- |
| `pages/cart-page.tsx` | локальная `toMutationMessage` |
| `pages/payment-page.tsx` | локальная `toErrorMessage` |
| `pages/catalog-page.tsx` | inline, два раза |
| `pages/checkout-page.tsx` | inline |
| `pages/order-page.tsx` | inline |
| `features/checkout/checkout-rules.ts` | `toOrderErrorMessage` |

Сменить fallback или маппинг кодов = обойти все страницы. Это прямое попадание в формулировку D2: перевод ошибки в понятный вид можно менять по отдельности, без обхода всех страниц.

Нужно одно место:

```ts
// shared/api/errors.ts
export function toUserMessage(error: unknown, fallback = 'Попробуйте ещё раз.'): string
export function getErrorCode(error: unknown): string | null
```

Доменные тексты (`CART_VERSION_CONFLICT`, `QUOTE_EXPIRED`, `INSUFFICIENT_STOCK`) — таблица кодов, не `if` на каждой странице.

### 2. `useQuery` копируется вместо хуков (критично)

15 вызовов `useQuery`, кастомный хук один — `usePaymentPoll`. Нет `useCart`, `useProducts`, `useOrder`, `useCheckoutOptions`.

Один и тот же блок в `App.tsx`, catalog, cart, checkout:

```ts
useQuery({
    queryKey: keys.cart,
    queryFn: ({ signal }) => getCart(signal),
})
```

То же для `listProducts`, `getOrder`, `getCheckoutOptions`.

Страница не должна знать `queryKey` + `queryFn`. Должно быть:

```ts
const cart = useCart()
const products = useProducts()
```

Иначе «добавить запрос» = снова скопировать обвязку Query, даже если `fetch` общий.

Вызовы `useQuery` сейчас:

| Файл | Что грузит |
| --- | --- |
| `app/App.tsx` | cart |
| `pages/catalog-page.tsx` | products, cart |
| `pages/cart-page.tsx` | cart, products |
| `pages/checkout-page.tsx` | cart, checkoutOptions, quote |
| `pages/payment-page.tsx` | order, sandbox, payments, ordersList |
| `pages/order-page.tsx` | order |
| `features/payment/use-payment-poll.ts` | payment (poll) |
| `features/order/order-summary.tsx` | checkoutOptions |

### 3. Loading / error UI копируется на каждой странице

Повторяется один скелет:

```tsx
if (query.isPending) return <h1 /> + <Skeleton />
if (query.isError) return <Alert /> + <Button>Повторить</Button>
```

Это catalog, cart, checkout, payment (три раза: recovery / order / sandbox), order.

Нет общего `QueryState` / `PageStatus`:

```tsx
<QueryState
    query={productsQuery}
    title="Каталог"
    errorTitle="Не удалось загрузить каталог"
    skeleton={<CatalogSkeleton />}
>
    {(data) => ...}
</QueryState>
```

Retry, `toUserMessage`, `aria-busy` тогда живут в одном компоненте.

### 4. Мутации корзины разошлись — это уже баг D1

Одно правило «положить / убрать товар» написано дважды и **уже разъехалось**.

| Правило | Каталог | Корзина |
| --- | --- | --- |
| invalidate `products` после успеха | всегда | нет |
| `INSUFFICIENT_STOCK` | invalidate cart + products | invalidate cart + products |
| `CART_ITEM_NOT_FOUND` | не обработан | invalidate cart |

Две копии одного правила с разным поведением. Нужен один хук:

```ts
useSetCartItem()
useRemoveCartItem()
```

с единым `onSuccess` / `onError`.

### 5. `withAuth` / `withAuthMeta` — копия 401-retry

`endpoints.ts`: два почти одинаковых блока «получить токен → запрос → 401 → новая сессия → повтор». Достаточно одного `withAuth` поверх `requestWithMeta`, а вариант без meta — тонкая обёртка.

### 6. `payMutation` и `cancelMutation` — одна операция с разным scenario

`runAttempt` и `runCancel` отличаются только `scenario`. `onSuccess` / `onError` скопированы целиком (clear key, poll interval, invalidate payments). Одна мутация `runPaymentAttempt(scenario)`.

`payment-page.tsx` (~540 строк) — страница-оркестратор. Логику попытки стоит вынести в `usePaymentAttempt`.

### 7. Мелкие, но системные повторы

- Успех заказа: card и cash — две почти одинаковые карточки, отличается заголовок.
- Поля формы: name / email / phone / city / street / house — один паттерн Label + Input + error, семь копий. Нужен `FormField`.
- Сообщения валидации: одни и те же строки в `validateDraft` и `toServerFieldErrors`.
- Радиогруппы: checkout рисует `<input type="radio">` вручную, `CardPicker` использует `RadioGroup`.
- `document.title`: шесть одинаковых `useEffect`. Хватит `usePageTitle('Каталог')`.
- `getQuote` объявлен в `endpoints.ts` и нигде не вызывается.

---

## Соответствие пунктам D1 и D2

### D1 — компоненты и типы понятны, нет расходящихся копий правила

Слои разделены: API / Query / Zustand / страницы. Типы из OpenAPI. Это плюс.

Минус: правило корзины уже разошлось между catalog и cart. Маппинг ошибок заказа частично в `checkout-rules.ts`, частично inline на checkout-странице (quote error). Query-ключи и invalidate размазаны по страницам (~28 вызовов `invalidateQueries`).

Оценка: частичная.

### D2 — новый запрос без копирования настройки соединения

Плюс: базовый URL, `Authorization`, `Idempotency-Key`, JSON / `204`, выброс `ApiError` — одно место (`client.ts`). Страницы не копируют `fetch`. README указывает путь.

Минус: «перевод ошибки в понятный вид можно менять по отдельности» — нельзя. Менять тексты и fallback = правки в пяти страницах и одном feature-модуле. Добавить новый *запрос* без копирования HTTP — да; без копирования Query-обвязки и error UI — нет.

Оценка: частичная. HTTP-часть закрыта, UI-часть нет.

---

## Где обобщать в первую очередь

Порядок по влиянию на оценку DRY:

1. **`toUserMessage` + таблица кодов** в `errors.ts`. Убрать все `isApiError ? message : fallback` со страниц.
2. **Query-хуки:** `useCart`, `useProducts`, `useOrder`, `useCheckoutOptions`, `useSandbox`. Страницы перестают знать keys / fn.
3. **`useSetCartItem` / `useRemoveCartItem`.** Свести catalog и cart к одному правилу инвалидации.
4. **`QueryState`** (pending / error / retry). Страницы оставляют только happy-path.
5. Слить `withAuth` / `withAuthMeta`, слить pay / cancel, `FormField`, `usePageTitle`.

Целевой вид страницы каталога:

```tsx
export function CatalogPage() {
    usePageTitle('Каталог')
    const products = useProducts()
    const cart = useCart()
    const setItem = useSetCartItem()
    const remove = useRemoveCartItem()

    return (
        <QueryState query={products} title="Каталог" errorTitle="Не удалось загрузить каталог">
            {(list) => (
                <>
                    <MutationAlert error={setItem.error ?? remove.error} title="Не удалось обновить корзину" />
                    {list.map((product) => (
                        <ProductCard ... />
                    ))}
                </>
            )}
        </QueryState>
    )
}
```

Страница не парсит `ApiError`, не вызывает `fetch`, не знает `queryKey`, не рисует свой Alert + retry.

---

## Что не стоит трогать

- Не тащить `fetch` обратно в компоненты.
- Не плодить обёртки «на всякий случай»: хуки только для реально повторяющихся сущностей (cart, products, order, options).
- Не обобщать уникальный checkout (debounce адреса, quote-by-version, generation-guard оплаты) — это домен, не дубль.
- Не менять `apps/api` и `packages/contracts`.

---

## Замечание по документации D2

Корневой `README.md` утверждает:

> `errors.ts` (тип `ApiError`, перевод кодов в понятный вид)

Сейчас перевода нет. Либо сделать маппер, либо поправить README — иначе на ревью это сразу заметят.

---

## Карта файлов

```text
apps/web/src/
├── shared/api/
│   ├── client.ts          ✅ один fetch, заголовки, JSON/204, toApiError
│   ├── errors.ts          ⚠️ тип + isApiError, нет toUserMessage
│   ├── endpoints.ts       ✅ обёртки; ⚠️ withAuth скопирован в withAuthMeta; getQuote мёртвый
│   ├── session.ts         ✅
│   ├── idempotency.ts     ✅
│   └── query-keys.ts      ✅ ключи есть, хуков нет
├── pages/
│   ├── catalog-page.tsx   ⚠️ query + mutation + error UI локально
│   ├── cart-page.tsx      ⚠️ те же мутации, другое правило invalidate
│   ├── checkout-page.tsx  ⚠️ inline error mapping для quote
│   ├── payment-page.tsx   ⚠️ 540 строк, pay/cancel дубль
│   └── order-page.tsx     ⚠️ error UI + дубль success card
└── features/
    ├── payment/use-payment-poll.ts  ✅ единственный query-хук
    └── checkout/checkout-rules.ts   ✅ домен; ⚠️ тексты валидации дублируются
```
