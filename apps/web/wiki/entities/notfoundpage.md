---
title: NotFoundPage
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/pages/not-found-page.tsx
confidence: high
hash: b60e2353fe165c89
---

# NotFoundPage

> Source: `apps/web/src/pages/not-found-page.tsx`

## Used in

- [[router]]

## Uses

- [[Button]]

## Description

`NotFoundPage` is a presentational fallback component rendered when no route matches. It displays a 404-style message and provides a navigation action for the user to return to a valid page.

## Logic

The component renders static JSX content only. It contains a `<div>` wrapper, an `<h1>` heading, a `<p>` message, and both `<Button>` and `<Link>` elements. The `<Button>` and `<Link>` are likely used to navigate the user back to the home page or another safe route. The component does not manage state, run effects, or define event handlers.

## Key Features

- Exported component for use in routing fallback configurations.
- Renders a clear 404 message to the user.
- Includes both a `<Button>` and a `<Link>` for navigation, offering flexible user interaction.
