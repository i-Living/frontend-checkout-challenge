---
title: query-keys
created: 2026-09-12
updated: 2026-09-12
type: entity
tags:
  - util
  - exported
source: apps/web/src/shared/api/query-keys.ts
confidence: high
hash: hand
---

# query-keys

> Source: `apps/web/src/shared/api/query-keys.ts`

## Description

Single Query cache-key table. Pages and hooks must not build key arrays by hand — otherwise `invalidate*` and `queryFn` drift apart. Factory with no id = prefix (invalidate the whole group); with id = one entity.

`quoteByVersion` is separate from `quote(id)` so a late POST cannot overwrite a newer quote.

## Exports

`keys`:

- `products` / `cart` — catalog stock on cards depends on cart, so they are often invalidated together.
- `checkoutOptions` — delivery/payment labels; raise `staleTime` on the order summary.
- `quote(id?)` — prefix or one quote.
- `quoteByVersion(version, deliveryHash)` — POST quote key: cart version + delivery JSON.
- `order(id?)` — success UI reads this key, not the `201` from create-order.
- `payments(orderId?)` / `payment(id?)` — attempts; polling stops on a terminal status.
- `ordersList` / `sandbox` — restore order id after reload; test cards without PAN/CVC.

See also [[invalidate]] and [[queries]].
