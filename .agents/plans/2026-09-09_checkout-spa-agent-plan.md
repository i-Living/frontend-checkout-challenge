# Исполняемый план для агентов: Checkout SPA

**Файл в проекте:** `.agents/plans/2026-09-09_checkout-spa-agent-plan.md`  
Исходный план `.agents/plans/2026-09-09_000349-checkout-spa.md` не перезаписывать.

**Статус:** T1–T12 собраны. NEED_INPUT-1/2/3 закрыты человеком 2026-09-09: `1A 2A 3A`. Код можно начинать с T1.

**Решения NEED_INPUT (зафиксировано, не переспрашивать):**

1. **NEED_INPUT-1 = A.** Header: `Магазин`
2. **NEED_INPUT-2 = A.** shadcn: style `new-york`, base `neutral`, cssVariables `true`. Из `apps/web`:
   ```sh
   npm exec -- shadcn@latest init --defaults --force
   npm exec -- shadcn@latest add button input label radio-group select card skeleton alert
   ```
3. **NEED_INPUT-3 = A.** Клиентские ошибки полей:
   - name: `Укажите имя`
   - email: `Укажите корректный email`
   - phone: `Телефон в формате + и 10–15 цифр`
   - pickupPointId: `Выберите пункт выдачи`
   - city: `Укажите город`
   - street: `Укажите улицу`
   - house: `Укажите дом`

Источник (брать как есть, не пересказывать «своими словами» при расхождении): `.agents/plans/2026-09-09_000349-checkout-spa.md`.

Дополнительные каноны, на которые источник явно ссылается: `docs/ASSIGNMENT.md`, `docs/INTEGRATION.md`, `docs/EVALUATION.md`, `scripts/smoke.mjs`, `Agents.md`.

---

## Цель

Собрать SPA в `apps/web` (`@checkout/web`): каталог → корзина → оформление → тестовая оплата картой / наличные, по источнику, с покрытием всех пунктов A1–A8, B1–B6, C1–C3, D1–D2, E1 из `docs/EVALUATION.md`.

## Финальный артефакт

Рабочее Vite-приложение в `apps/web` + дополненный корневой `README.md` + короткий `apps/web/README.md` + обновлённый корневой `package-lock.json`. Успех оплаты только после `GET /api/orders/{id}`. Коммитов нет (источник: коммит только по явной просьбе).

## Общие ограничения

Зафиксировано источником. Агент не выбирает другую связку.

**Стек:** npm workspaces, Node 24, React + Vite (не Next), Zustand + TanStack Query, Tailwind CSS v4 (`@tailwindcss/vite`, без `postcss.config`), shadcn/ui + lucide-react, openapi-typescript, Biome. Не bun/yarn/pnpm. Не axios. Не Redux. Не React Hook Form. Не Playwright. Не e2e. Не i18n-фреймворк. Не Storybook. Не PWA. Не dark theme toggle. Не оптимистичный qty без отката. Не динамический обход `links`.

**Не трогать:** `apps/api`, `packages/contracts`, `docs/openapi.json`, `biome.json`, корневые npm-скрипты `dev` / `build` / `check`. Не переименовывать пакеты. Не деплой. Не регистрация / ЛК / админка. Не настоящее PAN/CVC. Не возврат денег. Не ETag / If-Match. Не `npx biome` / `npx lint-staged`. Не `git commit --no-verify`. Не коммитить и не переключать ветки, пока человек явно не попросил.

**Существующие файлы (не переносить, `generated.d.ts` не править руками):**
- `apps/web/src/shared/api/generated.d.ts`
- `apps/web/src/shared/api/api-types.ts`

**HTTP (D2):** один клиент. Страницы не импортируют `fetch`. Пути — константы OpenAPI. `VITE_API_URL` default `http://127.0.0.1:4000`. `Authorization: Bearer ${token}` только если токен есть. `credentials` не ставить. `Content-Type: application/json` только если есть body. `204` / пустое тело → `undefined`, не вызывать `response.json()`. `signal` из Query в `fetch`. Успех: вернуть `data`. Ошибка: объект `{ name: 'ApiError', message, code, status, fields, requestId }` + `isApiError()`. Не `class`. Функциональный TS, без классов.

