# Frontend Checkout Challenge — Project conventions for AI agents

## Project overview

Take-home frontend task: catalog, cart, checkout, and test-card payment. The API is already in the repo. Add the store UI in `apps/web`.

Assignment / API / scoring: `docs/ASSIGNMENT.md`, `docs/INTEGRATION.md`, `docs/EVALUATION.md`. OpenAPI: `docs/openapi.json`. Live Swagger: `http://localhost:4000/docs/`.

**Stack:** npm workspaces monorepo. Node 24 + npm 11. Backend `@checkout/api` (Fastify 5, file store). Shared TypeBox schemas in `@checkout/contracts`. Frontend `@checkout/web` (React + Vite).

---

## Monorepo structure

Do not rename packages or move to `backend/` + `frontend/`. Keep this layout:

```
frontend-checkout-challenge/
├── apps/api/              # Fastify API — do not modify
├── apps/web/              # React + Vite SPA `@checkout/web`
├── packages/contracts/    # TypeBox schemas + TS types — do not modify
├── docs/                  # Assignment, integration, evaluation, openapi.json
├── scripts/               # openapi/smoke/reset
├── biome.json             # Shared Biome config (apps/web/src)
├── .husky/                # pre-commit: lint-staged → tsc api → tsc web → build
├── .github/workflows/     # CI: npm ci → check → start + smoke
└── package.json           # Root scripts (dev, build, check, generate:api-types)
```

---

## Package manager & CLI

- Always use **npm** (`npm ci`, `npm run`, `npm exec`). Never bun, yarn, pnpm, or npx for project binaries.
- Root scripts orchestrate workspaces: `npm run check`, `npm run build`.
- `npm run dev` starts the **API only** (`127.0.0.1:4000`). The web app runs in a second terminal: `npm run dev -w @checkout/web` (Vite, port 5173).
- Web dev/build/typecheck scripts live in `apps/web/package.json`. After changing frontend dependencies, refresh the root `package-lock.json`. Do not change root scripts without asking.

| Script | Command |
|---|---|
| install | `npm ci` |
| dev | `npm run dev` |
| build | `npm run build` |
| start | `npm start` |
| check | `npm run check` (biome + api tests + web typecheck/build + openapi) |
| check:web | `npm run check:web` (web typecheck + vite build) |
| test | `npm test` |
| smoke | `npm run smoke` (API already running) |
| format | `npm run format` (`biome check --write`) |
| generate:api-types | `npm run generate:api-types` |
| data:reset | `npm run data:reset` (stop the API first) |

Use `./node_modules/.bin/biome` or `npm run format` — never `npx biome` (wrong version).

---

## Linting & formatting (Biome)

- Single `biome.json` at root covers `apps/web/src/` (excludes `generated.d.ts`).
- Do **not** run Biome on `apps/api/` or `packages/contracts/` — provided code, do not reformat.
- Enable Biome as default formatter in editor, format on save.
- Manual check: `npm run check` (includes `biome check`).
- Pre-commit: lint-staged runs `biome check --write` on staged web files.

**Biome conventions:**
- Indent: 4 spaces, LF line endings, 120 char width
- Single quotes, no semicolons, trailing commas
- `noUnusedVariables: error`, `useExhaustiveDependencies: warn`
- JSX: single quotes, self-closing when possible
- Avoid template literal ternaries for className → use `cn()` from utils
- Do not change `biome.json` without explicit permission

---

## Pre-commit hooks (husky + lint-staged)

Before every commit, the following checks run automatically (in order):

1. **Lint-staged** — Biome formats and lints staged `apps/web/src` files
2. **TypeScript (web)** — `npm run typecheck -w @checkout/web`
3. **Build (web)** — `npm run build -w @checkout/web`
4. **Build (contracts + api)** — `npm run build`

If any step fails, the commit is blocked. Do not skip formatting or type errors.
Never use `git commit --no-verify`. If a pre-commit hook fails, investigate and fix the underlying issue.

---

## API types workflow (auto-generated)

Types come from OpenAPI. Do not hand-write TypeScript interfaces for API responses.

