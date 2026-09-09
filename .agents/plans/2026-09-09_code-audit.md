# Аудит кода frontend-checkout-challenge — 2026-09-09

> Область: `apps/web/src` (полностью), `apps/api/src` (только чтение, менять запрещено),
> `packages/contracts`, конфиги корня, `scripts/*`, `.github/workflows`, `docs/*`, README.
> Метод: ручное чтение всех файлов + `npm run typecheck -w @checkout/web` (exit 0, PASS),
> `npm run format:check` (`biome check`, 41 файл, 1 warning), grep-проверки
> (`aria-describedby`/`document.title`/`aria-busy` — отсутствуют, мертвый код подтвержден).
> Код не менялся. Запреты из `.agents/plans`: не трогать `apps/api`, `packages/contracts`,
> `docs/openapi.json`, `biome.json`, корневые скрипты без спроса — учтены ниже.

## Итог одной строкой

Критично: **2 зацикленных retry** (оплата после `PAYMENT_FINALIZED`, заказ после
`IDEMPOTENCY_CONFLICT`) — кнопки «Оплатить снова» / «Повторить» бьют в тот же ключ
и получают тот же 409 вечно. Остальное — важные UX/a11y/состояние/CI-пробелы + мелочи.
Основной путь A1–A8 в целом корректен (абсолютный `PUT`, `204`, decline как 200+failed,
успех только по серверному заказу, остановка поллинга — верно).

## P0 — критично (чинить первым)

### P0-1. Retry после `PAYMENT_FINALIZED` зациклен — `payment-page.tsx:116-128,318-326`
- Что: `getOrCreatePaymentKey(id, {})` при неизменном теле `{}` возвращает тот же ключ
  (сброс только в `onSuccess`). Повторный `createPayment` с тем же ключом реплеит тот же
  финализированный платеж (200 по идемпотентности), а `createSimulation` снова дает
  `409 PAYMENT_FINALIZED`. Кнопка «Оплатить снова» никогда не создает новую попытку.
- Фикс: в `onError`/`handlePay` при `PAYMENT_FINALIZED` делать `clearPaymentKey()` +
  `invalidateQueries(keys.payments(orderId))`, затем retry с новым ключом.
  Дополнительно: при `PAYMENT_IN_PROGRESS` тоже инвалидировать `keys.payments(orderId)`,
  чтобы `effectivePaymentId` подхватил реальную активную попытку (`payment-page.tsx:292-296`).

### P0-2. Retry после `IDEMPOTENCY_CONFLICT` зациклен — `checkout-page.tsx:303-327,407-417`
- Что: текст «Повторите попытку», но кнопка зовет `handleSubmit(draft)` →
  `getOrCreateOrderKey(body)` с тем же body возвращает тот же key → снова 409.
- Фикс: при `IDEMPOTENCY_CONFLICT` делать `clearOrderKey()` перед повтором
  (новый key) либо генерировать новый ключ и ретраить один раз автоматически.
  Сообщение уточнить: «Данные конфликтуют с прошлой попыткой, создан новый ключ — повторите».

## P1 — важно (бизнес-логика и состояние)

- **P1-1. Email-регекс пропускает пробелы** — `checkout-page.tsx:38` `/.+@.+\..+/`.
  Фикс: `/^\S+@\S+\.\S+$/` (+ уже имеющийся `trim()`).
- **P1-2. Quote через `useQuery` + глобальный `retry: 1`** — `checkout-page.tsx:220-224`,
  `providers.tsx:10-15`. Неуспешный `POST /api/quotes` дублируется автоматически.
  Фикс: `retry: 0` точечно для quote (или переделать quote на `useMutation`).
- **P1-3. Ключ quote захардкожен** `['quote', cartVersion, deliveryKey]`,
  фабрика `keys.quote()` (`query-keys.ts:16`) не используется. Фикс: расширить фабрику
  (`quoteByVersion(version, deliveryHash)`) и использовать ее.
- **P1-4. Кнопка «Оформить» активна до готовности quote** — `checkout-page.tsx:303-313`.
  При `!quote` делается тихий `refetch()` и выход — клик визуально ничего не делает.
  Фикс: `disabled={isPending || !quoteQuery.data}` + подпись состояния в кнопке.
