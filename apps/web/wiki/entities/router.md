---
title: router
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - internal
source: apps/web/src/app/router.tsx
confidence: low
hash: 6aef7f9d7d74ed9a
---

# router

> Source: `apps/web/src/app/router.tsx`

## Uses

- [[App]]
- [[RouteError]]
- [[CatalogPage]]
- [[CartPage]]
- [[CheckoutPage]]
- [[PaymentPage]]
- [[OrderPage]]
- [[NotFoundPage]]

> Based on AST signature. Source code omitted; only structural information is available.

## Description

Root-level component that composes the application’s route structure. It renders the main page components and includes route-level error handling.

## Logic

The component renders the following JSX elements:

- `<App />`
- `<RouteError />`
- `<CatalogPage />`
- `<CartPage />`
- `<CheckoutPage />`
- `<PaymentPage />`
- `<OrderPage />`
- `<NotFoundPage />`

The AST signature reports `Exports: false`, so the component is not exported.

## Key Features

- Central route composition for the application.
- Includes a route-level error component (`RouteError`).
- Includes page components for catalog, cart, checkout, payment, order, and not-found routes.
