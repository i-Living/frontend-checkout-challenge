---
title: PaymentPage
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/pages/payment-page.tsx
confidence: high
hash: e14489b539bb2fbe
---

# PaymentPage

> Source: `apps/web/src/pages/payment-page.tsx`

## Used in

- [[router]]

## Uses

- [[Skeleton]]
- [[Card]]
- [[CardPicker]]
- [[Alert]]
- [[MutationAlert]]
- [[Button]]

## Description

Renders the card payment page for the route `/orders/:orderId/pay`. Supports sandbox card selection, payment attempt creation/resume, payment status polling, and post-payment redirects. Cash orders are redirected away; only card payments are handled.

## Props

None. The component reads all data from route params, stores, and React Query hooks.

## State

| State | Type | Description |
|---|---|---|
| `selectedCardId` | `string \| null` | ID of the currently selected sandbox card. Initialized to `null` and auto-set to the first available card. |

## Effects

| Dependencies | Description |
|---|---|
| `[sandboxCards, selectedCardId]` | Auto-selects the first sandbox card when `selectedCardId` is `null` and cards are available. |
| `[isTerminal, orderId, queryClient]` | When the payment poll reaches a terminal state, refreshes the order data via `refreshOrderAfterPayment`. |
| `[payment?.status, orderId, queryClient, navigate]` | When `payment.status === 'succeeded'`, refreshes the order and navigates to `/orders/:orderId` with `replace: true`. |
| `[attempt.errorCode, orderId, queryClient, navigate]` | When `attempt.errorCode === 'ORDER_ALREADY_PAID'`, refreshes the order and navigates to `/orders/:orderId` with `replace: true`. |

## Event Handlers

| Handler | Description |
|---|---|
| `handlePay` | Starts a payment attempt. No-op if no card is selected or a payment is already processing. Calls `attempt.startPay(selectedCard.scenario)` using the scenario from the selected sandbox card. |
| `handleCancel` | Cancels the current payment attempt. No-op if the attempt is pending, the payment is terminal, or a payment is processing. Calls `attempt.startCancel()`. |

## Logic

1. **Order resolution** — Reads `orderId` from route params. If missing, redirects to the stored order's pay page, the latest order's pay page, or `/` as fallback.
2. **Guards** — Redirects to `/orders/:orderId` when:
   - The order's payment method is not `card`.
   - The order is already paid (`status === 'paid'` and `paymentStatus === 'succeeded'`).
   - `attempt.errorCode === 'PAYMENT_NOT_REQUIRED'`.
3. **Data loading** — Uses `queryGate` to render skeletons, errors, or not-found states for order, sandbox cards, and recovery orders queries.
4. **Payment attempt resolution** — Determines the effective payment ID in priority order:
   - `attempt.attemptPaymentId` (from the payment attempt hook)
   - `storedForThisOrder` (stored payment ID if it belongs to this order)
   - `resumeId` (first payment with status `pending` or `processing`)
5. **Polling** — Passes the effective payment ID to `usePaymentPoll`, which returns the payment object and a terminal flag.
6. **UI state derivation** — Computes flags from payment status and attempt error codes:
   - `isDeclined` / `isCancelled` — payment failed/cancelled.
   - `showRetry` — declined, cancelled, or `PAYMENT_FINALIZED`.
   - `showInProgress` — `PAYMENT_IN_PROGRESS`.
   - `showFinalized` — `PAYMENT_FINALIZED`.
   - `isProcessing` — attempt pending or payment pending/processing.
   - Generic pay/cancel errors are shown only for non-stale, unhandled error codes.

## Key Features

- **Sandbox card picker** — Renders `CardPicker` with sandbox cards; auto-selects the first card.
- **Payment attempt resume** — Resumes an existing pending/processing payment or a stored payment for the order.
- **Payment polling** — Polls payment status until a terminal state; refreshes order data afterward.
- **Post-payment redirect** — Navigates to the order page only after `payment.status === 'succeeded'`, not on attempt creation.
- **Retry flow** — Allows creating a new payment attempt after decline, cancellation, or finalized payment.
- **Cancel flow** — Cancels the attempt before payment starts; disabled during processing or terminal states.
- **Comprehensive alerts** — Distinct alert variants for declined, cancelled, in-progress, finalized, and generic errors.
- **Loading skeletons** — Accessible `PaymentSkeleton` with `aria-busy` and `role="status"` for loading states.
- **Query gating** — Centralized handling of loading, error, and not-found states via `queryGate`.