**Деньги:** только поля API (`price`, `lineTotal`, `subtotal`, `shipping`, `total`). Форматтер ровно:

```ts
export function formatMoney(kopecks: number, currency: 'RUB' = 'RUB') {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(kopecks / 100)
}
```

Не считать shipping/total на клиенте для отображения. Не дублировать суммы в Zustand.

**PUT quantity:** абсолютное число из серверной корзины, не инкремент API. «В корзину» = `PUT { quantity: currentInCart + 1 }`.

**Идемпотентность:** `crypto.randomUUID()`. In-flight `{ key, body }` в store. Повтор сети / двойной клик = те же key+body. Успех или смена body = новый ключ. Ключи раздельно: `orders` vs `payments:{orderId}`. Retry оплаты после fail/cancel = новый ключ, тот же `orderId`.

**Persist:** `sessionStorage`, ключ `checkout.v1`: `token`, `orderId`, `paymentId`, черновик формы, last idempotency.

**QueryClient:**

```ts
new QueryClient({
    defaultOptions: {
        queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 5_000 },
        mutations: { retry: 0 },
    },
})
```

Сеть для B5: кнопка «Повторить», не auto-retry мутаций.

**Query keys (только эти):**
`['session']` `['products']` `['cart']` `['checkout-options']` `['quote', quoteId]` `['sandbox']` `['order', orderId]` `['payments', orderId]` `['payment', paymentId]`

**Маршруты (только эти):**
`/` каталог; `/cart` корзина; `/checkout` оформление; `/orders/:orderId/pay` оплата картой; `/orders/:orderId` итог заказа.

**UI-язык:** русский. Иконки lucide, не emoji. Склонения: `pluralize(n, 'товар', 'товара', 'товаров')`.

**Копии кнопок и экранов (не заменять синонимами):**
- «В корзину» / «Нет в наличии»
- «Удалить»
- «Перейти к оформлению»
- «Оформить и перейти к оплате» (card)
- «Оформить заказ» (cash)
- «Оплатить»
- «Отменить оплату»
- «Оплатить снова»
- «Повторить»
- «Вернуться в каталог»
- «Вернуться к оплате»
- Header: название `Магазин`; ссылка «Корзина (N)» из `cart.quantity`
- Пустая корзина: «Корзина пуста»; CTA оформления disabled; нет перехода на `/checkout`
- Quote placeholder: «Считаем доставку…»
- Ожидание оплаты: «Обрабатываем оплату…»
- Decline на `/orders/:id/pay`: «Банк отклонил карту» (текст экрана оплаты; таблица ошибок описывает тот же случай, экранный текст главнее)
- Cancel: «Оплата отменена»
- Cash success: «Заказ оформлен, оплата при получении»
- Card success только при `GET order` с `status=paid` и `paymentStatus=succeeded`
- `awaiting_payment` + processing: «Оплата ещё обрабатывается» (не успех)
- `201` создания заказа/payment не считать оплатой

**Карта `error.code` → UI (разбирать code, не `message`; `fields[].message` не показывать как подпись поля):**

| HTTP | code | UI |
|---|---|---|
| 401 | `SESSION_REQUIRED` / `SESSION_INVALID` | Новая сессия, повторить запрос |
| 404 | `PRODUCT_NOT_FOUND` | Товар пропал, обновить каталог |
| 404 | `CART_ITEM_NOT_FOUND` | Обновить корзину |
| 409 | `INSUFFICIENT_STOCK` | «Доступно не более N шт.», обновить stock |
| 409 | `CART_VERSION_CONFLICT` | `GET /api/cart`, новый quote, продолжить |
| 409 | `QUOTE_EXPIRED` | Новый quote с тем же delivery, форма жива |
| 422 | `CART_EMPTY` | На корзину, CTA оформления disabled |
| 409 | `IDEMPOTENCY_CONFLICT` | Новый ключ только если body реально другой |
| 409 | `PAYMENT_IN_PROGRESS` | Показать текущую попытку, продолжить poll |
| 409 | `PAYMENT_FINALIZED` | Не менять scenario; после fail/cancel — новая попытка |
| 409 | `ORDER_ALREADY_PAID` | На страницу успеха, `GET` заказа |
| 409 | `PAYMENT_NOT_REQUIRED` | Не вызывать pay для cash |
| 400 | `VALIDATION_ERROR` | Поля по `fields[].path` (`body/customer/email` → email) |
| 200 | payment `failed` + `CARD_DECLINED` | Не HTTP-ошибка. На экране оплаты: «Банк отклонил карту», «Оплатить снова» |
| — | сеть / abort | Форма жива, «Повторить». `AbortError` не показывать как сеть |

