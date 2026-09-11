---
title: PageError
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/shared/ui/query-state.tsx
confidence: high
hash: 8ee01a775994df07
---

# PageError

> Source: `apps/web/src/shared/ui/query-state.tsx`

## Used in

- [[query-gate]]

## Uses

- [[Alert]]
- [[Button]]

## Description

Displays a full-page error state using an alert box with an icon, title, description, and a navigation button/link.

## Logic

Renders a page-level error layout composed of:

- A container `<div>` with an `<h1>` page heading.
- An `<Alert>` component containing a `<CircleAlert>` icon, `<AlertTitle>`, and `<AlertDescription>`.
- A `<Button>` wrapping a `<Link>` for user navigation.

## Key Features

- Uses semantic alert components for accessibility.
- Combines icon, title, and description to convey error information.
- Provides a clear call-to-action via a button-styled link.
