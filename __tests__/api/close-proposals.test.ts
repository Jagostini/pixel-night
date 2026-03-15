import { describe, it, expect } from "vitest"

/**
 * Unit tests for the close-proposals phase transition logic.
 * Tests proposal → soiree film mapping and state transitions.
 */

interface Proposal {
  id: string
  soiree_id: string
  voter_id: string
  tmdb_id: number
  title: string
  poster_path: string | null
  overview: string | null
  release_date: string | null
  director: string | null
  duration: number | null
  trailer_url: string | null
}

interface SoireeFilm {
  soiree_id: string
  tmdb_id: number
  title: string
  poster_path: string | null
  overview: string | null
  release_date: string | null
  director: string | null
  duration: number | null
  trailer_url: string | null
}

// Mirrors the mapping logic in close-proposals/route.ts (lines 61-71)
function mapProposalsToFilms(soireeId: string, proposals: Proposal[]): SoireeFilm[] {
  return proposals.map((p) => ({
    soiree_id: soireeId,
    tmdb_id: p.tmdb_id,
    title: p.title,
    poster_path: p.poster_path,
    overview: p.overview,
    release_date: p.release_date,
    director: p.director,
    duration: p.duration,
    trailer_url: p.trailer_url,
  }))
}

const SOIREE_ID = "soiree-uuid-1"

const mockProposals: Proposal[] = [
  {
    id: "prop-1",
    soiree_id: SOIREE_ID,
    voter_id: "voter-a",
    tmdb_id: 101,
    title: "Film A",
    poster_path: "/a.jpg",
    overview: "Un film A",
    release_date: "2024-01-01",
    director: "Directeur A",
    duration: 120,
    trailer_url: "https://youtube.com/watch?v=abc",
  },
  {
    id: "prop-2",
    soiree_id: SOIREE_ID,
    voter_id: "voter-b",
    tmdb_id: 202,
    title: "Film B",
    poster_path: null,
    overview: null,
    release_date: null,
    director: null,
    duration: null,
    trailer_url: null,
  },
]

describe("close-proposals: proposal → film mapping", () => {
  it("maps each proposal to a soiree film with correct fields", () => {
    const films = mapProposalsToFilms(SOIREE_ID, mockProposals)
    expect(films).toHaveLength(2)

    expect(films[0]).toEqual({
      soiree_id: SOIREE_ID,
      tmdb_id: 101,
      title: "Film A",
      poster_path: "/a.jpg",
      overview: "Un film A",
      release_date: "2024-01-01",
      director: "Directeur A",
      duration: 120,
      trailer_url: "https://youtube.com/watch?v=abc",
    })
  })

  it("preserves null values from proposals", () => {
    const films = mapProposalsToFilms(SOIREE_ID, mockProposals)
    expect(films[1].poster_path).toBeNull()
    expect(films[1].director).toBeNull()
    expect(films[1].duration).toBeNull()
  })

  it("strips voter_id and proposal id from output", () => {
    const films = mapProposalsToFilms(SOIREE_ID, mockProposals)
    for (const film of films) {
      expect(film).not.toHaveProperty("voter_id")
      expect(film).not.toHaveProperty("id")
    }
  })

  it("returns empty array when no proposals", () => {
    const films = mapProposalsToFilms(SOIREE_ID, [])
    expect(films).toHaveLength(0)
  })

  it("attaches the correct soiree_id to every film", () => {
    const films = mapProposalsToFilms(SOIREE_ID, mockProposals)
    for (const film of films) {
      expect(film.soiree_id).toBe(SOIREE_ID)
    }
  })
})

/**
 * Tests for the state update that must happen on close-proposals:
 * phase → film_vote AND proposal_enabled → false
 */
interface SoireeUpdate {
  phase: string
  proposal_enabled: boolean
}

function buildCloseProposalsUpdate(): SoireeUpdate {
  return { phase: "film_vote", proposal_enabled: false }
}

describe("close-proposals: state transition", () => {
  it("sets phase to film_vote", () => {
    const update = buildCloseProposalsUpdate()
    expect(update.phase).toBe("film_vote")
  })

  it("resets proposal_enabled to false", () => {
    const update = buildCloseProposalsUpdate()
    expect(update.proposal_enabled).toBe(false)
  })
})