**Клиентская проверка до POST заказа:**
- name: непустая строка → `Укажите имя`
- email: встроенный email → `Укажите корректный email`
- phone: `/^\+[1-9]\d{9,14}$/` → `Телефон в формате + и 10–15 цифр`
- pickup: выбран `pickupPointId` → `Выберите пункт выдачи`
- courier: city → `Укажите город`; street → `Укажите улицу`; house → `Укажите дом`
Пункты выдачи и подписи способов — только из `GET /api/checkout/options`. Не хардкодить `point-center` в UI.

**Поток карта (канон smoke + INTEGRATION):**
1. `POST /api/sessions` `{}` → сохранить `data.token` (не `data.id`)
2. `GET /api/products`
3. `PUT /api/cart/items/{productId}` `{ quantity }` абсолют; 201 новая, 200 та же
4. `GET /api/cart` после каждого изменения
5. `GET /api/checkout/options`
6. `POST /api/quotes` `{ cartVersion, delivery }`
7. `POST /api/orders` + `Idempotency-Key` `{ quoteId, paymentMethod: 'card', customer }` → `awaiting_payment` / `unpaid`. Корзина очищается.
8. `POST /api/orders/{orderId}/payments` `{}` + новый `Idempotency-Key`
9. `GET /api/sandbox` → карта по `title` + `maskedNumber`, взять `scenario`
10. `POST /api/payments/{paymentId}/simulations` `{ scenario }`
11. Poll `GET /api/payments/{id}` пока не `succeeded|failed|cancelled`
12. `GET /api/orders/{id}`: успех только `status=paid` и `paymentStatus=succeeded`

**Поток наличные:** шаги 1–6 те же, `POST /api/orders` с `paymentMethod: 'cash_on_delivery'` → `confirmed` / `unpaid`. Шаги 8–11 не вызывать.

**Simulations HTTP:** 202 (poll + `Retry-After`), 201 (нулевая задержка), 200 (повтор того же scenario). Другой scenario → `409 PAYMENT_FINALIZED`. Cancel — кнопка, `scenario: 'cancel'`. Третьей sandbox-карты cancel нет.

**Polling:** `useQuery` payment, `refetchInterval`: `pending|processing` → `max(Retry-After, 400)` мс, иначе `false`. Стоп: терминальный статус или unmount. Игнорировать ответ с `generation` < текущего. После терминального — `GET` заказа. Reload на `/orders/:id/pay`: token из storage → `GET order` → если `paymentStatus=pending` — `GET .../payments`, последняя (новые сверху), продолжить poll. Нет `paymentId` → `GET /api/orders/{orderId}/payments`. Нет `orderId` → `GET /api/orders`, взять актуальный; не выдумывать id.

**Biome после генерации shadcn:** `npm run format` (4 пробела, single quotes, без `;`, LF, 120). Проверка среза: `npm run typecheck -w @checkout/web`, `npm run format:check`.

**Дерево (создать ровно эти пути, не плодить соседние слои):**

```
apps/web/
  index.html
  vite.config.ts
  tsconfig.json
  package.json
  components.json
  src/
    main.tsx
    vite-env.d.ts
    app/App.tsx
    app/providers.tsx
    app/router.tsx
    app/styles.css
    pages/catalog-page.tsx
    pages/cart-page.tsx
    pages/checkout-page.tsx
    pages/payment-page.tsx
    pages/order-page.tsx
    features/catalog/product-card.tsx
    features/cart/cart-line.tsx
    features/checkout/checkout-form.tsx
    features/checkout/delivery-fields.tsx
    features/payment/card-picker.tsx
    features/payment/use-payment-poll.ts
    features/order/order-summary.tsx
    shared/api/generated.d.ts
    shared/api/api-types.ts
    shared/api/client.ts
    shared/api/errors.ts
    shared/api/session.ts
    shared/api/idempotency.ts
    shared/api/query-keys.ts
    shared/api/endpoints.ts
    shared/lib/cn.ts
    shared/lib/money.ts
    shared/lib/pluralize.ts
    shared/store/session-store.ts
    shared/ui/   # button, input, label, radio-group, select, card, skeleton, alert
```

