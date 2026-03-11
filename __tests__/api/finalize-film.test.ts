import { describe, it, expect } from "vitest"

/**
 * Unit tests for the tie-breaking logic used in finalize-film.
 * Tests the pattern: find max votes → collect tied entries → pick random winner.
 */

interface FilmEntry {
  tmdb_id: number
  title: string
  vote_count: number
}

function pickWinner(films: FilmEntry[]): FilmEntry {
  const sorted = [...films].sort((a, b) => b.vote_count - a.vote_count)
  const maxVotes = sorted[0].vote_count
  const tied = sorted.filter((f) => f.vote_count === maxVotes)
  return tied[Math.floor(Math.random() * tied.length)]
}

describe("finalize-film tie-breaking logic", () => {
  it("returns the single winner when no tie", () => {
    const films: FilmEntry[] = [
      { tmdb_id: 1, title: "Film A", vote_count: 7 },
      { tmdb_id: 2, title: "Film B", vote_count: 4 },
      { tmdb_id: 3, title: "Film C", vote_count: 2 },
    ]
    const winner = pickWinner(films)
    expect(winner.tmdb_id).toBe(1)
  })

  it("returns one of the tied winners when there is a tie", () => {
    const films: FilmEntry[] = [
      { tmdb_id: 1, title: "Film A", vote_count: 6 },
      { tmdb_id: 2, title: "Film B", vote_count: 6 },
      { tmdb_id: 3, title: "Film C", vote_count: 1 },
    ]
    const results = new Set<number>()
    for (let i = 0; i < 100; i++) {
      results.add(pickWinner(films).tmdb_id)
    }
    expect(results.has(1)).toBe(true)
    expect(results.has(2)).toBe(true)
    expect(results.has(3)).toBe(false)
  })

  it("handles all films tied at zero votes", () => {
    const films: FilmEntry[] = [
      { tmdb_id: 1, title: "Film A", vote_count: 0 },
      { tmdb_id: 2, title: "Film B", vote_count: 0 },
    ]
    const winner = pickWinner(films)
    expect([1, 2]).toContain(winner.tmdb_id)
  })

  it("handles single film", () => {
    const films: FilmEntry[] = [{ tmdb_id: 42, title: "Only Film", vote_count: 10 }]
    const winner = pickWinner(films)
    expect(winner.tmdb_id).toBe(42)
  })
})
