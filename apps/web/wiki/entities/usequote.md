---
title: useQuote
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - hook
  - internal
source: apps/web/src/features/checkout/use-quote.ts
confidence: low
hash: 64a9c2a9b641fa57
---

# useQuote

> Source: `apps/web/src/features/checkout/use-quote.ts`


## Description
Custom hook for managing quote data. It integrates with React Query to fetch a quote and includes an effect that reacts to query errors and the query client instance.

## Effects
- `useEffect` with dependencies `[query.error, queryClient]` — runs when the query error object or the query client instance changes. Likely used for error handling, such as resetting state, triggering notifications, or invalidating queries.
