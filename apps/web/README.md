# `@checkout/web` — фронтенд

React + Vite + TypeScript. Условия: [задание](../../docs/ASSIGNMENT.md). API: [интеграция](../../docs/INTEGRATION.md). [Критерии оценки](../../docs/EVALUATION.md).

Требования: Node 24 + npm 11. Установка из корня репозитория: `npm ci`.

## Запуск

Терминал 1 — API (из корня):

```sh
npm run dev
```

API: `127.0.0.1:4000`.

Терминал 2 — фронтенд:

```sh
npm run dev -w @checkout/web
```

Откройте `http://localhost:5173/`. Базовый URL API — через `VITE_API_URL` (по умолчанию `http://127.0.0.1:4000`).

## Сборка и проверки

```sh
npm run build -w @checkout/web
npm run typecheck -w @checkout/web
npm test -w @checkout/web
```

Vitest + Testing Library покрывают HTTP-клиент, идемпотентность, сессию, поллинг оплаты, правила checkout и экраны каталога/корзины/оформления/оплаты/заказа. Тесты лежат в `apps/web/src/test/` и повторяют структуру исходников.

Подробности решения (Query vs Zustand, HTTP-клиент D2, сценарии A/B, недоработки, время) — в разделе «Фронтенд `@checkout/web` (решение)» корневого `README.md`.
