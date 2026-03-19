import { describe, it, expect, vi, beforeEach } from "vitest"
import { tmdbFetch, tmdbLimiter } from "@/lib/tmdb-client"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

function makeResponse(status: number, body = {}) {
  return { status, ok: status < 400, json: async () => body } as Response
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
})

describe("tmdbFetch", () => {
  it("returns the response on success", async () => {
    mockFetch.mockResolvedValue(makeResponse(200, { results: [] }))
    const res = await tmdbFetch("https://api.tmdb.org/test", {})
    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it("retries once on 429 then returns the response", async () => {
    mockFetch
      .mockResolvedValueOnce(makeResponse(429))
      .mockResolvedValueOnce(makeResponse(200))

    const promise = tmdbFetch("https://api.tmdb.org/test", {})
    await vi.runAllTimersAsync()
    const res = await promise

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(res.status).toBe(200)
  })

  it("does not retry more than MAX_RETRIES times", async () => {
    mockFetch.mockResolvedValue(makeResponse(429))

    const promise = tmdbFetch("https://api.tmdb.org/test", {})
    await vi.runAllTimersAsync()
    const res = await promise

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(res.status).toBe(429)
  })

  it("does not retry on non-429 errors", async () => {
    mockFetch.mockResolvedValue(makeResponse(500))
    const res = await tmdbFetch("https://api.tmdb.org/test", {})
    expect(res.status).toBe(500)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

describe("tmdbLimiter", () => {
  it("runs tasks and returns their results", async () => {
    vi.useRealTimers()
    const results = await Promise.all([
      tmdbLimiter(() => Promise.resolve(1)),
      tmdbLimiter(() => Promise.resolve(2)),
      tmdbLimiter(() => Promise.resolve(3)),
    ])
    expect(results).toEqual([1, 2, 3])
  })
})
