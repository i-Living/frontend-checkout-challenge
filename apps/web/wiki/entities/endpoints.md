---
title: endpoints
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - util
  - internal
source: apps/web/src/shared/api/endpoints.ts
confidence: low
hash: d6adb522ebd3a728
---

# endpoints

> Source: `apps/web/src/shared/api/endpoints.ts`


## Description
Typed endpoints built on top of `request`. Types are derived from OpenAPI, not manual DTOs. Catalog and sandbox endpoints do not require a token; all other endpoints use `withSessionRetry` to retry once on `SESSION_REQUIRED` / `SESSION_INVALID`.

---

## `withSessionRetry`

### Description
Executes a request with a fresh session token. If the request fails with an invalid-session error, it clears the stored token, obtains a new one, and retries exactly once. Other errors are not retried.

### Parameters
- `run: (token: string) => Promise<T>` — A function that performs the request using the provided token.

### Return Value
- `Promise<T>` — The result of `run` after a successful token acquisition.

### Algorithm
1. Call `ensureSession()` to obtain a token.
2. Invoke `run(token)`.
3. If it succeeds, return the result.
4. If it throws and `isInvalidSessionError(error)` is false, rethrow.
5. Otherwise, clear the stored token via `useSessionStore.getState().clearToken()`.
6. Obtain a fresh token with `ensureSession()`.
7. Invoke `run(fresh)` and return its result.

### Complexity
- Time: O(1) retry overhead (at most two request attempts).
- Space: O(1) additional.

### Limitations
- Only retries once.
- Only handles errors identified by `isInvalidSessionError`.

---

## `withAuth`

### Description
Performs an authorized request. The token is supplied by `ensureSession`; callers do not pass it explicitly.

### Parameters
- `path: string` — Path relative to `API_BASE`.
- `options: Omit<RequestOptions, 'token'> = {}` — Request options without the `token` field.

### Return Value
- `Promise<T>` — The `data` field from the response.

### Algorithm
Delegates to `withSessionRetry`, calling `request<T>(path, { ...options, token })`.

### Complexity
- Time: O(1) additional overhead over the underlying request.
- Space: O(1) additional.

### Limitations
- Throws `ApiError` after a possible single retry on session 401.

---

## `withAuthMeta`

### Description
Like `withAuth`, but also returns response headers. Required for `createSimulation` to read `Retry-After`.

### Parameters
- `path: string` — Path relative to `API_BASE`.
- `options: Omit<RequestOptions, 'token'> = {}` — Request options without the `token` field.

### Return Value
- `Promise<{ data: T; headers: Headers }>` — Response data and headers.

### Algorithm
Delegates to `withSessionRetry`, calling `requestWithMeta<T>(path, { ...options, token })`.

### Complexity
- Time: O(1) additional overhead over the underlying request.
- Space: O(1) additional.

### Limitations
- Throws `ApiError` after a possible single retry on session 401.

---

## `listProducts`

### Description
Fetches the product catalog. Does not use `withAuth` to avoid an unnecessary session POST.

### Parameters
- `signal?: AbortSignal` — Abort signal for query cancellation.

### Return Value
- `Promise<ProductList>` — List of products from the catalog.

### Algorithm
Calls `request<ProductList>(API_PATHS.products, { signal })`.

---

## `getCart`

### Description
Fetches the current session's cart. An empty `items` array is a normal state, not a 404.

### Parameters
- `signal?: AbortSignal` — Abort signal for query cancellation.

### Return Value
- `Promise<Cart>` — Cart contents and `version` for quote creation.

### Algorithm
Calls `withAuth<Cart>(API_PATHS.cart, { signal })`.

---

## `setCartItem`

### Description
Sets the absolute quantity of a cart item. Repeated `PUT` with the same quantity is idempotent and does not change the cart version.

### Parameters
- `productId: string` — Product ID from the catalog.
- `quantity: number` — New quantity, not a delta.
- `signal?: AbortSignal` — Abort signal for mutation cancellation.

### Return Value
- `Promise<CartItem>` — Updated cart item.

### Algorithm
Calls `withAuth<CartItem>(cartItemPath(productId), { method: 'PUT', body: { quantity }, signal })`.

---

## `removeCartItem`

### Description
Removes a cart item. The operation is idempotent: repeating `DELETE` on an already-removed item returns 204, not an error.

### Parameters
- `productId: string` — Product ID.
- `signal?: AbortSignal` — Abort signal for mutation cancellation.

### Return Value
- `Promise<void>` — Resolves when the item is removed.

### Algorithm
Calls `withAuth<void>(cartItemPath(productId), { method: 'DELETE', signal })`.

---

## `getCheckoutOptions`

### Description
Fetches delivery and payment options from the server. Titles for delivery/payment methods should not be hardcoded.

### Parameters
- `signal?: AbortSignal` — Abort signal for query cancellation.

### Return Value
- `Promise<CheckoutOptions>` — Available checkout options.

### Algorithm
Calls `withAuth<CheckoutOptions>(API_PATHS.checkoutOptions, { signal })`.

---

## `createQuote`

### Description
Creates a quote bound to the current cart version. The quote is valid for 10 minutes. Changing the cart or delivery requires a new `POST`, not a patch.

### Parameters
- `cartVersion: number` — Version from `GET /api/cart`.
- `delivery: CreateQuoteDelivery` — Pickup with a point or courier with an address.
- `signal?: AbortSignal` — Abort signal; changing the key aborts the previous POST.

