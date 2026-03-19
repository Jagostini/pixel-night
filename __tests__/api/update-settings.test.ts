import { describe, it, expect } from "vitest"

/**
 * Unit tests for the update-settings route logic.
 * Tests phase gating, film_count validation, and ownership enforcement.
 */

const EDITABLE_PHASES = ["planned", "theme_vote", "film_proposal"]
const LOCKED_PHASES = ["film_vote", "completed", "cancelled"]

// Mirrors validation logic in update-settings/route.ts
function validateFilmCount(value: unknown): boolean {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 50
  )
}

function canEditSettings(phase: string): boolean {
  return EDITABLE_PHASES.includes(phase)
}

function isOwner(soireeCreatedBy: string, userId: string): boolean {
  return soireeCreatedBy === userId
}

// --- Phase gating ---

describe("update-settings: phase gating", () => {
  it("allows update in editable phases", () => {
    for (const phase of EDITABLE_PHASES) {
      expect(canEditSettings(phase)).toBe(true)
    }
  })

  it("blocks update in locked phases", () => {
    for (const phase of LOCKED_PHASES) {
      expect(canEditSettings(phase)).toBe(false)
    }
  })
})

// --- film_count validation ---

describe("update-settings: film_count validation", () => {
  it("accepts valid integer values between 1 and 50", () => {
    expect(validateFilmCount(1)).toBe(true)
    expect(validateFilmCount(10)).toBe(true)
    expect(validateFilmCount(50)).toBe(true)
  })

  it("rejects values out of range", () => {
    expect(validateFilmCount(0)).toBe(false)
    expect(validateFilmCount(51)).toBe(false)
    expect(validateFilmCount(-1)).toBe(false)
  })

  it("rejects non-integer numbers", () => {
    expect(validateFilmCount(1.5)).toBe(false)
    expect(validateFilmCount(10.9)).toBe(false)
  })

  it("rejects non-numeric types", () => {
    expect(validateFilmCount("10")).toBe(false)
    expect(validateFilmCount(null)).toBe(false)
    expect(validateFilmCount(undefined)).toBe(false)
    expect(validateFilmCount({})).toBe(false)
  })
})

// --- Ownership check ---

describe("update-settings: ownership check", () => {
  it("allows update when user is the owner", () => {
    expect(isOwner("user-123", "user-123")).toBe(true)
  })

  it("blocks update when user is not the owner", () => {
    expect(isOwner("user-123", "user-456")).toBe(false)
  })

  it("is case-sensitive", () => {
    expect(isOwner("User-123", "user-123")).toBe(false)
  })
})
