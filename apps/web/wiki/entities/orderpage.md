---
title: OrderPage
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/pages/order-page.tsx
confidence: high
hash: a76eeef5996f9ca7
---

# OrderPage

> Source: `apps/web/src/pages/order-page.tsx`

## Used in

- [[router]]

## Uses

- [[Skeleton]]
- [[Alert]]
- [[Button]]
- [[OrderSuccessCard]]
- [[OrderSummary]]

## Description

`OrderPage` is the page component for the `/orders/:orderId` route. It displays order details and handles payment-state-specific UI: success confirmation, pending payment polling, and failed/cancelled payment recovery. Success is determined exclusively from the GET order response — card orders require `paid` + `succeeded`; cash-on-delivery orders require `confirmed` + `unpaid`. Creation status or succeeded payment events alone do not lead to the success screen.

## Logic

1. **Page title** — `usePageTitle('Заказ')` sets the document title.
2. **Order ID** — retrieved via `useParams()`.
3. **Order query** — `useOrder(orderId, pollFn)` fetches the order. The polling callback returns `2000` ms only when the order exists and is in `awaiting_payment` + `pending` state; otherwise it returns `false` (no polling).
4. **Missing orderId** — renders a destructive alert with a link back to the catalog.
5. **Query gate** — `queryGate(orderQuery, ...)` handles loading, error, and not-found states, rendering `<OrderSkeleton />` during loading.
6. **Success conditions**:
   - `isCardSuccess`: `paymentMethod === 'card' && status === 'paid' && paymentStatus === 'succeeded'`
   - `isCashSuccess`: `paymentMethod === 'cash_on_delivery' && status === 'confirmed' && paymentStatus === 'unpaid'`
   - Both render `<OrderSuccessCard>` with a state-specific title and description.
7. **Pending payment** — `awaiting_payment` + `pending` renders a spinner with "Оплата ещё обрабатывается" and a link to `/orders/:orderId/pay`.
8. **Failed/cancelled/unpaid payment** — `awaiting_payment` with `failed`, `cancelled`, or `unpaid` renders `<OrderSummary>` and a link back to payment.
9. **Default** — renders `<OrderSummary>` for all other states.

## Key Features

- **Polling only while pending** — avoids unnecessary requests once the payment reaches a terminal state.
- **Server-driven success** — success UI is based on the GET order response, not on client-side store data.
- **Graceful missing-ID handling** — shows an error alert instead of crashing.
- **Consistent async states** — uses `queryGate` with a custom `OrderSkeleton` for loading/error/not-found.
- **Payment recovery** — provides "Вернуться к оплате" links for pending and failed/cancelled/unpaid states.
- **Accessibility** — loading skeleton has `role="status"`; pending indicator uses `aria-live="polite"`.
