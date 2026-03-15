import { describe, it, expect } from "vitest"

/**
 * Unit tests for the vote route error-handling logic.
 * Tests the pattern: check for UNIQUE constraint violation (23505) → 409.
 */

// Extracted logic mirroring vote-theme/route.ts and vote-film/route.ts
function classifyVoteError(errorCode: string | undefined): { status: number; message: string } {
  if (errorCode === "23505") {
    return { status: 409, message: "Vous avez deja vote" }
  }
  return { status: 500, message: "Erreur interne" }
}

describe("vote error classification", () => {
  it("returns 409 for UNIQUE constraint violation (23505)", () => {
    const result = classifyVoteError("23505")
    expect(result.status).toBe(409)
    expect(result.message).toBe("Vous avez deja vote")
  })

  it("returns 500 for unknown DB errors", () => {
    const result = classifyVoteError("42703")
    expect(result.status).toBe(500)
  })

  it("returns 500 when error code is undefined", () => {
    const result = classifyVoteError(undefined)
    expect(result.status).toBe(500)
  })
})

/**
 * Unit tests for vote count update logic.
 * Tests that vote counts are correctly derived from actual counts.
 */
function computeNewVoteCount(insertedCount: number | null): number {
  return insertedCount ?? 1
}

describe("vote count computation", () => {
  it("uses actual count when available", () => {
    expect(computeNewVoteCount(3)).toBe(3)
  })

  it("falls back to 1 when count is null", () => {
    expect(computeNewVoteCount(null)).toBe(1)
  })

  it("handles zero count", () => {
    expect(computeNewVoteCount(0)).toBe(0)
  })
})
