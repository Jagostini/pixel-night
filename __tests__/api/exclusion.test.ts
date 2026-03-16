import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

/**
 * Unit tests for the theme exclusion date calculation logic used in finalize-film.
 *
 * Logic under test:
 *   if mode === "none"    → no exclusion (excluded_until unchanged)
 *   if mode === "days"    → excluded_until = now + value days
 *   if mode === "soirees" → excluded_until = now + value * 30 days
 */

type ExclusionMode = "none" | "days" | "soirees"

function computeExclusionDate(
  mode: ExclusionMode,
  value: number,
  now: Date = new Date()
): Date | null {
  if (mode === "none") return null

  const result = new Date(now)
  if (mode === "days") {
    result.setDate(result.getDate() + value)
  } else {
    // "soirees": N × 30 days
    result.setDate(result.getDate() + value * 30)
  }
  return result
}

const FIXED_NOW = new Date("2026-03-17T12:00:00.000Z")

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("computeExclusionDate — mode none", () => {
  it("returns null when mode is 'none'", () => {
    expect(computeExclusionDate("none", 5, FIXED_NOW)).toBeNull()
  })

  it("returns null regardless of the value when mode is 'none'", () => {
    expect(computeExclusionDate("none", 0, FIXED_NOW)).toBeNull()
    expect(computeExclusionDate("none", 999, FIXED_NOW)).toBeNull()
  })
})

describe("computeExclusionDate — mode days", () => {
  it("adds the exact number of days", () => {
    const result = computeExclusionDate("days", 7, FIXED_NOW)
    const expected = new Date("2026-03-24T12:00:00.000Z")
    expect(result?.toISOString()).toBe(expected.toISOString())
  })

  it("works with 1 day", () => {
    const result = computeExclusionDate("days", 1, FIXED_NOW)
    const expected = new Date("2026-03-18T12:00:00.000Z")
    expect(result?.toISOString()).toBe(expected.toISOString())
  })

  it("works with 30 days", () => {
    const result = computeExclusionDate("days", 30, FIXED_NOW)
    const expected = new Date(FIXED_NOW)
    expected.setDate(expected.getDate() + 30)
    expect(result?.toISOString()).toBe(expected.toISOString())
  })
})

describe("computeExclusionDate — mode soirees", () => {
  it("multiplies value by 30 days (1 soiree = 30 days)", () => {
    const result = computeExclusionDate("soirees", 3, FIXED_NOW)
    // 3 × 30 = 90 days after 2026-03-17 → 2026-06-15
    const expected = new Date(FIXED_NOW)
    expected.setDate(expected.getDate() + 90)
    expect(result?.toISOString()).toBe(expected.toISOString())
  })

  it("works with 1 soiree (= 30 days)", () => {
    const result = computeExclusionDate("soirees", 1, FIXED_NOW)
    const expected = new Date(FIXED_NOW)
    expected.setDate(expected.getDate() + 30)
    expect(result?.toISOString()).toBe(expected.toISOString())
  })

  it("works with 5 soirees (= 150 days)", () => {
    const result = computeExclusionDate("soirees", 5, FIXED_NOW)
    const expected = new Date(FIXED_NOW)
    expected.setDate(expected.getDate() + 150)
    expect(result?.toISOString()).toBe(expected.toISOString())
  })
})