### Return Value
- `Promise<Quote>` — New quote; all price amounts for the UI must come from this response.

### Algorithm
Calls `withAuth<Quote>(API_PATHS.quotes, { method: 'POST', body: { cartVersion, delivery }, signal })`.

### Limitations
- Quote expires after 10 minutes.
- Any change to cart or delivery invalidates the quote and requires a new request.

---

## `getQuote`

### Description
Reads a previously saved quote. On checkout, the `createQuote` response is usually sufficient.

### Parameters
- `id: string` — Quote UUID.
- `signal?: AbortSignal` — Abort signal for query cancellation.

### Return Value
- `Promise<Quote>` — The saved quote.

### Algorithm
Calls `withAuth<Quote>(quotePath(id), { signal })`.

---

## `createOrder`

### Description
Creates an order. For network retries, the same body and `Idempotency-Key` must be used; a new attempt requires a new key. A 201 response does not mean the order is paid — check the order status via `getOrder`.

### Parameters
- `body: CreateOrderBody` — Contains `quoteId`, payment method, and contacts.
- `key: string` — Idempotency key, 8–128 characters matching `[A-Za-z0-9_-]`.
- `signal?: AbortSignal` — Abort signal for mutation cancellation.

### Return Value
- `Promise<Order>` — Created order. The server cart is emptied after this call.

### Algorithm
Calls `withAuth<Order>(API_PATHS.orders, { method: 'POST', body, idempotencyKey: key, signal })`.

### Limitations
- Idempotency key format is restricted.
- Cart is cleared server-side after order creation.

---

## `listOrders`

### Description
Fetches the session's orders, newest first. Useful when the `orderId` is lost after a page refresh.

### Parameters
- `signal?: AbortSignal` — Abort signal for query cancellation.

### Return Value
- `Promise<OrderList>` — List of orders.

### Algorithm
Calls `withAuth<OrderList>(API_PATHS.orders, { signal })`.

---

## `getOrder`

### Description
Fetches a single order. This is the source of truth for the success page; do not substitute the 201 creation response or a successful payment status.

### Parameters
- `orderId: string` — Order UUID.
- `signal?: AbortSignal` — Abort signal for query cancellation.

### Return Value
- `Promise<Order>` — Order details and payment status.

### Algorithm
Calls `withAuth<Order>(orderPath(orderId), { signal })`.

---

## `listPayments`

### Description
Fetches payment attempts for an order, newest first. Used to resume pending/processing payments after a reload.

### Parameters
- `orderId: string` — Order UUID.
- `signal?: AbortSignal` — Abort signal for query cancellation.

### Return Value
- `Promise<PaymentList>` — List of payment attempts.

### Algorithm
Calls `withAuth<PaymentList>(orderPaymentsPath(orderId), { signal })`.

---

## `createPayment`

### Description
Creates a new payment attempt. The request body is always `{}`. The idempotency key follows the same rules as for order creation: reuse for network retries, use a new key for a new attempt.

### Parameters
- `orderId: string` — Order UUID.
- `key: string` — Idempotency key for this attempt.
- `signal?: AbortSignal` — Abort signal for mutation cancellation.

### Return Value
- `Promise<Payment>` — Created payment in `pending` state.

### Algorithm
Calls `withAuth<Payment>(orderPaymentsPath(orderId), { method: 'POST', body: {}, idempotencyKey: key, signal })`.

---

## `getPayment`

### Description
Reads a single payment attempt for polling. A declined payment returns HTTP 200 with `status=failed`, not an exception.

### Parameters
- `paymentId: string` — Payment UUID.
- `signal?: AbortSignal` — Abort signal; leaving the page should abort the request.

### Return Value
- `Promise<Payment>` — Payment attempt details.

### Algorithm
Calls `withAuth<Payment>(paymentPath(paymentId), { signal })`.

### Limitations
- A declined payment is a successful HTTP response, not a thrown error.

---

## `createSimulation`

### Description
Runs a sandbox payment scenario. The polling delay is determined by the `Retry-After` header, not a constant. Running a second simulation with a different scenario returns `409 PAYMENT_FINALIZED`.

### Parameters
- `paymentId: string` — Payment UUID.
- `scenario: SimulationScenario` — Scenario of the selected test card or `cancel`.
- `signal?: AbortSignal` — Abort signal for mutation cancellation.

### Return Value
- `Promise<SimulationResult>` — Contains `simulation` data and `retryAfterMs` (or `null` if the header is absent).

### Algorithm
Calls `withAuthMeta<Simulation>(paymentSimulationsPath(paymentId), { method: 'POST', body: { scenario }, signal })`, then maps the response to `{ simulation: data, retryAfterMs: parseRetryAfterMs(headers) }`.

### Limitations
- A second simulation with a different scenario on the same payment results in `409 PAYMENT_FINALIZED`.

---

## `getSandbox`

### Description
Fetches test cards without a token. The form should use `title` and `maskedNumber`, never PAN/CVC.

### Parameters
- `signal?: AbortSignal` — Abort signal for query cancellation.

### Return Value
- `Promise<Sandbox>` — Test cards and `settlementDelayMs`.

### Algorithm
Calls `request<Sandbox>(API_PATHS.sandbox, { signal })`.
