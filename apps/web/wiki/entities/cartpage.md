---
title: CartPage
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/pages/cart-page.tsx
confidence: high
hash: 4386448941b5cca1
---

# CartPage

> Source: `apps/web/src/pages/cart-page.tsx`

## Used in

- [[router]]

## Uses

- [[Skeleton]]
- [[Card]]
- [[Button]]
- [[MutationAlert]]
- [[CartLine]]

## Description

`CartPage` renders the `/cart` route. It displays the user's cart with line items, quantity controls, stock limits, and an order summary showing the subtotal from the API. Empty carts show a catalog CTA; checkout is only reachable when the cart is non-empty and no mutation is in flight. The component accepts no props.

## Event Handlers

| Handler | Signature | Description |
|---|---|---|
| `onQuantity` (passed to `CartLine`) | `(quantity: number) => void` | Calls `setQuantityMutation.mutate({ productId: item.productId, quantity })` to update the line quantity. |
| `onRemove` (passed to `CartLine`) | `() => void` | Calls `removeMutation.mutate(item.productId)` to remove the line from the cart. |

## Logic

- **Data fetching**: `useCart()` and `useProducts()` fetch cart and product data. A `useMemo` builds a `stockById` Map from products for stock lookup.
- **Loading/error gating**: `queryGate(cartQuery, ...)` returns a skeleton or error UI; if blocked, the component returns early.
- **Empty state**: if `cart` is missing or `cart.items.length === 0`, renders an empty-cart card with a "Вернуться в каталог" link.
- **Mutation state**: `mutationError` combines errors from both mutations; `isMutating` is true when either mutation is pending.
- **Row pending**: `isRowPending` checks whether the pending mutation's `variables` match the current line's `productId`.
- **Checkout button**: disabled while `isMutating` to avoid navigating to checkout with a stale cart version; otherwise links to `/checkout`.
- **Order summary**: shows item count with pluralization and subtotal via `formatMoney`.

## Key Features

- Skeleton loading state (`CartSkeleton`) with `role="status"` on the list container.
- Empty cart state with icon and catalog CTA.
- Per-line pending indicators during quantity/remove mutations.
- Mutation error alert via `MutationAlert`.
- Checkout button disabled during mutations.
- Sticky order summary on large screens (`lg:sticky lg:top-24`).
- Stock limits sourced from the products API, defaulting to 99 when unknown.
