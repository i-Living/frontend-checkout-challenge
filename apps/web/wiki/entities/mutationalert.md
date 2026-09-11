---
title: MutationAlert
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/shared/ui/mutation-alert.tsx
confidence: high
hash: f818715f33a77615
---

# MutationAlert

> Source: `apps/web/src/shared/ui/mutation-alert.tsx`

## Used in

- [[CheckoutPage]]
- [[PaymentPage]]
- [[CatalogPage]]
- [[CartPage]]

## Uses

- [[Alert]]

## Description

`MutationAlert` is an exported React component that renders an alert notification for mutation feedback. It composes the `Alert` component with a `CircleAlert` icon, an `AlertTitle`, and an `AlertDescription` to present status information to the user.

## Logic

The component renders the following JSX structure:

- `<Alert>` — root container for the alert.
- `<CircleAlert>` — icon indicating an alert state.
- `<AlertTitle>` — heading text for the alert.
- `<AlertDescription>` — supporting description text.

The component follows a declarative composition pattern, wrapping the icon, title, and description inside the `Alert` container. Any conditional rendering or prop-driven behavior is not captured in the AST signatures.

## Key Features

- Exported as a reusable component.
- Built on the `Alert` composition pattern.
- Includes a `CircleAlert` icon for visual alert indication.
- Provides separate title and description areas for structured messaging.
