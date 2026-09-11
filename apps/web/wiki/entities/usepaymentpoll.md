---
title: usePaymentPoll
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - hook
  - internal
source: apps/web/src/features/payment/use-payment-poll.ts
confidence: low
hash: 32d9f8a2f22fbe7a
---

# usePaymentPoll

> Source: `apps/web/src/features/payment/use-payment-poll.ts`


## Description

`usePaymentPoll` is a React hook that manages polling of a payment status. It repeatedly checks the current payment status and uses the `isTerminalStatus` handler to determine when polling should stop. The hook is not exported (`Exports: false`), so it is intended for internal use within its module.

## Usage Notes

- The hook relies on the `isTerminalStatus` handler to identify terminal payment states.
- Because the hook is not exported, it cannot be imported or used outside its defining module.
- No parameter, return value, internal state, effect, or side-effect details are available from the provided AST signature.
