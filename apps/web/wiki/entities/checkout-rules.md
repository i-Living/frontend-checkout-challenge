---
title: checkout-rules
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - util
  - exported
source: apps/web/src/features/checkout/checkout-rules.ts
confidence: medium
hash: 2007201a29e1a4fe
---

# checkout-rules

> Source: `apps/web/src/features/checkout/checkout-rules.ts`


## Description

Client-side checkout validation, delivery payload construction for quote requests, and mapping of server `VALIDATION_ERROR` responses to form field errors. Monetary amounts are intentionally not handled here; they come exclusively from the quote API.

## Exports

- `FIELD_MESSAGES` — constant map of field names to user-facing validation messages.
- `validateDraft`
- `buildDelivery`
- `toOrderErrorMessage`
- `toServerFieldErrors`

---

## `validateDraft`

### Description

Performs client-side validation of a checkout draft before submitting an order. An empty error map means the draft is valid and the order can be built.

### Parameters

| Name   | Type             | Description                                      |
| ------ | ---------------- | ------------------------------------------------ |
| `draft`| `CheckoutDraft`  | Draft from the session store, not from the DOM.  |

### Return Value

`CheckoutFieldErrors` — an object mapping field names to error messages. Empty object if validation passes.

### Algorithm

1. Initialize an empty errors object.
2. If `draft.name.trim()` is empty, set `errors.name`.
3. If `draft.email.trim()` does not match `/^\S+@\S+\.\S+$/`, set `errors.email`.
4. If `draft.phone.trim()` does not match `/^\+[1-9]\d{9,14}$/`, set `errors.phone`.
5. If `deliveryMethod === 'courier'`:
   - Validate `city`, `street`, `house` as non-empty after trimming.
6. Else if `deliveryMethod === 'pickup'`:
   - Validate `pickupPointId` as truthy.
7. Return the errors object.

### Complexity

- Time: O(1) — constant number of field checks.
- Space: O(1) — at most a fixed number of error entries.

### Limitations

- `apartment` is not validated (optional field).
- Email and phone validation use simple regexes; they may reject valid international formats or accept some invalid ones.
- `pickupPointId` is only checked for presence, not format.

---

## `buildDelivery`

### Description

Constructs the `delivery` payload for a `POST /api/quotes` request. Returns `null` when required fields are missing, indicating the quote should not be sent yet.

### Parameters

| Name   | Type             | Description                                      |
| ------ | ---------------- | ------------------------------------------------ |
| `draft`| `CheckoutDraft`  | Draft containing delivery method and address data. |

### Return Value

`CreateQuoteDelivery | null` — the delivery payload, or `null` if required fields are empty.

### Algorithm

1. If `deliveryMethod === 'courier'`:
   - Trim `city`, `street`, `house`, `apartment`.
   - If any of `city`, `street`, `house` is empty, return `null`.
   - Return `{ method: 'courier', address: { city, street, house, ...(apartment ? { apartment } : {}) } }`.
2. If `deliveryMethod === 'pickup'`:
   - If `pickupPointId` is falsy, return `null`.
   - Return `{ method: 'pickup', pickupPointId: draft.pickupPointId as PickupId }`.
3. Otherwise return `null`.

### Complexity

- Time: O(1)
- Space: O(1)

### Limitations

- For courier, an empty `apartment` is omitted from the payload.
- The `pickupPointId` cast to the literal union type assumes the draft value always matches API-provided IDs; no runtime validation is performed.
- Returns `null` for any delivery method other than `'courier'` or `'pickup'`.

---

## `toOrderErrorMessage`

### Description

Converts an unknown error (typically from `createOrder` mutation) into a user-facing alert message.

### Parameters

| Name   | Type      | Description                          |
| ------ | --------- | ------------------------------------ |
| `error`| `unknown` | Error object from the mutation.      |

### Return Value

`string` — a user-readable error message.

### Algorithm

Delegates directly to `toUserMessage(error)` from the shared API errors module.

### Complexity

- Time: O(1) — assuming `toUserMessage` is constant-time.
- Space: O(1)

### Limitations

- Does not contain local error-code mapping; relies entirely on the shared `errors.ts` logic.
- The returned message may be generic if the error is not recognized.

---

## `toServerFieldErrors`

### Description

Maps a server `VALIDATION_ERROR` response to known form field errors. Unknown fields (e.g., `apartment`) are intentionally ignored so their messages surface via the general alert instead of being lost.

### Parameters

| Name   | Type      | Description                          |
| ------ | --------- | ------------------------------------ |
| `error`| `unknown` | Error object from the `createOrder` mutation. |

### Return Value

`CheckoutFieldErrors | null` — a map of known field names to messages, or `null` if the error is not a `VALIDATION_ERROR` or no known fields are present.

### Algorithm

1. If `error` is not an API error, or `error.code !== 'VALIDATION_ERROR'`, or `error.fields` is missing, return `null`.
2. Initialize an empty `mapped` object.
3. For each field in `error.fields`:
   - Extract the leaf name from `field.path.split('/').pop()`.
   - If the leaf exists in `FIELD_MESSAGES`, add the corresponding message to `mapped`.
4. Return `mapped` if it has keys, otherwise return `null`.

### Complexity

- Time: O(n), where n is the number of fields in `error.fields`.
- Space: O(m), where m is the number of known fields mapped.

### Limitations

- Only fields present in `FIELD_MESSAGES` are mapped; unknown leaves are silently dropped.
- If all server field errors are unknown, returns `null`, causing the error to be shown via the general alert.
- The leaf extraction assumes `field.path` uses `/` as a separator and that the last segment is the field name.
