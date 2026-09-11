---
title: RouteError
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/shared/ui/error-boundary.tsx
confidence: high
hash: 26de1d8c9a3b3516
---

# RouteError

> Source: `apps/web/src/shared/ui/error-boundary.tsx`

## Used in

- [[router]]

## Uses

- [[Card]]
- [[Button]]

## Description
`RouteError` is an exported React component that renders a user-friendly error state for route-level failures. It presents error messaging and recovery actions inside a `Card` layout and can include an `ErrorFallback` component for additional error details.

## Logic
- Renders a `Card` with `CardContent` as the main container.
- Displays a heading (`h1`) and descriptive text (`p`) to communicate the error.
- Provides a `Button` and an anchor (`<a>`) for recovery actions such as retrying or navigating home.
- Includes an `ErrorFallback` component to render fallback error UI when needed.

## Key Features
- Exported as a named component.
- Built on `Card` and `CardContent` primitives for consistent layout.
- Combines inline error messaging with an `ErrorFallback` component.
- Offers recovery actions via `Button` and `<a>`.
