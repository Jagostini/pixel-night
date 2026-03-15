import { describe, it, expect } from "vitest"
import { tmdbPoster, tmdbBackdrop, tmdbHeaders } from "@/lib/tmdb"

describe("tmdbPoster", () => {
  it("returns placeholder when path is null", () => {
    expect(tmdbPoster(null)).toBe("/placeholder-movie.svg")
  })

  it("returns correct URL for a given path", () => {
    expect(tmdbPoster("/abc.jpg")).toBe("https://image.tmdb.org/t/p/w500/abc.jpg")
  })

  it("uses custom size", () => {
    expect(tmdbPoster("/abc.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/abc.jpg")
  })

  it("uses original size", () => {
    expect(tmdbPoster("/abc.jpg", "original")).toBe(
      "https://image.tmdb.org/t/p/original/abc.jpg"
    )
  })
})

describe("tmdbBackdrop", () => {
  it("returns empty string when path is null", () => {
    expect(tmdbBackdrop(null)).toBe("")
  })

  it("returns correct URL for a given path", () => {
    expect(tmdbBackdrop("/back.jpg")).toBe(
      "https://image.tmdb.org/t/p/w1280/back.jpg"
    )
  })

  it("uses w780 size", () => {
    expect(tmdbBackdrop("/back.jpg", "w780")).toBe(
      "https://image.tmdb.org/t/p/w780/back.jpg"
    )
  })
})

describe("tmdbHeaders", () => {
  it("includes Authorization bearer token from the given token", () => {
    const headers = tmdbHeaders("my-token-xyz") as Record<string, string>
    expect(headers["Authorization"]).toBe("Bearer my-token-xyz")
  })

  it("includes Content-Type header", () => {
    const headers = tmdbHeaders("any-token") as Record<string, string>
    expect(headers["Content-Type"]).toBe("application/json;charset=utf-8")
  })

  it("uses the exact token passed, without modification", () => {
    const token = "eyJhbGciOiJIUzI1NiJ9.some.payload"
    const headers = tmdbHeaders(token) as Record<string, string>
    expect(headers["Authorization"]).toBe(`Bearer ${token}`)
  })
})
