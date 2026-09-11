---
title: errors
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - util
  - internal
source: apps/web/src/shared/api/errors.ts
confidence: low
hash: cfe000f2bf56fef0
---

# errors

> Source: `apps/web/src/shared/api/errors.ts`


## Description

Normalizes API errors and provides UI texts. Pages do not switch on `code` directly; they use `toUserMessage` / `toErrorTitle` / `getErrorCode`.

The module defines the `ApiError` shape and a map of known error codes with user-friendly copy. It exports duck-type guards, code extraction, and alert text helpers.

---

## `isApiError(value: unknown): value is ApiError`

### Description

Duck-type check to determine whether a value is an `ApiError` object. Because errors are constructed as object literals rather than class instances, `instanceof` is not reliable.

### Parameters

- `value: unknown` — value from a `catch` clause or `mutation.error`.

### Return Value

`value is ApiError` — type predicate. Returns `true` only if `value` is a non-null object with:
- `name === 'ApiError'`
- `message` of type `string`
- `code` of type `string`
- `status` of type `number`

### Algorithm

1. Check that `value` is a non-null object.
2. Cast to `Record<string, unknown>`.
3. Verify the required fields and their types.

### Complexity

- Time: O(1)
- Space: O(1)

### Limitations

- Does not validate optional fields (`fields`, `requestId`).
- Only matches the exact literal shape; class instances with the same properties will also pass.

---

## `getErrorCode(error: unknown): string | null`

### Description

Extracts the API error code for branching logic (e.g., `CART_VERSION_CONFLICT`, `PAYMENT_FINALIZED`). For UI text, use `toUserMessage`.

### Parameters

- `error: unknown` — value from a `catch` clause or `mutation.error`.

### Return Value

`string | null` — the error code if `isApiError(error)` is `true`; otherwise `null`.

### Algorithm

1. Call `isApiError(error)`.
2. If true, return `error.code`; otherwise return `null`.

### Complexity

- Time: O(1)
- Space: O(1)

---

## `isInvalidSessionError(error: unknown): boolean`

### Description

Checks for `401 SESSION_REQUIRED` / `SESSION_INVALID` errors. Used to trigger token refresh and retry instead of showing an alert.

### Parameters

- `error: unknown` — value from a request using `withAuth`.

### Return Value

`boolean` — `true` if the error is an `ApiError` with `status === 401` and `code` equal to `'SESSION_REQUIRED'` or `'SESSION_INVALID'`.

### Algorithm

1. Call `isApiError(error)`.
2. Check `error.status === 401`.
3. Check `error.code` is one of the two session codes.

### Complexity

- Time: O(1)
- Space: O(1)

---

## `isNotFoundError(error: unknown): boolean`

### Description

Checks for `404` API errors. Used by `queryGate` to show a “go to catalog” button instead of “retry”.

### Parameters

- `error: unknown` — result of an order/resource request.

### Return Value

`boolean` — `true` if the error is an `ApiError` with `status === 404`.

### Algorithm

1. Call `isApiError(error)`.
2. Check `error.status === 404`.

### Complexity

- Time: O(1)
- Space: O(1)

---

## `getErrorCopy(error: unknown): { title: string; message: string } | undefined`

### Description

Internal helper. Returns the `ERROR_COPY` entry for the error code, if present. Not exported.

### Parameters

- `error: unknown` — value from a `catch` clause or `mutation.error`.

### Return Value

`{ title: string; message: string } | undefined` — the copy object for a known code; otherwise `undefined`.

### Algorithm

1. Get the error code via `getErrorCode(error)`.
2. If a code exists, look it up in `ERROR_COPY`.
3. Return the found entry or `undefined`.

### Complexity

- Time: O(1)
- Space: O(1)

---

## `toUserMessage(error: unknown, fallback = 'Попробуйте ещё раз.'): string`

### Description

Produces a single alert line. For known codes, returns `"title. explanation"`. Otherwise returns the API message if the error is an `ApiError`; otherwise returns the fallback. Network errors without `ApiError` always use the fallback to avoid showing “Failed to fetch”.

### Parameters

- `error: unknown` — value from a `catch` clause or `mutation.error`.
- `fallback: string` — default `'Попробуйте ещё раз.'`. Text used for `TypeError`/`AbortError` or any non-`ApiError`.

### Return Value

`string` — user-facing message.

### Algorithm

1. Call `getErrorCopy(error)`.
2. If a copy exists, return `` `${copy.title}. ${copy.message}` ``.
3. Else if `isApiError(error)`, return `error.message`.
4. Else return `fallback`.

### Complexity

- Time: O(1)
- Space: O(1)

---

## `toErrorTitle(error: unknown, fallback: string): string`

### Description

Alert title. For known codes, returns the short title from `ERROR_COPY` without the explanation. Otherwise returns the provided fallback (e.g., a screen title like “Не удалось создать заказ”).

### Parameters

- `error: unknown` — value from a request `catch`.
- `fallback: string` — screen title used when the code is not in the map.

### Return Value

`string` — alert title.

### Algorithm

1. Call `getErrorCopy(error)`.
2. Return `copy?.title ?? fallback`.

### Complexity

- Time: O(1)
- Space: O(1)

---

## `toErrorDescription(error: unknown, fallback = 'Попробуйте ещё раз.'): string`

### Description

Alert description when the title is displayed separately. For known codes, returns the explanation message from `ERROR_COPY`. Otherwise behaves identically to `toUserMessage`.

### Parameters

- `error: unknown` — value from a request `catch`.
- `fallback: string` — default `'Попробуйте ещё раз.'`. Same semantics as in `toUserMessage`.

### Return Value

`string` — alert description.

### Algorithm

1. Call `getErrorCopy(error)`.
2. If a copy exists, return `copy.message`.
3. Otherwise return `toUserMessage(error, fallback)`.

### Complexity

- Time: O(1)
- Space: O(1)
