---
title: CartLine
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/features/cart/cart-line.tsx
confidence: high
hash: 76eeee33c624a0e6
---

# CartLine

> Source: `apps/web/src/features/cart/cart-line.tsx`

## Used in

- [[CartPage]]

## Uses

- [[Label]]
- [[Button]]
- [[Input]]

## Description

Renders a single cart line item with a quantity stepper and input. The quantity is committed as an absolute value on blur or Enter; the local draft is never sent to the server until committed.

## Props

| Prop | Type | Description |
|------|------|-------------|
| `item` | `CartLineItem` | Cart item from `GET /api/cart` (not catalog data). Contains `productId`, `title`, `unitPrice`, `lineTotal`, `quantity`. |
| `stock` | `number` | Optional remaining stock from catalog. Defaults to `99` as a fallback ceiling. |
| `onQuantity` | `(absolute: number) => void` | Called with the clamped absolute quantity on commit. Not a delta. |
| `onRemove` | `() => void` | Called when the remove button is clicked. |
| `isPending` | `boolean` | Disables the input and buttons for this line while a PUT/DELETE request is in flight. |

## State

| State | Type | Description |
|-------|------|-------------|
| `draft` | `string` | Local editable quantity string, initialized from `item.quantity`. |

## Effects

| Effect | Dependency | Description |
|--------|------------|-------------|
| `setDraft(String(item.quantity))` | `item.quantity` | Synchronizes the draft with the server value when the quantity changes externally. |

## Event Handlers

### `commit(value: number)`

- If `value` is not finite, resets the draft to `item.quantity` without making a request.
- Clamps the value to `1…max` (where `max = Math.max(1, Math.min(99, stock))`), truncating decimals.
- Updates the draft to the clamped value.
- Calls `onQuantity(clamped)` only if the clamped value differs from `item.quantity`.

### Inline handlers

- **Minus button `onClick`**: calls `onQuantity(item.quantity - 1)`, disabled when `isPending` or `item.quantity <= 1`.
- **Plus button `onClick`**: calls `onQuantity(item.quantity + 1)`, disabled when `isPending` or `item.quantity >= max`.
- **Input `onChange`**: updates `draft` with the raw input value.
- **Input `onBlur`**: calls `commit(event.target.valueAsNumber)`.
- **Input `onKeyDown`**: on `Enter`, calls `commit(event.currentTarget.valueAsNumber)`.
- **Remove button `onClick`**: calls `onRemove`, disabled when `isPending`.

## Logic

- `max` is derived from `stock`, clamped to `1…99`.
- The input is `type="number"` with `min={1}` and `max={max}`.
- The plus button is disabled at the upper bound; the minus button is disabled at the lower bound.
- `lineTotal` and `unitPrice` are taken directly from the server; no client-side price calculation.
- The component uses a local draft so typing does not trigger requests until blur or Enter.

## Key Features

- Absolute quantity commit, not delta-based.
- Local draft state with commit on blur/Enter.
- NaN input falls back to the server quantity without a request.
- Clamping to `1…max` with stock-aware upper limit.
- Per-line pending state disables all controls.
- Accessible labels and screen-reader-only hint for the quantity range.
