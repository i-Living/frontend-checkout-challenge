---
title: ThemeToggle
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/features/theme/theme-toggle.tsx
confidence: high
hash: fa0895ec131236af
---

# ThemeToggle

> Source: `apps/web/src/features/theme/theme-toggle.tsx`

## Used in

- [[App]]

## Uses

- [[Button]]

## Description

A button component that toggles between light and dark theme modes. Renders a `<Button>` containing `<Sun>` and `<Moon>` icons to visually indicate the current theme and the action available to the user.

## Logic

The component renders a `<Button>` that displays either a `<Sun>` or `<Moon>` icon depending on the active theme. The icon serves as both a visual indicator of the current theme and an affordance for switching to the opposite theme.

## Key Features

- Exported component for use across the application
- Theme switching between light and dark modes
- Icon-based visual feedback using `<Sun>` and `<Moon>` icons
- Accessible button element for triggering theme changes
