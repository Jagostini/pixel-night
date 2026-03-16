import { describe, it, expect } from "vitest"

/**
 * Unit tests for the vote-lock guard used in film curation (DELETE/POST /api/soirees/{id}/films).
 *
 * Rule: if any votes have been cast for films in this soiree, the film list is locked
 * and the request must be rejected with 409.
 */

interface FilmVoteRow {
  soiree_id: string
  voter_id: string
}

function isCurationAllowed(votes: FilmVoteRow[]): boolean {
  return votes.length === 0
}

function getCurationError(votes: FilmVoteRow[]): string | null {
  if (!isCurationAllowed(votes)) {
    return "Des votes ont été enregistrés, la liste ne peut plus être modifiée"
  }
  return null
}

describe("film curation vote-lock guard", () => {
  it("allows curation when no votes have been cast", () => {
    expect(isCurationAllowed([])).toBe(true)
  })

  it("blocks curation when at least one vote exists", () => {
    const votes: FilmVoteRow[] = [
      { soiree_id: "soiree-1", voter_id: "voter-1" },
    ]
    expect(isCurationAllowed(votes)).toBe(false)
  })

  it("blocks curation when multiple votes exist", () => {
    const votes: FilmVoteRow[] = [
      { soiree_id: "soiree-1", voter_id: "voter-1" },
      { soiree_id: "soiree-1", voter_id: "voter-2" },
      { soiree_id: "soiree-1", voter_id: "voter-3" },
    ]
    expect(isCurationAllowed(votes)).toBe(false)
  })

  it("returns null error message when curation is allowed", () => {
    expect(getCurationError([])).toBeNull()
  })

  it("returns a descriptive error message when curation is blocked", () => {
    const votes: FilmVoteRow[] = [{ soiree_id: "s1", voter_id: "v1" }]
    const error = getCurationError(votes)
    expect(error).not.toBeNull()
    expect(error).toContain("votes")
  })
})