Алиас `@/` → `src/`. `vite.config.ts`: plugin react + `tailwindcss()` из `@tailwindcss/vite`, alias `@`, port 5173. `src/app/styles.css`: `@import 'tailwindcss';`. `tsconfig`: `jsx: react-jsx`, `baseUrl` + `paths`, `verbatimModuleSyntax` не снимать.

**Состояние:**

| Что | Где |
|---|---|
| products, cart, options, quote, order, payment, sandbox | TanStack Query |
| черновик checkout, выбранные delivery/payment | Zustand persist |
| token, orderId, paymentId | Zustand persist |
| модалки, disabled кнопок | локальный useState / isPending |

**1280 / 390:**
- 1280: каталог 2–3 колонки; checkout две колонки (форма \| итог quote sticky)
- 390: одна колонка; CTA на всю ширину, не перекрыта; `overflow-x: hidden` на `body`; поля не уже 44px по высоте
- не tooltip вместо label
- `flex-wrap` + `min-w-0` в строках корзины

**Запуск (два терминала, корневой `dev` не менять):**
- терминал 1: `npm run dev` (API `127.0.0.1:4000`)
- терминал 2: `npm run dev -w @checkout/web` (Vite 5173)

**Запрет на срезы:** не TDD. Не подключать Playwright. Каждый срез оставляет собирающееся приложение.

## Пробелы

Закрыты 2026-09-09 ответами `1A 2A 3A`. Значения — в блоке «Решения NEED_INPUT» в шапке. T1 и T5 больше не ждут ввода.

---

## Задачи

### T1. Каркас Vite + shadcn + lockfile

- Агент: Создать
- Зависит от: нет (NEED_INPUT-1/2 закрыты: `Магазин`; shadcn `new-york` / `neutral` / cssVariables)
- Вход: текущий `@checkout/web` (`package.json` со скриптами `generate:api-types` и `typecheck`; `tsconfig.json` с `verbatimModuleSyntax`; `src/shared/api/{generated.d.ts,api-types.ts}`); команды Scaffold из источника; header `Магазин`; команды shadcn из NEED_INPUT-2=A
- Сделать: одно преобразование — из заглушки `apps/web` получить пустое Vite SPA на порту 5173 с деревом каркаса, провайдерами, роутером на пять маршрутов-заглушек, header (`Магазин` + ссылка «Корзина (0)»), Tailwind v4, shadcn-компонентами из списка, скриптами `dev`/`build`/`preview` при сохранённых `generate:api-types` и `typecheck`, алиасом `@/`, обновлённым корневым `package-lock.json`. Корневые скрипты `dev`/`build`/`check` не менять.
- Не делать: менять корневые npm-скрипты; трогать `apps/api`, `packages/contracts`, `biome.json`; `npx` для biome; переносить/править `generated.d.ts`; добавлять axios/RHF/Playwright; коммитить; запускать интерактивный shadcn CLI
- Выход: артефакт `A1-scaffold` = файлы каркаса по дереву (страницы могут быть заглушками с `<h1>` маршрута), `apps/web/package.json` с `dev`/`build`/`preview`, корневой `package-lock.json`
- Готово, если: `npm run dev -w @checkout/web` открывает страницу на 5173; `npm run typecheck -w @checkout/web` exit 0; `npm run format:check` exit 0; корневой `package.json` scripts.dev/build/check совпадает с исходным
- Брак, если: изменён корневой `dev`/`build`/`check`; нет `dev` у `@checkout/web`; сломан `verbatimModuleSyntax`; появился `postcss.config`; `generated.d.ts` изменён; typecheck/format не зелёные

Команды (из корня, Node 24), плюс init shadcn (NEED_INPUT-2=A):

