---
title: query-state
created: 2026-09-12
updated: 2026-09-12
type: entity
tags:
  - component
  - exported
source: apps/web/src/shared/ui/query-state.tsx
confidence: high
hash: hand
---

# query-state

> Source: `apps/web/src/shared/ui/query-state.tsx`

## Description

Shared pending/error screens. Pages do not copy skeleton + Alert + «Повторить». 404 goes to the catalog; other errors retry via `refetch`.

`aria-busy` is on the pending root; `role=status` belongs on the skeleton itself. The `h1` title matches the ready page so layout does not jump.

## Exports

- `PagePending({ title, skeleton })` — title + skeleton while the query loads.
- `PageError({ title, errorTitle, error, onRetry, notFoundTitle?, notFoundDescription? })` — destructive alert. If `notFoundTitle` is set and the error is 404, show a link to `/` and ignore `onRetry` (retrying a missing order is pointless).

Used by [[query-gate]].
