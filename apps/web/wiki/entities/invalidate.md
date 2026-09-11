---
title: invalidate
created: 2026-09-11
updated: 2026-09-12
type: entity
tags:
  - util
  - exported
source: apps/web/src/shared/api/invalidate.ts
confidence: high
hash: hand
---

# invalidate

> Source: `apps/web/src/shared/api/invalidate.ts`

## Description

Cache reset helpers keyed through `query-keys.ts`. Pages must not call `invalidateQueries` with a raw array.

## Exports

- `invalidateCart` — cart only. Does not touch the catalog (stock on cards would go stale after a remove).
- `invalidateProducts` — catalog only. Do not call after a cart change; use `invalidateCartAndProducts`.
- `invalidateCartAndProducts` — cart + catalog together: cards show remaining stock, which depends on cart contents.
- `invalidateQuotes` — all quotes (`keys.quote()` is a prefix, not one UUID).
- `invalidateOrder(orderId)` — one order, after a terminal payment so success UI is not stuck on `awaiting_payment`.
- `invalidatePayments(orderId)` — payment attempts for an order (resume pending/processing after reload).
- `invalidatePayment(paymentId)` — one attempt, so polling picks up the new status.
- `invalidateOrderAndPayments(orderId)` — order + attempts after `succeeded|failed|cancelled` or `ORDER_ALREADY_PAID`.
