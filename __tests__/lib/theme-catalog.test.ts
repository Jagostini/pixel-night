import { describe, it, expect } from "vitest"
import {
  THEME_CATALOG,
  TMDB_GENRES,
  TMDB_GENRE_LIST,
  type CatalogTheme,
} from "@/lib/theme-catalog"

const VALID_GENRE_IDS = new Set(Object.keys(TMDB_GENRES).map(Number))

describe("THEME_CATALOG", () => {
  it("contains exactly 30 themes", () => {
    expect(THEME_CATALOG).toHaveLength(30)
  })

  it("has no duplicate theme names", () => {
    const names = THEME_CATALOG.map((t: CatalogTheme) => t.name.toLowerCase())
    const unique = new Set(names)
    expect(unique.size).toBe(names.length)
  })

  it("every theme has at least one genre_id", () => {
    for (const theme of THEME_CATALOG) {
      expect(theme.genre_ids.length).toBeGreaterThan(0)
    }
  })

  it("all genre_ids reference valid TMDb genre IDs", () => {
    for (const theme of THEME_CATALOG) {
      for (const id of theme.genre_ids) {
        expect(VALID_GENRE_IDS.has(id), `Unknown genre_id ${id} in theme "${theme.name}"`).toBe(true)
      }
    }
  })

  it("every theme has at least one keyword", () => {
    for (const theme of THEME_CATALOG) {
      expect(theme.keywords.length).toBeGreaterThan(0)
    }
  })

  it("no theme has an empty name", () => {
    for (const theme of THEME_CATALOG) {
      expect(theme.name.trim().length).toBeGreaterThan(0)
    }
  })
})

describe("TMDB_GENRES", () => {
  it("contains exactly 18 genre entries", () => {
    expect(Object.keys(TMDB_GENRES)).toHaveLength(18)
  })

  it("all keys are numeric", () => {
    for (const key of Object.keys(TMDB_GENRES)) {
      expect(Number.isInteger(Number(key))).toBe(true)
    }
  })
})

describe("TMDB_GENRE_LIST", () => {
  it("has the same count as TMDB_GENRES", () => {
    expect(TMDB_GENRE_LIST).toHaveLength(Object.keys(TMDB_GENRES).length)
  })

  it("is sorted alphabetically by label (fr)", () => {
    for (let i = 1; i < TMDB_GENRE_LIST.length; i++) {
      const prev = TMDB_GENRE_LIST[i - 1].label
      const curr = TMDB_GENRE_LIST[i].label
      expect(
        prev.localeCompare(curr, "fr") <= 0,
        `"${prev}" should come before "${curr}"`
      ).toBe(true)
    }
  })

  it("each entry has a numeric id and a non-empty label", () => {
    for (const entry of TMDB_GENRE_LIST) {
      expect(typeof entry.id).toBe("number")
      expect(entry.label.trim().length).toBeGreaterThan(0)
    }
  })
})
