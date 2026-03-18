import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { getActiveTmdbToken } from "@/lib/tmdb-token"

beforeEach(() => vi.unstubAllEnvs())
afterEach(() => vi.unstubAllEnvs())

describe("getActiveTmdbToken", () => {
  it("returns the env var when set", () => {
    vi.stubEnv("TMDB_API_READ_ACCESS_TOKEN", "my-token")
    expect(getActiveTmdbToken()).toBe("my-token")
  })

  it("returns null when env var is not set", () => {
    vi.stubEnv("TMDB_API_READ_ACCESS_TOKEN", "")
    expect(getActiveTmdbToken()).toBeNull()
  })
})
