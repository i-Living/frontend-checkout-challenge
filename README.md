# Тестовое задание для фронтенд-разработчика

Нужно сделать интерфейс магазина: каталог, корзину, оформление заказа и оплату тестовой картой. Бэкенд готов, фронтенд добавьте в `apps/web`.

[Условия задания](docs/ASSIGNMENT.md) · [Работа с API](docs/INTEGRATION.md) · [Критерии оценки](docs/EVALUATION.md)

## Запуск

Потребуются Node.js 24.x и npm 11.x. Отдельная база данных и ключи внешних сервисов не нужны.

```sh
git clone https://github.com/instatdigital/frontend-checkout-challenge.git
cd frontend-checkout-challenge
npm ci
npm run dev
```

Swagger: [http://localhost:4000/docs/](http://localhost:4000/docs/). Спецификация: [http://localhost:4000/openapi.json](http://localhost:4000/openapi.json) или [файл в репозитории](docs/openapi.json).

В Swagger выполните `POST /api/sessions` с телом `{}`. Скопируйте `data.token` в **Authorize**, без слова `Bearer`.

## Структура

```text
apps/api/             бэкенд
apps/web/             ваш фронтенд
packages/contracts/   схемы API и типы TypeScript
docs/                 задание и документация
scripts/              проверки
```

Проект использует npm workspaces. Приложение в `apps/web` назовите `@checkout/web`. Добавьте команды запуска фронтенда в README своего решения. Пока его нет, `npm run dev` запускает только API.

## Проверки

```sh
npm run check       # форматирование, сборка, тесты и OpenAPI
npm run build
npm start           # запуск собранного бэкенда
```

При работающем API в другом терминале выполните `npm run smoke`. Эта команда проверяет покупку, отказ карты, отмену и повтор оплаты по HTTP.

## Настройки

Адрес по умолчанию — `127.0.0.1:4000`. Если порт занят, скопируйте `.env.example` в `.env` и измените `PORT`. Для проверки другого порта передайте `BASE_URL`, например `BASE_URL=http://localhost:4100 npm run smoke`.

Фронтенд может работать на любом HTTP-порту `localhost`, `127.0.0.1` или `[::1]`. Другие разрешённые адреса задаются в `CORS_ORIGINS`. Авторизация передаётся заголовком; cookies и `credentials: include` не нужны.

Данные сохраняются в `.data/store.json`. Запускайте один экземпляр API на один файл. Для сброса остановите сервер и выполните `npm run data:reset`; затем создайте новую сессию. Если меняли `DATA_FILE`, свой файл удалите вручную при остановленном сервере.

Товары и адреса вымышленные. Остаток ограничивает количество в одной корзине и не уменьшается у других покупателей. Для получателя используйте тестовые контакты, например `buyer@example.test`. Вместо ввода номера карты интерфейс должен предлагать тестовые карты из API.

Корневые команды сборки и тестов проверяют бэкенд. В решении добавьте отдельные команды запуска и сборки `apps/web`, а после установки его зависимостей обновите корневой `package-lock.json`. Схемы API в `packages/contracts` можно использовать напрямую или описать нужные типы у себя.

## Фронтенд `@checkout/web` (решение)

Требования: Node 24 + npm 11 (см. `engines` в корневом `package.json`).

```sh
npm ci
```

Терминал 1 — API:

```sh
npm run dev
```

API слушает `127.0.0.1:4000`, Swagger — `http://localhost:4000/docs/`.

Терминал 2 — фронтенд (Vite, порт 5173):

```sh
npm run dev -w @checkout/web
```

Откройте `http://localhost:5173/`. Базовый URL API переопределяется через `VITE_API_URL` (по умолчанию `http://127.0.0.1:4000`).

Сборка:

```sh
npm run build -w @checkout/web
npm run build   # contracts + api
```

### Решение Query vs Zustand

- TanStack Query — всё серверное состояние: каталог, корзина, опции checkout, quote, заказ, платежи, sandbox-карты, поллинг оплаты (см. `apps/web/src/pages/*`, `apps/web/src/features/payment/use-payment-poll.ts`, `QueryClient` в `apps/web/src/app/providers.tsx`).
- Zustand (`persist`, `sessionStorage`) — только клиентское UI-состояние: токен сессии, текущий `orderId`/`paymentId`, черновик формы checkout, последние тело+`Idempotency-Key` заказа/оплаты для безопасного повтора (см. `apps/web/src/shared/store/session-store.ts`).

### HTTP-клиент (D2)

Единая точка настройки соединения — `apps/web/src/shared/api/client.ts`: базовый URL (`VITE_API_URL` / `127.0.0.1:4000`), заголовок `Authorization: Bearer <token>`, заголовок `Idempotency-Key`, разбор JSON/`204`, маппинг ошибок. Рядом: `apps/web/src/shared/api/errors.ts` (тип `ApiError`, перевод кодов в понятный вид), `apps/web/src/shared/api/endpoints.ts` (обёртки над эндпоинтами), `apps/web/src/shared/api/idempotency.ts` (ключи идемпотентности), `apps/web/src/shared/api/query-keys.ts`, `apps/web/src/shared/api/session.ts`. Страницы не копируют fetch-настройку, а используют эти модули.

### Проверенные сценарии (EVALUATION.md)

Живой прогон выполнен 2026-09-09 против API `127.0.0.1:4000`: `npm run smoke` — 5/5 PASS; прямые HTTP-проверки по всем пунктам A/B — PASS (факты ниже); фронт: `npm run dev -w @checkout/web` — HTTP 200 на `:5173`, `typecheck` exit 0, `biome check` — 0 ошибок, `vite build` — 2008 модулей ok. Сквозной клик-путь в браузере не выполнялся (нет браузера в среде), UI-поведение подтверждено кодом + grep-копиями.

Основной сценарий (факты живого API):

- A1 — пройден: `GET /api/products` вернул 4 товара (lamp-orbit 249000/stock 10, mug-line 89000/20, bag-day 159000/5, clock-dot 329000/stock 0); фронт: `PUT {quantity: currentInCart + 1}`, `stock=0` — disabled «Нет в наличии» (`catalog-page.tsx`, `product-card.tsx`).
- A2 — пройден: повтор `PUT {quantity:1}` не меняет версию/количество (абсолют), `PUT {quantity:2}` → qty 2, `subtotal` 498000 из `GET /api/cart`; итог во фронте — `cart.subtotal` (`cart-page.tsx`).
- A3 — пройден: `GET /api/checkout/options` — 2 доставки (`pickup` с пунктами point-center/point-north, `courier`) и 2 оплаты (`card`, `cash_on_delivery`); фронт берёт подписи/пункты только из API по `id` (`checkout-form.tsx`).
- A4 — пройден: pickup shipping 0 (total 249000); курьер при subtotal < 500000 — 39000 (total 288000); при subtotal 747000 — 0; фронт показывает shipping/total из quote, placeholder «Считаем доставку…».
- A5 — пройден: `POST /api/orders` (card) → 201 `awaiting_payment`; `GET /api/sandbox` — 2 карты («Тестовая карта: успешная оплата •••• 4242» / «отказ банка •••• 0002»); фронт `card-picker.tsx` — только title + maskedNumber.
- A6 — пройден: simulation 202 → poll `GET /api/payments/{id}` до `succeeded`; успех только по `GET /api/orders/{id}` (`paid` + `succeeded`); фронт — блок «Обрабатываем оплату…», poll 800 мс (`use-payment-poll.ts`).
- A7 — пройден: заказ содержит номер, товары, доставку, total 249000; фронт `order-summary.tsx` рендерит всё из заказа.
- A8 — пройден: cash-заказ `confirmed`/`unpaid`; `POST .../payments` → 409 `PAYMENT_NOT_REQUIRED`; фронт cash не вызывает payments, текст «Заказ оформлен, оплата при получении» (`order-page.tsx:92`).

Устойчивость (факты живого API + код):

- B1 — пройден: decline → `failed`/`CARD_DECLINED` (HTTP 200), заказ `awaiting_payment`; cancel → `cancelled`, заказ `awaiting_payment`; retry success на том же `orderId` → `paid`. Фронт: «Банк отклонил карту» / «Оплата отменена» + «Оплатить снова» (`payment-page.tsx:331,341,385`).
- B2 — пройден: повтор `POST /orders` с тем же key+body → 200 тот же id; тот же ключ + другое тело → 409 `IDEMPOTENCY_CONFLICT`; повтор `POST .../payments` → тот же payment id. Фронт: `getOrCreateOrderKey/getOrCreatePaymentKey`, clear только on success.
- B3 — реализован в коде, живой F5 в браузере не выполнялся: persist `checkout.v1` (sessionStorage): token/orderId/paymentId/черновик/ключи; resume через `GET order` → `GET .../payments` (последняя активная) → продолжение poll; потеря orderId → `GET /api/orders`.
- B4 — пройден: `POST /quotes` с будущей версией → 409 `CART_VERSION_CONFLICT`; фронт: invalidate cart + новый quote, форма жива (`checkout-page.tsx:73,198,402`).
- B5 — частично в коде: форма живёт в Zustand (ошибка сети её не сносит), кнопка «Повторить», quote-key включает версию+delivery, generation-guard в `payment-page.tsx:42,94`; поздний-ответ-побеждает кейс живым ретестом не гонялся.
- B6 — пройден: пустой quote → 422 `CART_EMPTY` (фронт: «Корзина пуста», CTA disabled, нет перехода на `/checkout`); qty 99 → 409 `INSUFFICIENT_STOCK` «Доступно не более 10 шт.»; clock-dot → 409; poll останавливается на терминальном статусе (`refetchInterval: false`) и на unmount (signal).

Интерфейс/код (проверено кодом + grep):

- C1 — копии на месте (34 совпадения): состояния loading/skeleton, «Обрабатываем оплату…», Alert-ошибки, success-Card различимы.
- C2 — все поля с `<label htmlFor>` (Имя/Email/Телефон/Город/Улица/Дом/Квартира/Пункт), ошибки строками NEED_INPUT-3=A, focus-visible стили, `aria-live` на статусах.
- C3 — каталог `grid-cols-1/sm:2/lg:3`, checkout `lg:grid-cols-[1fr_380px]` + sticky quote, CTA `w-full sm:w-auto`, поля `min-h-[44px]`, `body overflow-x:hidden`; скриншоты 1280/390 не снимались (нет браузера).
- D1/D2 — пройден: слои разделены, `fetch` только в `client.ts`, типы из `generated.d.ts`, README описывает путь клиента.

### Недоработки

- Сквозной браузерный прогон (клики, F5 во время processing, вьюпорты 1280/390 со скриншотами) не выполнен — в среде нет браузера; покрыто живым API + статикой кода.
- `Simulation` тип в `endpoints.ts` описан только по ответу 202 (200/201 тех же данных на рантайме не ломают, но тип уже); `buttonVariants` — pre-existing Biome warning (shadcn-паттерн).
- Тестовые сессии/заказы прогона остались в локальном `.data/store.json` (gitignored); при желании — остановить API и `npm run data:reset`.

### Затраченное время

T1–T10 — сабагенты (точное время неизвестно); живой прогон A/B + фронт — эта сессия (~1 ч).
