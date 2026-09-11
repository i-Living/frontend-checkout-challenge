---
title: assert
created: 2026-09-11
updated: 2026-09-11
type: entity
tags:
  - util
  - internal
source: apps/web/src/shared/lib/assert.ts
confidence: low
hash: 3915ad67a5a47d6b
---

# assert

> Source: `apps/web/src/shared/lib/assert.ts`


## Description

Internal utility that unwraps a `Result`-like object. It returns the success value if the operation succeeded; otherwise, it throws the associated error.

## Parameters

- `result: Result<T, E>` — A result object representing either a success or failure. The exact interface is internal, but it must expose a way to distinguish success from failure and provide access to the contained value or error.

## Return Value

- `T` — The success value extracted from the result.

## Algorithm

1. Inspect the result's status flag (e.g., `isOk()` or an `ok` property).
2. If the result indicates success, return the stored value.
3. If the result indicates failure, throw the stored error.

## Complexity

- **Time:** O(1)
- **Space:** O(1)

## Limitations

- Only works with result objects that conform to the internal `Result` interface.
- If the result is a failure, the original error object is thrown without wrapping or transformation.
- Not exported; intended for internal use within the module.
