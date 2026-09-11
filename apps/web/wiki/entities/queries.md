---
title: queries
created: 2026-09-11
updated: 2026-09-12
type: entity
tags:
  - hook
  - exported
source: apps/web/src/shared/api/queries.ts
confidence: high
hash: hand
---

# queries

> Source: `apps/web/src/shared/api/queries.ts`

## Description

React Query read hooks. Pages do not pass `queryKey`/`queryFn` — they only read `data`/`status`. Mutations live in `features/*` and own their invalidation.

Empty `cart.items` is a valid response, not an error. `stock=0` is “out of stock”, not a load error. Order success comes from the server order, not from `201` of create-order.

## Exports

- `useCart()` — session cart.
- `useProducts()` — catalog, no token.
- `useCheckoutOptions(staleTime?)` — delivery/payment labels and pickup points. Pass `60_000` on the order summary so options are not refetched every visit.
- `useOrder(orderId, refetchInterval?)` — server order; disabled without `orderId`.
- `useOrdersList(enabled?)` — session orders, for “last order” when id is missing.
- `usePayments(orderId, enabled?)` — attempts, newest first. `enabled: false` for cash orders.
- `useSandbox(enabled?)` — test cards (title + mask, no PAN/CVC). Off until the order is card.
