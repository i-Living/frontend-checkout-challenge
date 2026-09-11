---
title: cn
created: 2026-09-11
updated: 2026-09-12
type: entity
tags:
  - util
  - exported
source: apps/web/src/shared/lib/cn.ts
confidence: high
hash: hand
---

# cn

> Source: `apps/web/src/shared/lib/cn.ts`

## Description

Joins class names with `clsx` and then `twMerge`. Conflicting Tailwind utilities keep the last one (`cn('px-4', 'px-2')` → `'px-2'`). Do not build `className` with a template ternary — Biome requires `cn()`.

## Exports

- `cn(...inputs: ClassValue[]): string`
