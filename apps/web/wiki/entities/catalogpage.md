---
title: CatalogPage
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/pages/catalog-page.tsx
confidence: high
hash: da0e0cebeb0aa63d
---

# CatalogPage

> Source: `apps/web/src/pages/catalog-page.tsx`

## Used in

- [[router]]

## Uses

- [[Skeleton]]
- [[MutationAlert]]
- [[ProductCard]]

## Description

`CatalogPage` is a page-level component that renders the product catalog view. It composes loading skeletons, a shopping bag indicator, page headings, mutation feedback, and product cards.

## Logic

The component renders a structured page layout:

- A root `<div>` wraps all content.
- Loading states are represented by `<Skeleton>` and `<CatalogSkeleton>` components.
- A `<ShoppingBag>` icon is displayed alongside a `<span>` element, likely indicating cart or bag status.
- Page text is provided via `<h1>` and `<p>` elements.
- `<MutationAlert>` handles mutation-related feedback (e.g., API errors or success messages).
- `<ProductCard>` components render individual product items within the catalog.

## Key Features

- **Loading skeletons** — `<Skeleton>` and `<CatalogSkeleton>` provide visual placeholders during data fetching.
- **Shopping bag indicator** — `<ShoppingBag>` icon with accompanying `<span>` text.
- **Page header** — `<h1>` and `<p>` for title and description content.
- **Mutation feedback** — `<MutationAlert>` surfaces mutation results or errors.
- **Product grid** — Multiple `<ProductCard>` instances display catalog products.
- **Exported component** — `CatalogPage` is exported for use in routing or parent layouts.
