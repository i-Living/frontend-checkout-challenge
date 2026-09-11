---
title: query-gate
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - internal
source: apps/web/src/shared/ui/query-gate.tsx
confidence: low
hash: d3a9c198c03fe896
---

# query-gate

> Source: `apps/web/src/shared/ui/query-gate.tsx`

## Uses

- [[PageError]]

## Description

This component acts as a rendering gate between two page-level states: `<PagePending>` and `<PageError>`. It uses the `queryGate` handler to determine which state should be displayed.

## Event Handlers

- **`queryGate`** — Handler that determines the current query state. Its result controls whether `<PagePending>` or `<PageError>` is rendered. The AST signature does not expose its implementation, arguments, or return type.

## Logic

The component evaluates `queryGate` and conditionally renders one of the two JSX page components:

- If the gate indicates a pending query, it renders `<PagePending>`.
- If the gate indicates an error, it renders `<PageError>`.

Because `Exports` is `false`, this component is not exported from its module and is likely used as an internal building block.

## Key Features

- Conditional rendering between pending and error page states.
- Centralized gate logic via the `queryGate` handler.
- No local state or effects detected.
- Not exported; intended for internal use.
