# @checkout/web

React + Vite SPA. Общее описание решения, сценарии и недоработки — в [корневом README](../../README.md).

## Запуск

Из корня репозитория, после `npm ci`. API в другом терминале: `npm run dev` (`127.0.0.1:4000`).

```sh
npm run dev -w @checkout/web
```

Vite: [http://localhost:5173](http://localhost:5173).

## Сборка

```sh
npm run build -w @checkout/web
```

HTTP-клиент (D2): `apps/web/src/shared/api/client.ts` (+ `errors.ts`, `endpoints.ts`).
