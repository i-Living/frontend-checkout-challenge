---
title: CheckoutPage
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/pages/checkout-page.tsx
confidence: high
hash: 322745dca022e63a
---

# CheckoutPage

> Source: `apps/web/src/pages/checkout-page.tsx`

## Used in

- [[router]]

## Uses

- [[Skeleton]]
- [[MutationAlert]]
- [[CheckoutForm]]
- [[Button]]
- [[Card]]
- [[Alert]]

## Description

Page component for the `/checkout` route. Handles quote calculation and order creation. Redirects to `/cart` if the cart is empty. All monetary amounts are sourced from the quote, not the cart.

## State

| State | Type | Description |
|---|---|---|
| `errors` | `CheckoutFieldErrors` | Field validation errors, initialized to `{}`. Updated on submit and cleared incrementally via `handleDraftChange`. |
| `debouncedAddress` | `{ city, street, house, apartment }` | Debounced copy of the draft address, used for quote calculation. Initialized from the current draft. |

## Effects

| Effect | Dependencies | Purpose |
|---|---|---|
| Default method assignment | `[optionsQuery.data, draft.deliveryMethod, draft.paymentMethod, patchDraft]` | Sets the first available delivery method and payment method from checkout options when the corresponding draft field is empty. |
| Address debounce | `[draft.city, draft.street, draft.house, draft.apartment]` | Debounces address changes by 300 ms before updating `debouncedAddress`, preventing excessive quote requests. |

## Event Handlers

### `handleDraftChange(patch: Partial<CheckoutDraft>)`

Patches the draft in the session store and clears related field errors. Changing `deliveryMethod` removes address and pickup-point errors (they are mutually exclusive). Changing `name`, `email`, `phone`, `pickupPointId`, or address fields clears the corresponding error key.

### `handleSubmit(validData: CheckoutDraft)`

Validates the draft via `validateDraft`; if invalid, sets errors and aborts. If no quote is available, triggers a quote refetch. Otherwise builds a `CreateOrderBody` from the quote ID, payment method, and trimmed customer fields, obtains an idempotency key via `getOrCreateOrderKey`, and runs `createOrderMutation`.

## Logic

- **Quote gating**: Quote is enabled only when the cart has items, a cart version exists, and `effectiveDelivery` is non-null.
- **Effective draft**: For courier delivery, the debounced address is merged into the draft; otherwise the raw draft is used.
- **Order mutation**: On success, clears the idempotency key, stores the order ID, invalidates the cart, and navigates to `/orders/:id` (cash on delivery) or `/orders/:id/pay` (card).
- **Mutation error handling**: Maps server field errors into local state. Handles specific error codes:
  - `CART_VERSION_CONFLICT` / `CART_EMPTY` → invalidate cart
  - `QUOTE_EXPIRED` → refetch quote
  - `IDEMPOTENCY_CONFLICT` → clear idempotency key
- **Loading/error gate**: Uses `queryGate` with a `CheckoutSkeleton` for cart and options queries.
- **Empty cart**: Renders `<Navigate replace to='/cart' />`.
- **Fallback subtotal**: Uses `quote.subtotal` when available, otherwise `cart.subtotal`.
- **Quote error UI**: Shows a destructive alert with retry button; retry invalidates the cart first on `CART_VERSION_CONFLICT`.
- **Quote loading UI**: Shows a spinner with "Считаем доставку…" text.

## Key Features

- **Idempotent order creation**: A key derived from the request body prevents duplicate orders on double-click.
- **Session-persisted draft**: The checkout draft lives in the session store, surviving API errors and page refreshes.
- **Debounced quote calculation**: Address changes are debounced 300 ms to avoid excessive quote requests.
- **Sticky summary sidebar**: Two-column layout with a sticky "Итого" card on large screens.
- **Retry affordances**: Separate retry buttons for order creation failures and quote calculation failures.
- **Error-code-aware recovery**: Specific handling for cart version conflicts, empty carts, expired quotes, and idempotency conflicts.