```sh
npm install -w @checkout/web react react-dom react-router \
  @tanstack/react-query zustand lucide-react clsx tailwind-merge

npm install -w @checkout/web -D vite @vitejs/plugin-react \
  tailwindcss @tailwindcss/vite typescript @types/react @types/react-dom
```

Из `apps/web` (неинтерактивно):

```sh
npm exec -- shadcn@latest init --defaults --force
npm exec -- shadcn@latest add button input label radio-group select card skeleton alert
```

Style `new-york`, base `neutral`, cssVariables `true`. Компоненты ровно этот список. После генерации: `npm run format`.

QueryClient — блок из «Общие ограничения». `providers.tsx`: QueryClient + TooltipProvider.

---

### T2. HTTP-слой + сессия + persist token

- Агент: Реализовать
- Зависит от: T1
- Вход: взять артефакт T1 как есть; канон HTTP-слоя источника (`client.ts`, `errors.ts`, `session.ts`, `idempotency.ts`, `query-keys.ts`, `endpoints.ts`); OpenAPI типы через `api-types.ts`
- Сделать: одно преобразование — добавить модули `apps/web/src/shared/api/{client,errors,session,idempotency,query-keys,endpoints}.ts` и `shared/store/session-store.ts` так, чтобы `ensureSession()` делал `POST /api/sessions` один раз, клал `data.token` в persist `checkout.v1`, последующие запросы несли `Authorization: Bearer`, DELETE 204 не парсил JSON, страницы не импортировали `fetch`
- Не делать: hand-written интерфейсы ответов API; ходить по `links`; `credentials: include`; `class ApiError`; парсить 204; вызывать API со страниц через сырой `fetch`; править `generated.d.ts`
- Выход: артефакт `A2-http` = перечисленные файлы HTTP + store token
- Готово, если: DevTools: один `POST /api/sessions`, затем `GET /api/products` 200 с Bearer; reload восстанавливает token; grep по `pages/` и `features/` не находит `fetch(`; typecheck + format:check exit 0
- Брак, если: сохранён `data.id` вместо `data.token`; повторный POST sessions на каждый запрос; `response.json()` на 204; страницы импортируют `fetch`

---

### T3. Каталог + «В корзину» (A1)

- Агент: Реализовать
- Зависит от: T2
- Вход: взять артефакт T2 как есть; контракт `GET /api/products`, `PUT /api/cart/items/{id}`; экран `/` из источника
- Сделать: одно преобразование — заполнить `pages/catalog-page.tsx` + `features/catalog/product-card.tsx`: карточка title, description, цена из `price` через `formatMoney`, остаток; `stock === 0` (`clock-dot`) → disabled «Нет в наличии»; иначе «В корзину» → `PUT { quantity: currentInCart + 1 }`; состояния skeleton / ошибка+«Повторить» / готово; header «Корзина (N)» из `cart.quantity`
- Не делать: считать цену не из `price`; инкремент API вместо абсолюта; добавлять `clock-dot`; выдумывать товары
- Выход: артефакт `A3-catalog` = каталог на `/`
- Готово, если: 4 товара с API; `clock-dot` нельзя добавить; лампа уходит в серверную корзину (`GET /api/cart` содержит позицию); loading и ошибка различны; typecheck + format:check exit 0
- Брак, если: кнопка у `stock=0` активна; PUT уходит как +1 к API без чтения текущей qty; цены «249000» без форматтера

---

### T4. Корзина (A2, B6 empty/stock)

- Агент: Реализовать
- Зависит от: T3
- Вход: взять артефакт T3 как есть; экран `/cart`; `PUT`/`DELETE`/`GET /api/cart`
- Сделать: одно преобразование — заполнить `pages/cart-page.tsx` + `features/cart/cart-line.tsx`: строки title, qty, `lineTotal`; итог = `cart.subtotal`; stepper/input → `PUT` абсолют; «Удалить» → `DELETE`; пусто: «Корзина пуста», «Перейти к оформлению» disabled, нет перехода на `/checkout`; `INSUFFICIENT_STOCK` → «Доступно не более N шт.» + обновить корзину; invalidate `['cart']` после PUT/DELETE
- Не делать: суммировать `lineTotal` на клиенте для итога; трактовать PUT как инкремент; `response.json()` на 204; пускать пустую корзину на checkout
- Выход: артефакт `A4-cart` = корзина на `/cart`
- Готово, если: qty 2 = один `PUT {quantity:2}`; удаление 204 и список = API; итог = `cart.subtotal`; пустая корзина без оформления; qty > stock → сообщение + корзина обновлена; typecheck + format:check exit 0
- Брак, если: итог посчитан на клиенте; двойной клик «+» шлёт инкремент; повторный DELETE падает на parse JSON

