import assert from "node:assert/strict"
import test from "node:test"

import { calculateBoundedDropdownLayout } from "./deviceDropdownLayout.ts"

test("keeps the audio dropdown within a 320px viewport", () => {
  assert.deepEqual(calculateBoundedDropdownLayout(320, 40), {
    width: 288,
    left: -24,
  })
})

test("shifts the camera dropdown farther left within the same viewport", () => {
  assert.deepEqual(calculateBoundedDropdownLayout(320, 135), {
    width: 288,
    left: -119,
  })
})

test("keeps the natural anchor when the full dropdown fits", () => {
  assert.deepEqual(calculateBoundedDropdownLayout(500, 100), {
    width: 300,
    left: 0,
  })
})

test("shrinks the dropdown while preserving margins on a narrow viewport", () => {
  assert.deepEqual(calculateBoundedDropdownLayout(280, 30), {
    width: 248,
    left: -14,
  })
})

test("returns valid non-negative geometry for an extremely narrow viewport", () => {
  assert.deepEqual(calculateBoundedDropdownLayout(20, 4), {
    width: 0,
    left: 6,
  })
})
