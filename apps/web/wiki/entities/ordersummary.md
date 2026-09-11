---
title: OrderSummary
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/features/order/order-summary.tsx
confidence: high
hash: 8634125e3e238bb8
---

# OrderSummary

> Source: `apps/web/src/features/order/order-summary.tsx`

## Used in

- [[OrderPage]]
- [[OrderSuccessCard]]

## Description

Displays a summary of an order, including its items and delivery information.

## Props

| Prop | Type | Description |
|------|------|-------------|
| `order` | `Order` | The order object containing the items and delivery details to be summarized. |

## Event Handlers

### `deliveryText`

A handler function that computes the delivery-related text displayed in the order summary.

## Logic

The component receives an `order` prop and renders its summary using a `<div>` wrapper, a `<p>` for descriptive text, a `<ul>` with `<li>` items for the order contents, and `<span>` elements for inline information. The `deliveryText` handler is used to generate the delivery message shown to the user.

## Key Features

- Exported component for reuse.
- Renders order items in a list structure.
- Uses a dedicated handler to produce delivery text.
