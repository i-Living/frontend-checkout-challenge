---
title: CardPicker
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/features/payment/card-picker.tsx
confidence: medium
hash: 44e287511c54bae0
---

# CardPicker

> Source: `apps/web/src/features/payment/card-picker.tsx`

## Used in

- [[PaymentPage]]

## Uses

- [[OptionRadioGroup]]

## Description

`CardPicker` is a controlled selection component that renders a set of card options and reports the selected card to its parent. It delegates the actual UI rendering to `OptionRadioGroup`.

## Props

| Prop         | Type               | Description                                                      |
|--------------|--------------------|------------------------------------------------------------------|
| `cards`      | `unknown`          | The data source for the card options. The exact shape depends on the expected card model. |
| `selectedId` | `string \| null`   | The currently selected card ID, or `null` when no card is selected. |
| `onSelect`   | `function`         | Callback invoked when a card is selected.                        |
| `disabled`   | `boolean`          | Optional. When `true`, disables all card selection interactions. |

## Logic

- `CardPicker` receives the available cards, the current selection, and a selection handler.
- It forwards these values directly to `OptionRadioGroup`, which handles the visual presentation and user interaction.
- The component is controlled: the parent owns the selected state via `selectedId` and `onSelect`.

## Key Features

- Controlled selection state.
- Supports an optional disabled state.
- Reuses `OptionRadioGroup` for consistent radio-style card selection behavior.
- Exported as a standalone component.
