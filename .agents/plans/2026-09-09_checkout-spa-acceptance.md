# Приёмка Checkout SPA

## Пакет

- apps/web: Vite SPA существует (`@checkout/web`): `apps/web/index.html`, `apps/web/vite.config.ts` (react + tailwindcss, alias `@`, порт 5173), `apps/web/package.json` (scripts `dev`/`build`/`preview` + сохранённые `generate:api-types`/`typecheck`), `apps/web/components.json`, `src/main.tsx`, `src/vite-env.d.ts`, `src/app/App.tsx`, `src/app/providers.tsx`, `src/app/router.tsx`, `src/app/styles.css`, `src/pages/catalog-page.tsx`, `src/pages/cart-page.tsx`, `src/pages/checkout-page.tsx`, `src/pages/payment-page.tsx`, `src/pages/order-page.tsx`, `src/features/catalog/product-card.tsx`, `src/features/cart/cart-line.tsx`, `src/features/checkout/checkout-form.tsx`, `src/features/checkout/delivery-fields.tsx`, `src/features/payment/card-picker.tsx`, `src/features/payment/use-payment-poll.ts`, `src/features/order/order-summary.tsx`, `src/shared/api/client.ts`, `src/shared/api/errors.ts`, `src/shared/api/session.ts`, `src/shared/api/idempotency.ts`, `src/shared/api/query-keys.ts`, `src/shared/api/endpoints.ts`, `src/shared/api/generated.d.ts`, `src/shared/api/api-types.ts`, `src/shared/lib/cn.ts`, `src/shared/lib/money.ts`, `src/shared/lib/pluralize.ts`, `src/shared/store/session-store.ts`, `src/shared/ui/` (button, input, label, radio-group, select, card, skeleton, alert); `npm run typecheck -w @checkout/web` — exit 0, `npm run build -w @checkout/web` — успех (2008 модулей, `dist/` собран)
- README: корневой `README.md` дополнен разделом «Фронтенд `@checkout/web` (решение)» (по `git diff --stat`: +73 строки, API-инструкции не вычищены); `apps/web/README.md` — короткий: Node 24 + npm 11, `npm run dev` (API) / `npm run dev -w @checkout/web` (Vite 5173, `VITE_API_URL`), `npm run build -w @checkout/web`, `npm run typecheck -w @checkout/web`, отсылка к корневому README за деталями решения
- package-lock.json: обновлён (по `git diff --stat HEAD -- package-lock.json`: 3922 insertions, 1434 deletions; зависимости `@checkout/web` — react, vite, tanstack-query, zustand и др. — зафиксированы в lockfile)

## Чеклист (живой прогон 2026-09-09, API 127.0.0.1:4000)

- A1: пройден — GET /api/products: 4 товара, clock-dot stock 0; PUT абсолют (повтор qty 1 не меняет корзину)
- A2: пройден — PUT {quantity:2} → qty 2, subtotal 498000 из GET /api/cart; итог фронта = cart.subtotal
- A3: пройден — options: pickup (point-center/point-north) + courier, card + cash_on_delivery; фронт берёт всё из API по id
- A4: пройден — pickup ship 0; курьер 39000 при subtotal < 500000, 0 при 747000; фронт рендерит shipping/total из quote
- A5: пройден — заказ card 201 awaiting_payment; sandbox: 2 карты с title + maskedNumber; фронт без PAN/CVC
- A6: пройден — simulation 202 → poll до succeeded; успех только по GET order paid/succeeded
- A7: пройден — заказ содержит номер/товары/доставку/total 249000; фронт рендерит из order
- A8: пройден — cash confirmed/unpaid; pay-попытка → 409 PAYMENT_NOT_REQUIRED; текст «Заказ оформлен, оплата при получении»
- B1: пройден — decline failed/CARD_DECLINED (HTTP 200) ≠ cancel cancelled; оба держат awaiting_payment; retry success на том же orderId → paid
- B2: пройден — replay key+body → 200 тот же id (order и payment); тот же ключ + другое тело → 409 IDEMPOTENCY_CONFLICT
- B3: не проверялся (нет браузера для F5) — реализован в коде: persist checkout.v1, resume GET order → GET payments → poll
- B4: пройден — будущая cartVersion → 409 CART_VERSION_CONFLICT; фронт: invalidate cart + новый quote, форма жива
- B5: частично — форма в Zustand + «Повторить» + generation-guard в коде; живой ретест позднего ответа не гонялся
- B6: пройден — пустой quote → 422 CART_EMPTY; qty 99 → 409 INSUFFICIENT_STOCK; clock-dot → 409; poll стоп на терминале/unmount (код)
- C1: пройден (код) — копии на месте, 34 совпадения grep; состояния различимы (skeleton/Alert/success-Card)
- C2: пройден (код) — label htmlFor у всех полей, ошибки NEED_INPUT-3=A, focus-visible, aria-live
- C3: не проверялся скриншотами — классы на месте (grid 1/2/3, sticky quote, w-full CTA, min-h-44, overflow-x hidden)
- D1: пройден — слои разделены, typecheck + vite build (2008 модулей) зелёные
- D2: пройден — fetch только в client.ts (grep пуст в pages/features), типы из generated.d.ts
- E1: пройден — README содержит ci/dev/build/сценарии/недоработки/время; package-lock.json обновлён; smoke 5/5 PASS

## Запреты

- apps/api не изменён: да (`git status --short -- apps/api` пуст, `git diff --stat` не содержит `apps/api`)
- корневые scripts не изменены: да (`git diff package.json` пуст; `dev`=`npm run build -w @checkout/contracts && npm run dev -w @checkout/api`, `build`=`npm run build -w @checkout/contracts && npm run build -w @checkout/api`, `check`=`npm run format:check && npm test && npm run docs:check`)
