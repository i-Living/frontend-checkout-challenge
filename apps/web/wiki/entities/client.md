---
title: client
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - util
  - exported
source: apps/web/src/shared/api/client.ts
confidence: medium
hash: 82d01b92a653ade4
---

# client

> Source: `apps/web/src/shared/api/client.ts`


## Module Description

HTTP client utilities for the API: path builders, error normalization, retry parsing, and fetch wrappers. All requests go through a single fetch layer that handles base URL, Authorization, Idempotency-Key, JSON/204 responses, and normalized `ApiError` failures.

---

## `cartItemPath(productId: string): string`

### Description
Builds the API path for a single cart item, encoding the product ID so slashes do not create extra path segments.

### Parameters
- `productId: string` — Product ID from the catalog, not a row index.

### Return Value
`string` — Path `/api/cart/items/:id` with `productId` URL-encoded.

### Algorithm
1. Apply `encodeURIComponent` to `productId`.
2. Interpolate the encoded value into the template string `/api/cart/items/${encoded}`.

### Complexity
- Time: O(n), where n is the length of `productId`.
- Space: O(n) for the resulting string.

### Limitations
None specific.

---

## `quotePath(quoteId: string): string`

### Description
Builds the API path for fetching a single quote by ID.

### Parameters
- `quoteId: string` — UUID of the quote returned from `POST /api/quotes`.

### Return Value
`string` — Path `/api/quotes/:id` with `quoteId` URL-encoded.

### Algorithm
1. Apply `encodeURIComponent` to `quoteId`.
2. Interpolate into `/api/quotes/${encoded}`.

### Complexity
- Time: O(n), where n is the length of `quoteId`.
- Space: O(n) for the resulting string.

### Limitations
None specific.

---

## `orderPath(orderId: string): string`

### Description
Builds the API path for fetching a single order.

### Parameters
- `orderId: string` — UUID of the order.

### Return Value
`string` — Path `/api/orders/:id` with `orderId` URL-encoded.

### Algorithm
1. Apply `encodeURIComponent` to `orderId`.
2. Interpolate into `/api/orders/${encoded}`.

### Complexity
- Time: O(n), where n is the length of `orderId`.
- Space: O(n) for the resulting string.

### Limitations
None specific.

---

## `orderPaymentsPath(orderId: string): string`

### Description
Builds the API path for listing payment attempts of an order and creating a new attempt.

### Parameters
- `orderId: string` — UUID of the order, not the payment.

### Return Value
`string` — Path `/api/orders/:id/payments` with `orderId` URL-encoded.

### Algorithm
1. Apply `encodeURIComponent` to `orderId`.
2. Interpolate into `/api/orders/${encoded}/payments`.

### Complexity
- Time: O(n), where n is the length of `orderId`.
- Space: O(n) for the resulting string.

### Limitations
None specific.

---

## `paymentPath(paymentId: string): string`

### Description
Builds the API path for fetching a single payment attempt during polling.

### Parameters
- `paymentId: string` — UUID of the payment.

### Return Value
`string` — Path `/api/payments/:id` with `paymentId` URL-encoded.

### Algorithm
1. Apply `encodeURIComponent` to `paymentId`.
2. Interpolate into `/api/payments/${encoded}`.

### Complexity
- Time: O(n), where n is the length of `paymentId`.
- Space: O(n) for the resulting string.

### Limitations
None specific.

---

## `paymentSimulationsPath(paymentId: string): string`

### Description
Builds the API path for posting a payment outcome simulation.

### Parameters
- `paymentId: string` — UUID of an already created payment.

### Return Value
`string` — Path `/api/payments/:id/simulations` with `paymentId` URL-encoded.

### Algorithm
1. Apply `encodeURIComponent` to `paymentId`.
2. Interpolate into `/api/payments/${encoded}/simulations`.

### Complexity
- Time: O(n), where n is the length of `paymentId`.
- Space: O(n) for the resulting string.

### Limitations
None specific.

---

## `toApiError(json: unknown, status: number, requestIdHeader?: string): ApiError`

### Description
Normalizes an unknown error response body into a structured `ApiError` object. Handles malformed JSON, missing fields, and non-string error codes/messages.

### Parameters
- `json: unknown` — Response body, or `undefined` if JSON is broken or absent.
- `status: number` — HTTP status code; used for fallback message and 401/404 guards.
- `requestIdHeader?: string` — Value of the `X-Request-Id` header, used when `meta.requestId` is absent.

### Return Value
`ApiError` — Object with:
- `name: 'ApiError'`
- `message: string`
- `code: string`
- `status: number`
- `fields?: { path: string; message: string }[]`
- `requestId?: string`