1. Do not edit `apps/api` or `packages/contracts`
2. OpenAPI file: `docs/openapi.json` (refresh only if asked: `npm run docs:generate`)
3. `npm run generate:api-types` — produces `apps/web/src/shared/api/generated.d.ts`
4. Frontend imports from `src/shared/api/api-types` (re-exports) or `src/shared/api/generated`

Never edit `generated.d.ts`. After OpenAPI changes, regenerate before using new fields.

HTTP layer (evaluation D2): one module for base URL, `Authorization`, JSON/`204`, and error mapping. Pages must not copy fetch setup.

---

## Git workflow

- `origin` — `https://github.com/i-Living/frontend-checkout-challenge` (this fork)
- `upstream` — `instatdigital/frontend-checkout-challenge`
- Work on `main` unless a new branch is requested (create it **before** code).
- Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- Long plans: `.agents/plans/`, not a Telegram wall of text.
- Commit/push only when asked. Do not switch branches unless asked.

---

## Environment & secrets

- Copy `.env.example` → `.env` only if the default port is taken. No SOPS, no extra API keys.
- Defaults: `HOST=127.0.0.1`, `PORT=4000`, `PAYMENT_DELAY_MS=1200`. Optional `DATA_FILE`, `CORS_ORIGINS`.
- Store file: `.data/store.json`. One API process per file. Reset: stop server, `npm run data:reset`, then a new session.
- Frontend may use any localhost HTTP port; extra origins go in `CORS_ORIGINS`. Auth is a header, not cookies.

---

## Key architecture decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Package manager | npm 11 workspaces | Repo `engines`; lockfile is `package-lock.json` |
| Node | 24.x (`.nvmrc`) | Required by the challenge |
| Backend framework | Fastify 5 + TypeBox | Provided; do not change |
| Frontend framework | React + Vite | Assignment allows Vite or Next; no SSR; session is a client token |
| State management | Zustand + TanStack Query | Query for cart/quote/order/payment; Zustand for UI |
| Styling | TailwindCSS v4 | Viewports 1280 and 390; no extra PostCSS stack |
| UI Kit | shadcn/ui + lucide-react | Labels, field errors, keyboard-usable form |
| Auth | `Authorization: Bearer <token>` | `POST /api/sessions`; no cookies, no `credentials: include` |
| Persistence | `.data/store.json` | No database, no Redis |
| API types | openapi-typescript from `docs/openapi.json` | Generated `generated.d.ts`; never hand-write response types |
| Linting | Biome | Single tool replaces Prettier; `apps/web/src` only |
| Testing | `node --test` in `apps/api/test` | Root `npm test` builds then runs them |
| HTTP smoke | `scripts/smoke.mjs` | Purchase, decline, cancel, retry |
| CI | `.github/workflows/check.yml` | check + live smoke |
| Money | Integer kopecks, `RUB` | Display API amounts; do not invent totals |
| Payments | Sandbox cards from `GET /api/sandbox` | No real PAN/CVC |

---

## Pitfalls

- `PUT /api/cart/items/:id` quantity is **absolute**, not an increment.
- `204` has no body — do not call `response.json()`.
- Card decline is HTTP 200 with `data.status=failed` / `failureCode=CARD_DECLINED`. Cancel leaves the order; retry = new payment + new idempotency key.
- Quote is bound to `cartVersion` and lasts 10 minutes. Cart/delivery change → new quote. `409 CART_VERSION_CONFLICT` / `QUOTE_EXPIRED` → refresh and continue.
- `POST /api/orders` and `POST .../payments` require `Idempotency-Key`. Network retry: same body+key. New attempt: new key. Creating an order clears the cart.
- Success UI only from the **order** on the server (`paid`, or cash `confirmed` + `unpaid`). Never treat `201` as paid.
- Stop payment polling on `succeeded|failed|cancelled` or leaving the page. A late response must not overwrite newer data.
- Swagger Authorize: paste the token **without** the word `Bearer`.
- Do not implement ETag/If-Match caching; not required for the frontend task.
- Viewport check: 1280 and 390px; labelled fields; keyboard-usable form.
- `npx biome` / `npx lint-staged` install the wrong version — use `npm run` or `./node_modules/.bin/`.
