---
title: FormField
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/shared/ui/form-field.tsx
confidence: high
hash: 78772d06953cba6f
---

# FormField

> Source: `apps/web/src/shared/ui/form-field.tsx`

## Used in

- [[DeliveryFields]]
- [[CheckoutForm]]

## Uses

- [[Label]]

## Description

FormField is a React component that renders a form field wrapper containing a `Label` and a paragraph (`<p>`) element. It is exported for use in forms.

## Logic

Based on AST signatures, the component returns a `<div>` wrapper with `<Label>` and `<p>` children. The `Label` is likely used to identify the field, and the `<p>` element is likely used for helper text, description, or validation messages.

## Key Features

- Exported component (`Exports: true`).
- Composes a `<div>` container, `<Label>`, and `<p>`.
- Uses JSX.