---

### T5. Checkout + quote (A3, A4, C2, B4, B5)

- Агент: Реализовать
- Зависит от: T4 (NEED_INPUT-3 закрыт: строки A)
- Вход: взять артефакт T4 как есть; экран `/checkout`; `GET /api/checkout/options`; `POST /api/quotes`; клиентские правила проверки; строки ошибок из NEED_INPUT-3=A
- Сделать: одно преобразование — заполнить `pages/checkout-page.tsx` + `features/checkout/checkout-form.tsx` + `delivery-fields.tsx`: поля Имя, Email, Телефон, способ доставки, пункт или адрес (город, улица, дом, квартира?), способ оплаты; каждый input с `<label htmlFor>`; Tab/Enter по форме; черновик в Zustand persist (ошибка сети не сносит поля, кнопка «Повторить»); quote при смене delivery или `cart.version` — новый `POST /quotes`; показать `shipping` и `total` из ответа, пока нет — «Считаем доставку…»; CTA card «Оформить и перейти к оплате» (заказ — в T6), CTA cash «Оформить заказ» (заказ — в T7); кнопки disabled на `isPending`; пустая корзина → редирект `/cart`; `409 CART_VERSION_CONFLICT` / `QUOTE_EXPIRED` по таблице ошибок; клиентские ошибки полей строго NEED_INPUT-3=A
- Не делать: хардкод `point-center`; считать shipping (39000 / порог 500000) на клиенте для UI; стирать форму на ошибке; auto-retry мутаций; подписи валидации кроме NEED_INPUT-3=A и таблицы копий
- Выход: артефакт `A5-checkout` = форма + quote на `/checkout` (POST order можно ещё не вызывать, если CTA disabled до T6/T7; если вызывается — только через endpoints + idempotency)
- Готово, если: оба способа доставки и нужные поля с label; смена пункта/адреса/корзины даёт новый quote; shipping/total с сервера; сеть: поля на месте + «Повторить»; B4: смена qty в другой вкладке / смена корзины после quote → обновление и можно продолжить; typecheck + format:check exit 0
- Брак, если: shipping нарисован формулой клиента; пункты захардкожены; форма пустеет после ошибки; нет `<label htmlFor>`

---

### T6. Заказ картой + poll + страница заказа (A5–A7, C1)

- Агент: Реализовать
- Зависит от: T5
- Вход: взять артефакт T5 как есть; поток карты шаги 7–12; экраны `/orders/:orderId/pay` и `/orders/:orderId`; `use-payment-poll.ts`; `card-picker.tsx`; `order-summary.tsx`
- Сделать: одно преобразование — CTA card создаёт заказ (`paymentMethod: 'card'`) с Idempotency-Key, invalidate cart, кладёт order в кэш, переход на `/orders/:id/pay`; на pay: список карт `title` + `maskedNumber` без input PAN/CVC; «Оплатить» шлёт scenario карты; ожидание — блок «Обрабатываем оплату…», кнопки disabled; после терминального payment — `GET order`; UI успеха только если `status=paid`; `order-summary` показывает номер, товары, доставку, сумму **этого** заказа; `201` не считать успехом
- Не делать: input номера карты/CVC; успех по 201/по payment без GET order; вызывать simulations до выбора карты; писать totals из quote на success
- Выход: артефакт `A6-card-pay` = заказ card + poll + success
- Готово, если: карты из sandbox; видно ожидание; success только после GET order `paid`; номер/товары/доставка/сумма с заказа; typecheck + format:check exit 0
- Брак, если: страница успеха рисуется по 201; суммы с локального quote; есть поле CVC/PAN

---

### T7. Наличные (A8)

