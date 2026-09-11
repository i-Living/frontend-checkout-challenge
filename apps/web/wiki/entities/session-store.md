---
title: session-store
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - store
  - internal
source: apps/web/src/shared/store/session-store.ts
confidence: low
hash: e55141c41793362d
---

# session-store

> Source: `apps/web/src/shared/store/session-store.ts`


## Description

Client-side tab state for the checkout flow: bearer token, current order/payment IDs, checkout form draft, and idempotency keys for safe network retries. Persisted to `sessionStorage` under `checkout.v1`, so an F5 restores the state but closing the tab clears it. Server state (cart, order) is intentionally kept out of this store.

## Initial State

| Field | Initial value |
|---|---|
| `token` | `null` |
| `orderId` | `null` |
| `paymentId` | `null` |
| `draft` | `emptyDraft` — all fields empty strings |
| `lastOrder` | `null` |
| `lastPayment` | `null` |

`emptyDraft` fields: `name`, `email`, `phone`, `deliveryMethod`, `paymentMethod`, `pickupPointId`, `city`, `street`, `house`, `apartment` — all `''`.

## Actions

| Action | Parameters | Description |
|---|---|---|
| `setToken` | `token: string` | Sets the bearer token from `POST /api/sessions`. Must not be called with a session id. |
| `clearToken` | — | Resets `token` to `null`. Used before retrying `ensureSession` after a `401 SESSION_*` error. |
| `setOrder` | `orderId: string \| null` | Sets the current order id. `null` clears it when resume is no longer needed. |
| `setPayment` | `paymentId: string \| null` | Sets the current payment attempt id. `null` prevents polling a stale payment after a new order is created. |
| `patchDraft` | `patch: Partial<CheckoutDraft>` | Merges partial draft fields into the current draft. Does not overwrite omitted fields. |
| `setLastOrder` | `entry: LastOrderEntry \| null` | Stores the last order key and body for idempotent retries. `null` clears after success or `IDEMPOTENCY_CONFLICT`. |
| `setLastPayment` | `entry: LastPaymentEntry \| null` | Stores the last payment key, order id, and body for idempotent retries. `null` clears after success or `PAYMENT_FINALIZED`. |

## Effects

- The `persist` middleware writes the whole store state to `sessionStorage` on every change.
- On page reload, persisted state is rehydrated from `sessionStorage` under the key `checkout.v1`.
- Closing the tab removes the persisted state because `sessionStorage` is scoped to the tab session.

## Subscriptions

- React components can subscribe with the hook: `useSessionStore((state) => state.token)`.
- Outside React, use `useSessionStore.subscribe(listener)` to receive state updates.
- The store is exposed as `useSessionStore`.
