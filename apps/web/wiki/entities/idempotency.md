---
title: idempotency
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - util
  - internal
source: apps/web/src/shared/api/idempotency.ts
confidence: low
hash: d34679416d9c75e4
---

# idempotency

> Source: `apps/web/src/shared/api/idempotency.ts`


## Description

Internal utility module (not exported) for managing idempotency keys associated with order and payment operations. It provides functions to generate new idempotency keys, retrieve or create keys for specific orders/payments, and clear stored keys. These helpers are typically used to ensure that API requests are processed exactly once.

## Parameters

### `newIdempotencyKey`

- No parameters.

### `getOrCreateOrderKey`

- `orderId` (string): Unique identifier of the order.
- `storage` (object, optional): Key-value storage adapter used to persist the idempotency key. If omitted, a default in-memory store is assumed.

### `getOrCreatePaymentKey`

- `paymentId` (string): Unique identifier of the payment.
- `storage` (object, optional): Key-value storage adapter used to persist the idempotency key. If omitted, a default in-memory store is assumed.

### `clearOrderKey`

- `orderId` (string): Unique identifier of the order whose idempotency key should be removed.
- `storage` (object, optional): Storage adapter containing the key. If omitted, the default in-memory store is assumed.

### `clearPaymentKey`

- `paymentId` (string): Unique identifier of the payment whose idempotency key should be removed.
- `storage` (object, optional): Storage adapter containing the key. If omitted, the default in-memory store is assumed.

## Return Value

- `newIdempotencyKey`: Returns a `string` — a newly generated unique idempotency key.
- `getOrCreateOrderKey`: Returns a `string` — the existing idempotency key for the order, or a newly generated and stored key if none existed.
- `getOrCreatePaymentKey`: Returns a `string` — the existing idempotency key for the payment, or a newly generated and stored key if none existed.
- `clearOrderKey`: Returns `void` or `boolean` — indicates whether the key was successfully removed.
- `clearPaymentKey`: Returns `void` or `boolean` — indicates whether the key was successfully removed.

## Algorithm

1. **`newIdempotencyKey`**  
   Generates a cryptographically random unique string (e.g., UUID v4) and returns it.

2. **`getOrCreateOrderKey`**  
   - Checks the storage for an existing key associated with `orderId`.  
   - If found, returns the stored key.  
   - If not found, calls `newIdempotencyKey()`, stores the result under `orderId`, and returns the new key.

3. **`getOrCreatePaymentKey`**  
   - Same algorithm as `getOrCreateOrderKey`, but scoped to `paymentId`.

4. **`clearOrderKey`**  
   - Deletes the entry associated with `orderId` from the storage.  
   - Returns success/failure based on whether deletion occurred.

5. **`clearPaymentKey`**  
   - Same algorithm as `clearOrderKey`, but scoped to `paymentId`.

## Complexity

- **Time:** O(1) for all operations, assuming storage access (get/set/delete) is O(1).
- **Space:** O(1) additional space per operation, aside from the generated key itself.

## Limitations

- Exact parameter names and storage behavior are inferred from the AST signatures; the actual implementation may differ.
- The module is not exported, so it is intended for internal use only.
- If the storage adapter is not concurrency-safe, simultaneous calls for the same order/payment ID may produce duplicate keys.
- Clearing a key while an operation using that key is still in flight may break idempotency guarantees.
- The default storage mechanism (if any) is not specified; keys may be lost on process restart unless a persistent adapter is provided.
