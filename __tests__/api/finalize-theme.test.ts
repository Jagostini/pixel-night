import { describe, it, expect } from "vitest"

/**
 * Unit tests for the tie-breaking logic used in finalize-theme.
 * Tests the pattern: find max votes → collect tied entries → pick random winner.
 */

interface ThemeEntry {
  theme_id: string
  vote_count: number
  theme?: { name: string }
}

function pickWinner(themes: ThemeEntry[]): ThemeEntry {
  const sorted = [...themes].sort((a, b) => b.vote_count - a.vote_count)
  const maxVotes = sorted[0].vote_count
  const tied = sorted.filter((t) => t.vote_count === maxVotes)
  return tied[Math.floor(Math.random() * tied.length)]
}

describe("finalize-theme tie-breaking logic", () => {
  it("returns the single winner when no tie", () => {
    const themes: ThemeEntry[] = [
      { theme_id: "a", vote_count: 5 },
      { theme_id: "b", vote_count: 3 },
      { theme_id: "c", vote_count: 1 },
    ]
    const winner = pickWinner(themes)
    expect(winner.theme_id).toBe("a")
  })

  it("returns one of the tied winners when there is a tie", () => {
    const themes: ThemeEntry[] = [
      { theme_id: "a", vote_count: 5 },
      { theme_id: "b", vote_count: 5 },
      { theme_id: "c", vote_count: 2 },
    ]
    const results = new Set<string>()
    for (let i = 0; i < 100; i++) {
      results.add(pickWinner(themes).theme_id)
    }
    // Both "a" and "b" should appear as winners
    expect(results.has("a")).toBe(true)
    expect(results.has("b")).toBe(true)
    // "c" should never win
    expect(results.has("c")).toBe(false)
  })

  it("handles all themes tied", () => {
    const themes: ThemeEntry[] = [
      { theme_id: "a", vote_count: 0 },
      { theme_id: "b", vote_count: 0 },
    ]
    const winner = pickWinner(themes)
    expect(["a", "b"]).toContain(winner.theme_id)
  })

  it("handles single theme", () => {
    const themes: ThemeEntry[] = [{ theme_id: "only", vote_count: 3 }]
    const winner = pickWinner(themes)
    expect(winner.theme_id).toBe("only")
  })
})
