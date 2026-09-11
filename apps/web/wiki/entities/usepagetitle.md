---
title: usePageTitle
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - hook
  - internal
source: apps/web/src/shared/lib/use-page-title.ts
confidence: low
hash: f6a6c2739e501482
---

# usePageTitle

> Source: `apps/web/src/shared/lib/use-page-title.ts`


## Description

`usePageTitle` is a custom hook that synchronizes the current page title with the browser document title. It updates `document.title` whenever the provided title value changes.

## Parameters

| Parameter | Type     | Description                                  |
|-----------|----------|----------------------------------------------|
| `title`   | `string` | The page title to set as the document title. |

## Return Value

Returns `undefined`.

## Internal State

None.

## Effects

### `useEffect([title])`

Runs after render and whenever `title` changes. Sets `document.title` to the current `title` value.

## Side Effects

- Mutates the global `document.title` property.

## Usage Notes

- The hook is not exported from its module (`Exports: false`), so it is intended for internal use within the defining file.
- The effect depends only on `title`; changing other values will not trigger a document title update.
- Ensure `title` is a string to avoid unexpected behavior in the browser.
