---
title: main
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - internal
source: apps/web/src/main.tsx
confidence: low
hash: bf5ed96a1d034a34
---

# main

> Source: `apps/web/src/main.tsx`

## Uses

- [[Providers]]

## Description

Root-level application component that composes global providers and routing infrastructure. It wraps the application tree with React's `<StrictMode>`, a custom `<Providers>` hierarchy, and a `<RouterProvider>` to enable routing.

## Logic

The component renders a nested provider structure:

1. `<StrictMode>` — enables React's development-mode strict checks (double rendering, extra effect invocations) to surface potential issues.
2. `<Providers>` — aggregates application-wide context providers (e.g., theme, state management, API clients, authentication).
3. `<RouterProvider>` — supplies the routing context, allowing child components to access the router state and navigation APIs.

The component is not exported (`Exports: false`), indicating it is used internally — typically as the root element passed to a render function in an entry point.

## Key Features

- **StrictMode wrapper** — activates React's development diagnostics.
- **Centralized provider composition** — consolidates all global providers into a single hierarchy.
- **Router integration** — delegates routing to `<RouterProvider>`, decoupling route definitions from the component tree.
- **No props or state** — the component is static and purely compositional; it receives no external inputs and manages no internal state.
