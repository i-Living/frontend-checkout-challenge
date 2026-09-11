---
title: OrderSuccessCard
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/features/order/order-success-card.tsx
confidence: high
hash: 4ad345f351849ed7
---

# OrderSuccessCard

> Source: `apps/web/src/features/order/order-success-card.tsx`

## Used in

- [[OrderPage]]

## Uses

- [[Card]]
- [[OrderSummary]]

## Description
Displays an order confirmation summary inside a card, with a success icon, heading, supporting text, and order details.

## Logic
- Renders a `Card` as the root container.
- Uses a `div` and `span` layout to position the `CircleCheck` success icon.
- Presents an `h1` title and a `p` message.
- Wraps `OrderSummary` in `CardContent` to display the order details.

## Key Features
- Exported as a component.
- Composes `Card`, `CardContent`, and `OrderSummary` for a consistent order confirmation layout.
- Includes a `CircleCheck` icon for visual success feedback.
