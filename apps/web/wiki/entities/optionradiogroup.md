---
title: OptionRadioGroup
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/shared/ui/option-radio-group.tsx
confidence: high
hash: ca540835e2c7a56a
---

# OptionRadioGroup

> Source: `apps/web/src/shared/ui/option-radio-group.tsx`

## Used in

- [[CheckoutForm]]
- [[CardPicker]]

## Uses

- [[RadioGroup]]
- [[Label]]

## Description

`OptionRadioGroup` is a React component that renders a radio group selection interface. It composes `RadioGroup` and `RadioGroupItem` primitives within a semantic `fieldset`/`legend` structure, with each option paired with a `Label` for accessible text. The component is exported for use as a standalone form control.

## Logic

The component's rendering structure is composed of the following JSX elements:

- **`<fieldset>` / `<legend>`** — Provides a semantic, accessible grouping for the radio options, with the legend acting as the group's title/description.
- **`<RadioGroup>`** — The root container managing the radio selection state and keyboard navigation semantics.
- **`<RadioGroupItem>`** — Individual selectable radio items, one per option.
- **`<Label>`** — Text labels associated with each `RadioGroupItem`, making the options clickable and accessible.
- **`<div>` / `<span>`** — Used for layout structure and/or custom visual indicators (e.g., styled radio circles, icons, or helper text).

The component maps over its option data to render a set of `RadioGroupItem` + `Label` pairs inside the `RadioGroup`, all wrapped by the `fieldset`/`legend` container.

## Key Features

- **Accessible form grouping** — Uses `fieldset` and `legend` to provide a semantic, screen-reader-friendly group label.
- **Radio selection semantics** — Built on `RadioGroup`/`RadioGroupItem` primitives, ensuring standard radio behavior (single selection, arrow-key navigation).
- **Label association** — Each `RadioGroupItem` is paired with a `Label`, improving click target size and accessibility.
- **Composable structure** — Uses `div` and `span` elements for flexible layout and custom styling of radio indicators or option content.
