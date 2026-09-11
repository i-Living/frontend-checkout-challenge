---
title: ProductCard
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/features/catalog/product-card.tsx
confidence: high
hash: 89c3525f4fa69b48
---

# ProductCard

> Source: `apps/web/src/features/catalog/product-card.tsx`

## Used in

- [[CatalogPage]]

## Uses

- [[Card]]
- [[ProductVisual]]
- [[Button]]

## Description

`ProductCard` displays a catalog product with its visual, title, description, price, stock status, and cart controls. It receives the current cart quantity from the parent and does not perform any API calls itself.

## Props

| Prop | Type | Description |
|------|------|-------------|
| `product` | `Product` | Catalog product object; `price` and `stock` come from the server. |
| `quantityInCart` | `number` | Current quantity in the cart. `0` shows the “Add to cart” button; `>0` shows a stepper. |
| `onAdd` | `() => void` | Called when the first unit is added to the cart. Should perform `PUT quantity = 1`, not increment from zero. |
| `onQuantity` | `(quantity: number) => void` | Called with an absolute quantity value when the stepper is used. |
| `onRemove` | `() => void` | Called when the item is removed from the cart. Should perform `DELETE`, not `PUT 0`. |
| `isPending` | `boolean` | Disables controls for this card while a mutation for this specific `productId` is in flight. |

## Event Handlers

The component does not define named internal handlers. It passes inline `onClick` handlers to buttons:

- **Add to cart button**: invokes `onAdd`.
- **Decrease button**: invokes `onQuantity(quantityInCart - 1)`, disabled when `quantityInCart <= 1` or `isPending`.
- **Increase button**: invokes `onQuantity(quantityInCart + 1)`, disabled when `quantityInCart >= product.stock` or `isPending`.
- **Remove button**: invokes `onRemove`, disabled when `isPending`.

## Logic

- `outOfStock = product.stock === 0` — if true, renders a disabled “Out of stock” button and hides the stock badge.
- `inCart = quantityInCart > 0` — if true, renders a stepper with quantity display, plus/minus buttons, and a remove button.
- If not in cart and not out of stock, renders an “Add to cart” button.
- The stepper’s plus button is disabled when `quantityInCart >= product.stock`.
- The minus button is disabled when `quantityInCart <= 1`.
- All controls are disabled while `isPending` is true; the add button label changes to “Adding…”.
- Price is formatted with `formatMoney`.

## Key Features

- Handles out-of-stock, empty cart, and in-cart states with distinct UI.
- Stepper enforces stock limits and minimum quantity of 1.
- Pending state prevents duplicate mutations and gives visual feedback.
- Accessible labels for quantity adjustment and removal actions.
- Responsive layout with wrapping and flexible card structure.
