---
title: theme-store
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - store
  - exported
source: apps/web/src/shared/store/theme-store.ts
confidence: medium
hash: bce882268c4e3159
---

# theme-store

> Source: `apps/web/src/shared/store/theme-store.ts`


## Description
State management store for theme handling. Manages system theme detection, theme application, and initialization.

## Selectors
- `systemTheme` — Returns the current system theme preference (`light` or `dark`).

## Actions
- `applyTheme(theme)` — Applies the specified theme (`light`, `dark`, or `system`).
- `initTheme()` — Initializes the theme store, typically called during application startup.
