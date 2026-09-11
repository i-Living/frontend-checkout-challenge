# Checkout flow

Route order in [[router]]: `/` catalog → `/cart` → `/checkout` → `/orders/:orderId` → `/orders/:orderId/pay`.

## Invariants

- Money is integer kopecks, `RUB`. Display API amounts. Do not invent cart/quote/order totals. See [[money]].
- `PUT /api/cart/items/:id` quantity is **absolute**, not an increment. See [[CartLine]].
- `204` has no body — do not call `response.json()`. See [[client]].
- Quote is bound to `cartVersion` and lasts 10 minutes. Cart or delivery change → new quote. `409 CART_VERSION_CONFLICT` / `QUOTE_EXPIRED` → refresh and continue. See [[queries]] and [[query-keys]] (`quoteByVersion`).
- `POST /api/orders` and `POST .../payments` need `Idempotency-Key`. Network retry: same body+key. New attempt: new key. Creating an order clears the cart. See [[idempotency]].
- Card decline is HTTP 200 with `data.status=failed` / `failureCode=CARD_DECLINED`. Cancel leaves the order. Retry = new payment + new key. See [[usePaymentAttempt]].
- Success UI only from the **order** on the server (`paid`, or cash `confirmed` + `unpaid`). Never treat `201` as paid.
- Stop payment polling on `succeeded|failed|cancelled` or leaving the page. A late response must not overwrite newer data (`generationRef` in [[usePaymentAttempt]]).

## Pages

- [[CatalogPage]] — add to cart from the card; `stock=0` is unavailable.
- [[CartPage]] — line quantities, then checkout.
- [[CheckoutPage]] — quote + order; empty cart redirects to `/cart`; amounts from quote only.
- [[OrderPage]] — server order is source of truth.
- [[PaymentPage]] — sandbox cards, attempt, poll.