- **P1-5. Ветка ошибки quote показывает «Считаем доставку…»** — `checkout-page.tsx:478`.
  Фикс: убрать строку 478, оставить алерт + retry.
- **P1-6. Пустой адрес курьера = бесконечный «Считаем…»** — `checkout-page.tsx:185-216`.
  `effectiveDelivery === null` неотличим от загрузки. Фикс: если
  `deliveryMethod==='courier' && !effectiveDelivery` — «Заполните город, улицу и дом…».
- **P1-7. `order-page.tsx:125-138` не опрашивает `awaiting_payment/pending`.**
  Фикс: `refetchInterval` пока pending или кнопка «Обновить статус».
- **P1-8. Каталог: бейдж «Остаток» протухает** — `catalog-page.tsx:36-54`,
  `product-card.tsx:56-58`. `products` инвалидируется лишь при `INSUFFICIENT_STOCK`.
  Фикс: инвалидировать `keys.products` и в `onSuccess` (или `stock - quantityInCart`).
- **P1-9. `cart-line.tsx:50-60` кламп `1..99`, `stock` нет в пропсах.** Можно выставить 99
  при остатке 2 → `INSUFFICIENT_STOCK`. Фикс: прокинуть `stock`, клампить `1..stock`.
- **P1-10. Неизвестный `deliveryMethod` молча = pickup** — `checkout-page.tsx:65-83` (+ `as`
  на строках 75,77,82). Фикс: явный union + `return null` для неизвестного метода,
  убрать `as` через guard-переменные (там же строка 222 `cartVersion as number`).
- **P1-11. 404 заказа без различия** — `order-page.tsx:61-77`, `payment-page.tsx:229-243`.
  Только «Повторить». Фикс: при `status===404` — «Заказ не найден» + `<Link to='/'>`.
- **P1-12. Поллинг 800мс игнорирует `Retry-After`** — `use-payment-poll.ts:47-53`,
  `client.ts:146-182` не возвращает заголовки. Фикс: вернуть из `request`/`createSimulation`
  `{ data, retryAfter }` и использовать в `refetchInterval`.
- **P1-13. Persist без гарантии регидратации** — `session-store.ts:117-140`,
  `session.ts:33-47`. После F5 `ensureSession` может создать новую сессию поверх
  сохраненного токена. Фикс: флаг `hasHydrated` / ленивое создание только в `withAuth`.

## P1 — важно (a11y / роутинг / UX)

- **P1-14. Нет `aria-describedby` input↔ошибка нигде** (проверено grep — 0 совпадений):
  `checkout-form.tsx:83-130`, `delivery-fields.tsx:52-132`, `cart-line.tsx:82-97`
  (есть `aria-invalid` + `role='alert'`, но без `id`). Фикс: `id` на `<p role='alert'>` +
  `aria-describedby` на инпуте.
- **P1-15. Карточка radio не кликается по паддингу** — `checkout-form.tsx:142-165,191-214`.
  `cursor-pointer` на `div`, но `onClick` нет. Фикс: обертка `<label>` или `onClick` + клавиатура.
- **P1-16. Нет `*` (404) и `errorElement`** — `router.tsx:16-28`. Неизвестный URL = пустой
  `<Outlet/>`. Фикс: добавить `NotFound` route.
- **P1-17. Самовывоз показывает сырой `pickupPointId`** — `order-summary.tsx:20-22`
  («point-center»). Фикс: резолвить название из `checkoutOptions`.
- **P1-18. Двойная обработка `ORDER_ALREADY_PAID`** — `payment-page.tsx:165-170` + `:259-261`
  (эффект-навигация и render-`Navigate`). Убрать одну.

## P2 — мертвый код и дубли (проверено grep)

- `session.ts:56-72` `requestWithSession` — нигде не импортируется, дублирует `withAuth`
  из `endpoints.ts:65-81`. Оставить `withAuth`, удалить `requestWithSession`.
- `session.ts:78-85` `useEnsureSession` + `keys.session` (`query-keys.ts:8`) — никогда
  не вызываются. Удалить либо вызывать в `App`.
- `session-store.ts:77,94` `setDraft`, `clearLast` — только определяются, везде `patchDraft`.
  Удалить.
- `shared/ui/select.tsx` (160 строк Radix) — нигде не импортируется, доставка использует
  нативный `<select>` (`delivery-fields.tsx:113`). Удалить файл или использовать.
