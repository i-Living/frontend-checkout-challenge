---
title: usePaymentAttempt
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - hook
  - internal
source: apps/web/src/features/payment/use-payment-attempt.ts
confidence: low
hash: a31381ce614f1b9f
---

# usePaymentAttempt

> Source: `apps/web/src/features/payment/use-payment-attempt.ts`


## Description

`usePaymentAttempt` manages the lifecycle of a payment attempt for a given order. It combines payment creation and sandbox simulation into a single mutation, using one Idempotency-Key to prevent duplicate payments on double-click. The hook tracks the current attempt, polling interval, and last user action, and exposes controls to start payment or cancellation. It also handles stale responses from previous attempts and invalidates relevant React Query cache entries.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `orderId` | `string \| undefined` | Order UUID from the route. Required for the mutation to start; if `undefined`, the mutation throws. |

## Return Value

Returns an object of type `PaymentAttempt`:

| Property | Type | Description |
|----------|------|-------------|
| `isPending` | `boolean` | Whether the payment mutation is currently in flight. |
| `error` | `unknown` | The latest mutation error, if any. |
| `errorCode` | `string \| null` | Extracted error code from the mutation error, or `null`. |
| `lastAction` | `PaymentAction \| null` | Last user action: `'pay'` or `'cancel'`. |
| `attemptPaymentId` | `string \| null` | ID of the created payment, set after successful mutation. |
| `pollIntervalMs` | `number` | Polling interval in milliseconds, derived from the simulation response or default `800`. |
| `isStaleError` | `boolean` | `true` if the current error is a stale attempt error (i.e., a late response from a previous attempt). |
| `startPay` | `(scenario: SimulationScenario) => void` | Starts a payment attempt with the given sandbox scenario. |
| `startCancel` | `() => void` | Starts a cancellation attempt. |

## Internal State

- `attemptPaymentId` (`useState<string | null>`) — stores the ID of the created payment after a successful mutation.
- `pollIntervalMs` (`useState<number>`) — stores the polling interval; initialized to `800`, updated from the simulation response.
- `lastAction` (`useState<PaymentAction | null>`) — stores the last user action (`'pay'` or `'cancel'`).
- `generationRef` (`useRef<number>`) — internal counter used to discard stale in-flight responses when the user starts a new attempt.

## Side Effects

- On mutation success:
  - Clears the idempotency key.
  - Updates `pollIntervalMs` and `attemptPaymentId`.
  - Sets the payment ID in the session store.
  - Invalidates payment queries for the payment ID and, if `orderId` exists, for the order.
- On mutation error:
  - If the error code is `PAYMENT_FINALIZED`, clears the idempotency key.
  - If the error code is `PAYMENT_FINALIZED` or `PAYMENT_IN_PROGRESS` and `orderId` exists, invalidates payment queries for the order.
- In `start`:
  - If the previous error was `PAYMENT_FINALIZED` and `orderId` exists, clears the idempotency key and invalidates payment queries.
  - Increments `generationRef` to invalidate any in-flight mutation from a previous attempt.
  - Sets `lastAction` and triggers the mutation.

## Usage Notes

- The hook uses a single mutation for both `pay` and `cancel` actions, distinguished by the `scenario` argument. This ensures only one Idempotency-Key is used, avoiding duplicate payment risk on double-click.
- `isStaleAttemptError` is an exported helper that checks whether an error message equals `'stale'`. It is used to suppress the “payment failed” alert for late responses from previous attempts.
- The `generationRef` mechanism discards results from outdated attempts: if the user starts a new attempt before the previous one finishes, the old mutation throws a `'stale'` error and its `onSuccess` is not applied.
- `refreshOrderAfterPayment` is an exported utility that invalidates order and payment queries after a terminal payment status or `ORDER_ALREADY_PAID`, ensuring the success page does not show stale `awaiting_payment` data.
- The hook relies on `useSessionStore` to persist the payment ID globally.
- `orderId` is required for the mutation; if it is `undefined`, the mutation function throws via `orThrow`.
