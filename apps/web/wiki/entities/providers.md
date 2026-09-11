---
title: Providers
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - component
  - exported
source: apps/web/src/app/providers.tsx
confidence: medium
hash: 835d6fd49b2c6535
---

# Providers

> Source: `apps/web/src/app/providers.tsx`

## Used in

- [[main]]

## Description

`Providers` is a React component that renders a `QueryClientProvider`, establishing React Query context for its child components.

## Logic

The component wraps its subtree in a `QueryClientProvider`, allowing descendant components to use React Query hooks and access the query client.

## Key Features

- Exported component.
- Uses `QueryClientProvider` as the root JSX element.
- Provides React Query context to wrapped children.
