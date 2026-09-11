---
title: money
created: 2026-09-11
updated: 2026-09-12
type: entity
tags:
  - util
  - exported
source: apps/web/src/shared/lib/money.ts
confidence: high
hash: 5afb7eb7acc203f8
---

# money

> Source: `apps/web/src/shared/lib/money.ts`

## Description

Formats API amounts for display. Amounts are integer kopecks, currency `RUB`. Do not invent totals or delivery on the client — take them from quote/order/cart.

## Exports

- `formatMoney(kopecks: number, currency?: 'RUB'): string` — `ru-RU` currency string, e.g. `249000` → «2 490,00 ₽». `Intl.NumberFormat` is cached per currency because catalog cards call this on every render.