- Агент: Реализовать
- Зависит от: T6
- Вход: взять артефакт T6 как есть; поток наличных источника
- Сделать: одно преобразование — CTA «Оформить заказ» шлёт `paymentMethod: 'cash_on_delivery'`, переход на `/orders/:id` без `/pay`; экран показывает «Заказ оформлен, оплата при получении» при `confirmed` + `unpaid`; не вызывать payments/simulations
- Не делать: `POST .../payments` для cash; показывать card-success текст; игнорировать `409 PAYMENT_NOT_REQUIRED` вызовом pay
- Выход: артефакт `A7-cash` = cash-ветка
- Готово, если: в Network нет payments/simulations на cash-пути; текст ровно «Заказ оформлен, оплата при получении»; заказ `confirmed` + `unpaid`; typecheck + format:check exit 0
- Брак, если: ушёл POST payments; текст другой; экран ждёт poll

---

### T8. Отказ, отмена, повтор, стоп poll (B1, B6 poll)

- Агент: Реализовать
- Зависит от: T6
- Вход: взять артефакт T6 как есть (после T7 не ломать cash); экран оплаты: decline/cancel/retry
- Сделать: одно преобразование — карта decline (`•••• 0002`) → `failed` + `CARD_DECLINED`, HTTP 200, UI «Банк отклонил карту» + «Оплатить снова», заказ `awaiting_payment`; «Отменить оплату» → `scenario: 'cancel'` → `cancelled` + «Оплата отменена» + «Оплатить снова»; retry = новый `POST .../payments` + новый Idempotency-Key, тот же `orderId`; unmount страницы pay останавливает poll (`signal` + `refetchInterval: false`)
- Не делать: трактовать decline как HTTP-ошибку; делать cancel третьей картой; retry тем же paymentId/тем же ключом; продолжать poll после unmount
- Выход: артефакт `A8-retry` = decline/cancel/retry + abort poll
- Готово, если: decline ≠ cancel визуально и по `data.status`; повтор success на том же `orderId`; уход со страницы во время processing — в Network нет новых GET payment; typecheck + format:check exit 0
- Брак, если: decline показан как сетевая ошибка; cancel выбирается картой; retry создаёт новый orderId; poll идёт после ухода

---

### T9. Идемпотентность и reload (B2, B3)

- Агент: Реализовать
- Зависит от: T8, T7
- Вход: взять артефакты T7+T8 как есть; правила idempotency + persist + reload poll из источника
- Сделать: одно преобразование — in-flight key+body для `orders` и `payments:{orderId}`; двойной клик «Оформить» / «Оплатить» повторяет те же key+body; F5: token, корзина (Query `GET /api/cart`), `orderId`/`paymentId` из `checkout.v1`; если payment `pending`/`processing` — продолжить poll; потеря paymentId → список payments заказа; потеря orderId → `GET /api/orders`
- Не делать: новый ключ на retry сети с тем же body; выдумывать id; считать reload успешным без GET order
- Выход: артефакт `A9-idem-reload` = persist + replay ключей + resume poll
- Готово, если: двойной клик «Оформить» = один заказ; offline на POST order затем retry = тот же ключ и тот же id; F5 на ожидании оплаты продолжает poll и даёт корректный итог; F5 на корзине = те же позиции; typecheck + format:check exit 0
- Брак, если: два заказа с одного двойного клика; новый UUID на повтор сети; F5 теряет token/корзину/заказ; F5 на processing не возобновляет poll

---

### T10. UI 1280/390 + a11y (C1–C3)

- Агент: Довести
- Зависит от: T9
- Вход: взять артефакт T9 как есть; правила 1280/390 и C1/C2 из источника
- Сделать: одно преобразование — довести вёрстку всех пяти маршрутов: 1280 каталог 2–3 колонки, checkout форма|sticky quote; 390 одна колонка, CTA на всю ширину, `overflow-x: hidden` на `body`, высота полей ≥ 44px, `flex-wrap` + `min-w-0` в строках корзины; loading / ожидание оплаты / ошибка / успех визуально различны; фокус виден; Enter в поле не ломает форму; не tooltip вместо label
- Не делать: менять тексты кнопок; менять API-потоки; добавлять новые маршруты
- Выход: артефакт `A10-ui` = те же страницы с вёрсткой C1–C3
- Готово, если: DevTools 1280 и 390, полный путь карта и наличные, нет горизонтального скролла страницы, поля и CTA доступны, фокус виден, Enter не сабмитит ломаным образом; typecheck + format:check exit 0
- Брак, если: горизонтальный скролл на 390 мешает оформлению; CTA перекрыта; label заменён tooltip; состояния loading/error/success неотличимы