- `query-keys.ts`: ключ `keys.order()` перегружен (recovery-список + детали).
  Фикс: отдельный `keys.ordersList = ['orders']`.
- `checkout-form.tsx:151,200` — мусорные `{' '}`. Удалить.
- `card-picker.tsx:37-41` — тернарник className вместо `cn()` (нарушение AGENTS.md).
- `checkout-page.tsx:114-138` — `toServerFieldErrors` теряет неизвестные поля (в т.ч.
  `apartment`) и при пустом маппинге возвращает `null`. Фикс: фолбэк — общий алерт
  с `error.message`.

## P2 — мелочи (типизация, перф, стиль)

- `payment-page.tsx:62,74,117`, `order-page.tsx:27`, `use-payment-poll.ts:45` —
  `orderId as string` / `paymentId as string`. Фикс: helper `orThrow()` внутри `queryFn`.
- `Simulation` в `endpoints.ts:51` описан только по ответу 202 (200/201 на рантайме не ломают,
  но тип уже). Расширить union.
- `money.ts:7-9` — новый `Intl.NumberFormat` на каждый вызов. Фикс: кэш инстанса на модуле.
- `theme-store.ts:17-19` — `window.matchMedia` на инициализации модуля упадет в non-DOM.
  Фикс: `typeof window !== 'undefined' ? … : 'light'`.
- `payment-page.tsx:96` `new Set` на каждый рендер, `checkout-page.tsx:212`
  `JSON.stringify(delivery)` на каждый рендер — при желании `useMemo` (пренебрежимо).
- Скелетоны без `aria-busy`/`role='status'` (`catalog-page.tsx:86-102`,
  `cart-page.tsx:73-91`); нет `document.title` на роутах (grep — 0).
  Фикс: `aria-busy='true'` на контейнер, tiny-эффект title.
- `product-card.tsx:63` кнопка «Нет в наличии» без `type='button'`; `cart-page.tsx:129`
  disabled-CTA в пустой корзине без пояснения (лучше скрыть).
- `idempotency.ts:11-13` `crypto.randomUUID()` без фолбэка — ок на `http://127.0.0.1`
  (secure context), для `file://`/старья добавить фолбэк через `getRandomValues`.
- Biome: `button.tsx:55` `export { Button, buttonVariants }` — единственный warning
  `useComponentExportOnlyModules` (подтверждено `npm run format:check`, shadcn-паттерн,
  несрочно). Стиль в остальном ок: 4 пробела, single quotes, без `;`, `≤120`, импорты `@/`.

## Конфиги / CI / скрипты / доки (не `apps/web/src`)

- **C-1 [важно]. Корневой `check` не покрывает фронт.** `check` = `format:check` + `test`
  (contracts+api) + `docs:check`. `typecheck -w @checkout/web` есть только в pre-commit,
  `vite build -w @checkout/web` — нигде. Сломанный фронт = зеленый CI.
  Фикс: `check:web` (`typecheck` + `vite build`) в `check` + шагом в CI.
  Ограничение: AGENTS.md запрещает менять корневые скрипты без спроса — нужно решение владельца.
- **C-2 [важно]. `.husky/pre-commit` дублирует сборку API** (шаг 2 `build -w @checkout/api`
  и шаг 4 `npm run build` = contracts+api) и не собирает web через Vite.
  Фикс: шаг 2 → сборка contracts (или убрать), добавить `npm run build -w @checkout/web`.
- **C-3 [важно]. CI `check.yml`**: фронта нет (см. C-1); `BASE_URL` не задан явно
  (сейчас совпадает по умолчанию, но хрупко); при падении `smoke` лог
  `/tmp/checkout-api.log` никуда не выводится. Фикс: шаги web, `BASE_URL=...`,
  `cat` лога при `if: failure()`. Мелочь: health на `localhost`, сервер на `127.0.0.1` —
  унифицировать на `127.0.0.1`.
- **C-4 [мелочь]. `lint-staged.config.mjs`**: голый `biome` (расходится с AGENTS.md),
  `format --write` + `check --write` избыточны (`check` уже включает формат),
  `join(' ')` без кавычек сломается на путях с пробелами (Windows).
  Фикс: один `biome check --write`, файлы массивом/в кавычках.
