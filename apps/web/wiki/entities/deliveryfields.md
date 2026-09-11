---
title: DeliveryFields
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/features/checkout/delivery-fields.tsx
confidence: high
hash: 05745e6f511b69ab
---

# DeliveryFields

> Source: `apps/web/src/features/checkout/delivery-fields.tsx`

## Used in

- [[CheckoutForm]]

## Uses

- [[FormField]]
- [[Input]]

## Description

`DeliveryFields` is a controlled form component that renders delivery-related input fields. It adapts its UI based on the selected delivery `method`, including a pickup point selector when applicable, and reports changes through an `onChange` callback.

## Props

| Prop          | Type                | Description                                                                 |
| ------------- | ------------------- | --------------------------------------------------------------------------- |
| `method`      | `string`            | Current delivery method. Determines which fields and options are rendered.  |
| `pickupPoints`| `PickupPoints`      | Available pickup point data, used to populate the `<select>` options.       |
| `values`      | `DeliveryValues`    | Current form values for the delivery fields.                                |
| `errors`      | `DeliveryErrors`    | Validation errors keyed by field, used to display field-level error states. |
| `onChange`    | `function`          | Callback invoked when a field value changes.                                |

## Logic

- The component renders a `<div>` containing `FormField` wrappers, `<Input>` elements, and a `<select>` for pickup points.
- The `method` prop controls whether the pickup point selector is shown or which input fields are relevant.
- The `<select>` is populated from `pickupPoints`, with each pickup point rendered as an `<option>`.
- Input values are bound to `values`, and error states are derived from `errors`.
- User interactions are forwarded to the parent via `onChange`, keeping the component fully controlled.

## Key Features

- Controlled form fields driven by `values` and `onChange`.
- Conditional rendering based on delivery `method`.
- Pickup point selection via `<select>` and `<option>` elements.
- Field-level error display through `FormField` and `errors`.
- Reusable, exportable React component.
