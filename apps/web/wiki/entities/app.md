---
title: App
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/app/App.tsx
confidence: high
hash: 67f2eda5d207cfc3
---

# App

> Source: `apps/web/src/app/App.tsx`

## Used in

- [[router]]

## Uses

- [[ThemeToggle]]

## Description

Root application component that renders the application shell, including a header with navigation and utility controls, a main content area with routing and error handling, and a footer.

## Logic

The component composes the following JSX structure:

- `<div>` — root wrapper
  - `<header>` — top navigation bar containing:
    - `<NavLink>` — navigation link for client-side routing
    - `<span>` — inline text/icon element
    - `<Store>` — store-related component
    - `<ShoppingBasket>` — shopping basket widget
    - `<ThemeToggle>` — theme switching control
  - `<main>` — primary content area:
    - `<ErrorBoundary>` — error-catching wrapper for child components
      - `<Outlet />` — renders matched child routes
  - `<footer>` — page footer:
    - `<p>` — footer text

## Key Features

- **Routing**: Uses `NavLink` for navigation and `Outlet` for nested route rendering.
- **Store Integration**: Includes a `Store` component in the header.
- **Shopping Basket**: Renders a `ShoppingBasket` component for cart functionality.
- **Theme Toggle**: Provides a `ThemeToggle` component for switching themes.
- **Error Boundary**: Wraps routed content in an `ErrorBoundary` to handle rendering errors.
- **Layout Structure**: Consistent header/main/footer page layout.