- **C-5 [мелочь]. `engines` только в корне**, в `apps/*` нет, `.npmrc` с
  `engine-strict=true` нет. На Node 20 `npm ci` пройдет молча.
- **C-6 [мелочь]. `AGENTS.md` устарел**: «Until the Vite app exists…» — web уже существует.
- **C-7 [мелочь]. Скрипты**: `smoke.mjs` — `response.json()` без try, `find(p => stock>0)`
  без assert, копит сессии в `store.json`; `openapi.mjs` — `docs:check` без `build` проверит
  stale dist (в `check` спасает порядок); `reset.mjs` игнорирует `DATA_FILE`
  (задокументировано, улучшение — читать env).
- **C-8 [мелочь]. Доки**: корневой README «T1–T10 — сабагенты» — внутренний жаргон,
  заменить на «≈N часов»; три написания адреса (`VITE_API_URL` → `127.0.0.1:4000`,
  `INTEGRATION.md` → `localhost:4000`, smoke → `localhost:4000`) — унифицировать;
  B3/B5/C1/C2 честно помечены «код, без браузера» — явно подписать «статически».
  `VITE_API_URL` задокументирован в обоих README — ок. `apps/web/.env.example` отсутствует —
  добавить. `.gitignore`/`.nvmrc`/секреты — ок (`.data/`, `.env` игнорируются,
  логгер redact'ит `authorization`/`idempotency-key`, `store.json` mode 0600).

## Что верно (не ломать)

Абсолютный `PUT quantity` (`catalog-page.tsx:61-75`); `204` без `json()` (`client.ts:165-167`);
decline как 200+`failed`/`CARD_DECLINED`, успех только по `GET order` (`paid`+`succeeded`,
cash `confirmed`+`unpaid`); создание заказа чистит корзину + сбрасывает чужой `paymentId`;
отмена сохраняет заказ; `CART_VERSION_CONFLICT`/`QUOTE_EXPIRED`/`PAYMENT_NOT_REQUIRED`/
`ORDER_ALREADY_PAID` обработаны; `credentials: include` отсутствует (верно);
токен в `sessionStorage` (верно для задания); `any`/`!` в `src` отсутствуют;
типы из `generated.d.ts`; дебаунс адреса 300мс; `staleTime 5s`, `refetchOnWindowFocus: false`;
generation-guard против поздних ответов; `XSS`-векторов нет; CORS/`no-store`/`Location`/
`Retry-After`/`WWW-Authenticate`/`X-Request-Id` на API — ок.

## Статус на 2026-09-09

- **P0–P2 — все исправлены** в `apps/web/src` (см. правки: retry-петли, quote/email/stock,
  Retry-After, регидратация, a11y, 404-роут, мёртвый код; дополнительно: `uuid`, ErrorBoundary).
- **C-1…C-8 — выполнены**: `check:web` в корневом `check`; pre-commit без дублей api-сборки
  + web build; CI с `BASE_URL=http://127.0.0.1:4000` и `cat` лога при падении; lint-staged одним
  `biome check --write` с кавычками; `.npmrc engine-strict` + `engines` в `apps/web`;
  AGENTS.md/README актуализированы; `smoke.mjs` (guards), `reset.mjs` (`DATA_FILE`),
  `openapi.mjs` (guard свежести dist); `apps/web/.env.example`.
- **Сознательно не трогалось**: `apps/api`, `packages/contracts`, `docs/openapi.json`,
  `engines` в `apps/api/package.json` (ограничение «не трогаем бэк»).
- **Известное окружение (не баг правок)**: на Windows с `core.autocrlf=true`
  `docs:check` падает на byte-compare из-за CRLF в рабочей копии `docs/openapi.json`.

## Предлагаемый порядок работ

1. P0-1 + P0-2 (разорвать retry-петли) + автотест-повтор 409 → новый ключ.
2. P1-1…P1-6 (валидация, quote retry/disabled/тексты, courier-подсказка).
3. P1-7…P1-13 (order polling, stock-кламп, `Retry-After`, регидратация, ключи).
4. P1-14…P1-18 (a11y, 404, pickup-название).
5. P2 мертвый код + мелочи + `document.title`/`aria-busy`.
6. C-1…C-4 (после решения владельца по корневым скриптам): `check:web`, pre-commit, CI, lint-staged.
