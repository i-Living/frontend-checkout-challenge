---
title: CheckoutForm
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/features/checkout/checkout-form.tsx
confidence: high
hash: 8d3d01dbbaeaa1d0
---

# CheckoutForm

> Source: `apps/web/src/features/checkout/checkout-form.tsx`

## Used in

- [[CheckoutPage]]

## Uses

- [[Card]]
- [[FormField]]
- [[Input]]
- [[OptionRadioGroup]]
- [[DeliveryFields]]
- [[Button]]

## Description

Checkout form that collects contact, delivery, and payment data. It is a controlled component without local state: the draft lives in the session store so it survives request errors and page reloads. The form uses `noValidate` to prevent HTML5 validation from overriding custom field messages, and submits the draft to the parent's `onSubmit`.

## Props

| Prop | Type | Description |
|------|------|-------------|
| `draft` | `CheckoutDraft` | Current checkout draft values from the session store. |
| `errors` | `CheckoutFieldErrors` | Partial record of client/server field errors keyed by field name (`name`, `email`, `phone`, `pickupPointId`, `city`, `street`, `house`). `apartment` is excluded because it is optional and not part of `FIELD_MESSAGES`. |
| `options` | `CheckoutOptions` | Delivery and payment methods loaded from `GET /api/checkout/options`. |
| `isPending` | `boolean` | Disables the submit button while a request is in flight. |
| `submitLabel` | `string` | Text rendered inside the submit button. |
| `onDraftChange` | `(patch: Partial<CheckoutDraft>) => void` | Callback to merge a partial patch into the draft in the session store. |
| `onSubmit` | `(draft: CheckoutDraft) => void` | Callback invoked with the full draft on form submit. |

## Event Handlers

### `handleSubmit(event: FormEvent<HTMLFormElement>)`

Prevents the browser's default form submission (which would navigate away from the SPA) and calls `onSubmit(draft)` with the current draft. Validation is delegated to the page-level `onSubmit`.

## Logic

- Derives `pickupMethod` by finding the delivery method with `id === 'pickup'` in `options.deliveryMethods`.
- Derives `pickupPoints` from `pickupMethod?.pickupPoints ?? []` and passes them to `DeliveryFields`.
- Renders three cards:
  - **Contacts** — `Input` fields for name, email, and phone, each wrapped in `FormField` with error display.
  - **Delivery** — `OptionRadioGroup` for delivery method selection plus `DeliveryFields` for pickup-point or address details.
  - **Payment** — `OptionRadioGroup` for payment method selection.
- All inputs are fully controlled: `value` comes from `draft`, changes go through `onDraftChange`.
- The form has `noValidate`; the submit button is `type="submit"` and disabled while `isPending`.

## Key Features

- **No local state** — the draft is owned by the session store, making the component resilient to request failures and F5 refreshes.
- **Controlled inputs** — every field value is derived from `draft`, never from internal state.
- **Custom validation flow** — `noValidate` disables native HTML5 validation so custom `FIELD_MESSAGES` take precedence.
- **Modular UI composition** — built from `Card`, `FormField`, `Input`, `OptionRadioGroup`, and `DeliveryFields`.
- **Section icons** — `User`, `Truck`, and `Wallet` icons from `lucide-react` visually distinguish the contact, delivery, and payment sections.
- **Responsive submit button** — full width on mobile (`w-full`), auto width on small screens and up (`sm:w-auto sm:self-start`).