---

### T11. README (E1, D2 абзац)

- Агент: Дописать
- Зависит от: T10
- Вход: взять артефакт T10 как есть; текущий корневой `README.md` (инструкции API не вычищать); `apps/web/README.md`; чеклист A/B источника
- Сделать: одно преобразование — дополнить корневой `README.md` и короткий `apps/web/README.md` теми же командами фронта:
  - Node 24 + npm 11
  - `npm ci`
  - терминал 1: `npm run dev` (API)
  - терминал 2: `npm run dev -w @checkout/web`
  - сборка: `npm run build -w @checkout/web` и `npm run build` (api)
  - решение: Query vs Zustand; путь HTTP-клиента (D2) = `apps/web/src/shared/api/client.ts` (+ `errors.ts`, `endpoints.ts`)
  - проверенные сценарии = чеклист A/B из источника (отметить только то, что пройдено фактом в UI)
  - недоработки: только фактически оставшиеся; если нет — строка «Нет»
  - затраченное время: факт агента/человека, не выдуманное число; если неизвестно — оставить пустым и пометить NEED_INPUT времени (не подставлять «6–8 часов»)
- Не делать: вычищать API-инструкции корня; описывать несделанные пункты как проверенные; менять код приложения
- Выход: артефакт `A11-readme` = обновлённые `README.md` и `apps/web/README.md`
- Готово, если: из текста свежего клона следуют ci / dev API / dev web / build web / build api; есть абзац D2 с путём клиента; есть сценарии и недоработки
- Брак, если: стёрт запуск API; нет команд фронта; D2 не указан путём файла; отмечены непройденные сценарии

---

### T12. Сборка финального результата

- Агент: Собрать
- Зависит от: T11 (и транзитивно T1–T10)
- Вход: взять артефакты A1–A11 как есть, без правки смысла
- Сделать: одно преобразование — выписать единый пакет сдачи: пути `apps/web`, корневой README, lockfile; перенести чеклист A/B/C/D/E из источника и напротив каждого пункта поставить факт из приёмки срезов (пройден / не пройден / не проверялся). Код и README не переписывать, только зафиксировать соответствие.
- Не делать: менять поведение UI; «улучшать» копии; закрывать пункты без факта; коммитить
- Выход: артефакт `A12-delivery` = файл `.agents/plans/2026-09-09_checkout-spa-acceptance.md` со структурой:

```
# Приёмка Checkout SPA
## Пакет
- apps/web: <факт>
- README: <факт>
- package-lock.json: <факт>
## Чеклист
- A1: пройден|не пройден|не проверялся — <наблюдение одной строкой>
… все A1–A8, B1–B6, C1–C3, D1–D2, E1
## Запреты
- apps/api не изменён: да|нет
- корневые scripts не изменены: да|нет
```

- Готово, если: чеклист полный; статусы не противоречат срезам; код не изменён этим шагом
- Брак, если: пункт отмечен «пройден» без наблюдения; изменены исходники «заодно»; потерян смысл A1–A11

---

## Порядок

**Строго последовательно:** T1 → T2 → T3 → T4 → T5 → T6. T7 и T8 оба зависят от T6: **T7 затем T8** (не параллелить: оба трогают payment/order UI). Далее строго: T9 → T10 → T11 → T12.

**Параллельно:** нельзя. Каждый срез оставляет одно работающее приложение в том же дереве файлов.

**Блокировки до кода:** нет. NEED_INPUT-1/2/3 закрыты (`1A 2A 3A`). Можно начинать T1.

**Финал:** T12 собирает `A12-delivery` из A1–A11 и не меняет их смысл.

**Остановка источника:** если любое допущение источника (Vite не Next; UI RU; деньги из API; cancel кнопкой; корневой `dev` не трогать; без e2e; без ETag; ApiError-объект) будет признано неверным человеком — не продолжать код.
