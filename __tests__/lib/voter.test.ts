import { describe, it, expect, beforeEach } from "vitest"

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
})

// crypto.randomUUID is available in happy-dom; if not, polyfill
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, "crypto", {
    value: { randomUUID: () => "00000000-0000-0000-0000-000000000001" },
    writable: true,
  })
}

import { getVoterId } from "@/lib/voter"

describe("getVoterId", () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it("creates and stores a new voter ID when none exists", () => {
    const id = getVoterId()
    expect(id).toBeTruthy()
    expect(typeof id).toBe("string")
    expect(localStorageMock.getItem("sp_voter_id")).toBe(id)
  })

  it("returns the same voter ID on subsequent calls", () => {
    const id1 = getVoterId()
    const id2 = getVoterId()
    expect(id1).toBe(id2)
  })

  it("returns existing voter ID from localStorage", () => {
    localStorageMock.setItem("sp_voter_id", "existing-voter-uuid")
    const id = getVoterId()
    expect(id).toBe("existing-voter-uuid")
  })

  it("creates a separate voter ID per salle slug", () => {
    const idA = getVoterId("salle-a")
    const idB = getVoterId("salle-b")
    expect(idA).toBeTruthy()
    expect(idB).toBeTruthy()
    expect(idA).not.toBe(idB)
    expect(localStorageMock.getItem("sp_voter_id_salle-a")).toBe(idA)
    expect(localStorageMock.getItem("sp_voter_id_salle-b")).toBe(idB)
  })

  it("scoped voter ID is independent from global voter ID", () => {
    const global = getVoterId()
    const scoped = getVoterId("my-salle")
    expect(global).not.toBe(scoped)
  })
})
