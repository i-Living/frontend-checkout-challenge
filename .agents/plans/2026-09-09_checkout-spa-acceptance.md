# Приёмка Checkout SPA
## Пакет
- apps/web: Vite SPA `@checkout/web`, исходники в `apps/web/src` (`pages`, `features`, `shared`)
- README: корневой `README.md` есть — `npm ci`, `npm run dev` (API), `npm run dev -w @checkout/web`, `npm run build -w @checkout/web` / `npm run build`; время NEED_INPUT
- package-lock.json: есть в корне, отличается от HEAD (зависимости web)
## Чеклист
- A1: не проверялся — код есть, UI не гоняли
- A2: не проверялся — код есть, UI не гоняли
- A3: не проверялся — код есть, UI не гоняли
- A4: не проверялся — код есть, UI не гоняли
- A5: не проверялся — код есть, UI не гоняли
- A6: не проверялся — код есть, UI не гоняли
- A7: не проверялся — код есть, UI не гоняли
- A8: не проверялся — код есть, UI не гоняли
- B1: не проверялся — код есть, UI не гоняли
- B2: не проверялся — код есть, UI не гоняли
- B3: не проверялся — код есть, UI не гоняли
- B4: не проверялся — код есть, UI не гоняли
- B5: не проверялся — код есть, UI не гоняли
- B6: не проверялся — код есть, UI не гоняли
- C1: не проверялся — код есть, UI не гоняли
- C2: не проверялся — код есть, UI не гоняли
- C3: не проверялся — код есть, UI не гоняли
- D1: пройден — слои `pages`/`features`/`shared`/`api`; суммы из полей API (`price`, `lineTotal`, `subtotal`, `shipping`, `total`)
- D2: пройден — единственный `fetch(` в `apps/web/src/shared/api/client.ts`; в `pages`/`features` нет `fetch(`
- E1: не проверялся — README содержит ci/dev API/dev web/build, время NEED_INPUT; свежий клон и UI-сценарии не гонялись
## Запреты
- apps/api не изменён: да
- корневые scripts не изменены: да
