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

if (!globalThis.crypto?.randomUUID) {
  let counter = 1
  Object.defineProperty(globalThis, "crypto", {
    value: { randomUUID: () => `00000000-0000-0000-0000-${String(counter++).padStart(12, "0")}` },
    writable: true,
  })
}

import { getVoterId } from "@/lib/voter"

// ---------------------------------------------------------------------------
// Voter isolation between salles
// ---------------------------------------------------------------------------
describe("vote isolation between salles", () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it("same person gets different voter IDs in different salles", () => {
    const idA = getVoterId("salle-alice")
    const idB = getVoterId("salle-bob")
    expect(idA).not.toBe(idB)
  })

  it("voter ID is stable within the same salle across calls", () => {
    const first = getVoterId("cine-des-potes")
    const second = getVoterId("cine-des-potes")
    expect(first).toBe(second)
  })

  it("voter ID is stable globally (no salle) across calls", () => {
    const first = getVoterId()
    const second = getVoterId()
    expect(first).toBe(second)
  })

  it("salle voter ID is independent from global voter ID", () => {
    const global = getVoterId()
    const scoped = getVoterId("ma-salle")
    expect(global).not.toBe(scoped)
  })

  it("stores each salle voter ID under its own localStorage key", () => {
    getVoterId("salle-a")
    getVoterId("salle-b")
    getVoterId()

    const keyA = localStorageMock.getItem("sp_voter_id_salle-a")
    const keyB = localStorageMock.getItem("sp_voter_id_salle-b")
    const keyGlobal = localStorageMock.getItem("sp_voter_id")

    expect(keyA).toBeTruthy()
    expect(keyB).toBeTruthy()
    expect(keyGlobal).toBeTruthy()
    expect(new Set([keyA, keyB, keyGlobal]).size).toBe(3) // all distinct
  })

  it("persists existing salle voter ID from localStorage", () => {
    localStorageMock.setItem("sp_voter_id_cine-jules", "persisted-uuid")
    const id = getVoterId("cine-jules")
    expect(id).toBe("persisted-uuid")
  })
})

// ---------------------------------------------------------------------------
// salleHref derivation logic
// ---------------------------------------------------------------------------
describe("salleHref logic", () => {
  it("returns /s/[slug] when slug is defined", () => {
    const slug = "cine-des-potes"
    const href = slug ? `/s/${slug}` : "/"
    expect(href).toBe("/s/cine-des-potes")
  })

  it("falls back to / when slug is undefined", () => {
    const slug: string | undefined = undefined
    const href = slug ? `/s/${slug}` : "/"
    expect(href).toBe("/")
  })

  it("falls back to / when slug is empty string", () => {
    const slug = ""
    const href = slug ? `/s/${slug}` : "/"
    expect(href).toBe("/")
  })
})