### Algorithm
1. If `json` is a non-null object, cast to `ErrorPayload`; otherwise use an empty object.
2. Extract `error` object; default to `{}` if missing.
3. Set `code` to `error.code` if it is a non-empty string, otherwise `'UNKNOWN_ERROR'`.
4. Set `message` to `error.message` if it is a non-empty string, otherwise `` `Request failed with status ${status}` ``.
5. Extract `meta.requestId`; if not a non-empty string, fall back to `requestIdHeader`.
6. If `error.fields` is an array, filter items to objects with string `path` and `message`, then map to `{ path, message }`.
7. Return an object with `name`, `message`, `code`, `status`, and conditionally `fields` and `requestId`.

### Complexity
- Time: O(n), where n is the number of items in `error.fields`.
- Space: O(n) for the filtered `fields` array.

### Limitations
- If `json` is not an object, all error details are lost.
- `fields` is only included when it is a valid array of objects with string `path` and `message`.
- `requestId` is omitted if neither `meta.requestId` nor `requestIdHeader` is a non-empty string.

---

## `parseRetryAfterMs(headers: Headers): number | null`

### Description
Parses the `Retry-After` header from a payment simulation response into a polling delay in milliseconds, clamped to a safe range.

### Parameters
- `headers: Headers` — Response headers from `createSimulation`.

### Return Value
`number | null` — Delay in milliseconds between 250 and 10000, or `null` if the header is absent, invalid, or a past date.

### Algorithm
1. Read `Retry-After` header; if empty, return `null`.
2. Try numeric seconds: `Number(raw)`.
   - If finite and `>= 0`, return `Math.min(10_000, Math.max(250, seconds * 1000))`.
3. Try HTTP-date: `Date.parse(raw)`.
   - If valid and the date is in the future, return `Math.min(10_000, Math.max(250, diff))`.
4. Otherwise return `null`.

### Complexity
- Time: O(1)
- Space: O(1)

### Limitations
- Values are clamped to 250–10000 ms; longer delays are capped, shorter delays are raised.
- Past dates and unparseable strings return `null`.

---

## `requestWithMeta<T>(path: string, options?: RequestOptions): Promise<ResponseMeta<T>>`

### Description
Performs a fetch request against the API base URL, adding JSON headers, Bearer token, and Idempotency-Key as needed. Handles 204 responses, empty bodies, JSON parsing, and error normalization.

### Parameters
- `path: string` — Path relative to `API_BASE`, with IDs already encoded.
- `options?: RequestOptions` — Optional object:
  - `method?: string` — HTTP method; defaults to `'GET'`.
  - `body?: unknown` — JSON-serializable request body.
  - `token?: string | null` — Bearer token for Authorization header.
  - `signal?: AbortSignal` — Abort signal for fetch.
  - `idempotencyKey?: string` — Value for `Idempotency-Key` header.

### Return Value
`Promise<ResponseMeta<T>>` — Resolves to:
- `data: T` — Parsed `data` field from the JSON response, or `undefined` for 204/empty body.
- `headers: Headers` — Raw response headers.

### Algorithm
1. Destructure options; default `method` to `'GET'`.
2. Build headers object:
   - Add `Content-Type: application/json` if `body` is not `undefined`.
   - Add `Authorization: Bearer ${token}` if `token` is truthy.
   - Add `Idempotency-Key` if `idempotencyKey` is truthy.
3. Call `fetch(`${API_BASE}${path}`, { method, headers, body: JSON.stringify(body) if body exists, signal })`.
4. Read `X-Request-Id` header.
5. If status is `204`, return `{ data: undefined, headers }`.
6. Read response text; if empty, return `{ data: undefined, headers }`.
7. Try to parse text as JSON; on failure, throw `toApiError(undefined, status, requestIdHeader)`.
8. If `response.ok` is false, throw `toApiError(json, status, requestIdHeader)`.
9. Return `{ data: (json as { data: T }).data, headers }`.

### Complexity
- Time: O(n), where n is the size of the response body (parsing and reading).
- Space: O(n) for the parsed JSON object.

### Limitations
- Network-level fetch rejections (e.g., DNS failure, connection refused) are not caught and propagate as `TypeError`, not `ApiError`.
- Assumes successful JSON responses have a top-level `data` property; if absent, `data` will be `undefined`.
- `Content-Type` is only set when a body is present; GET/DELETE requests without a body do not send it.

---

## `request<T>(path: string, options?: RequestOptions): Promise<T>`

### Description
Convenience wrapper around `requestWithMeta` that returns only the `data` field, discarding headers.

### Parameters
- `path: string` — Path relative to `API_BASE`.
- `options?: RequestOptions` — Same options as `requestWithMeta`.

### Return Value
`Promise<T>` — The `data` field from the successful response.

### Algorithm
1. Call `requestWithMeta<T>(path, options)`.
2. Destructure and return `data`.

### Complexity
- Time: Same as `requestWithMeta`.
- Space: Same as `requestWithMeta`.

### Limitations
- Same as `requestWithMeta`.
- Headers are not exposed; use `requestWithMeta` when `Retry-After` or `Location` headers are needed.
