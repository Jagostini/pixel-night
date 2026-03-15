import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// Mock Supabase admin client
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}))

// Mock encryption
vi.mock("@/lib/encryption", () => ({
  decrypt: vi.fn(),
}))

import { getActiveTmdbToken } from "@/lib/tmdb-token"
import { createAdminClient } from "@/lib/supabase/admin"
import { decrypt } from "@/lib/encryption"

const mockDecrypt = vi.mocked(decrypt)
const mockCreateAdminClient = vi.mocked(createAdminClient)

function makeSupabaseMock(tokenEncrypted: string | null) {
  const single = vi.fn().mockResolvedValue({
    data: tokenEncrypted ? { tmdb_token_encrypted: tokenEncrypted } : null,
    error: null,
  })
  const limit = vi.fn().mockReturnValue({ single })
  const not = vi.fn().mockReturnValue({ limit })
  const eq = vi.fn().mockReturnValue({ limit })
  // not().limit() and eq().limit() both work:
  not.mockReturnValue({ limit, eq })
  const select = vi.fn().mockReturnValue({ not, eq })
  const from = vi.fn().mockReturnValue({ select })
  return { from } as unknown as ReturnType<typeof createAdminClient>
}

beforeEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("getActiveTmdbToken — env var priority", () => {
  it("returns the env var token without touching the DB", async () => {
    vi.stubEnv("TMDB_API_READ_ACCESS_TOKEN", "env-token-abc")
    const token = await getActiveTmdbToken()
    expect(token).toBe("env-token-abc")
    expect(mockCreateAdminClient).not.toHaveBeenCalled()
  })

  it("still returns env var even when ENCRYPTION_KEY is set", async () => {
    vi.stubEnv("TMDB_API_READ_ACCESS_TOKEN", "env-token-xyz")
    vi.stubEnv("ENCRYPTION_KEY", "a".repeat(64))
    const token = await getActiveTmdbToken()
    expect(token).toBe("env-token-xyz")
    expect(mockCreateAdminClient).not.toHaveBeenCalled()
  })
})

describe("getActiveTmdbToken — DB fallback", () => {
  beforeEach(() => {
    vi.stubEnv("TMDB_API_READ_ACCESS_TOKEN", "")
  })

  it("returns null when ENCRYPTION_KEY is not set", async () => {
    vi.stubEnv("ENCRYPTION_KEY", "")
    const token = await getActiveTmdbToken()
    expect(token).toBeNull()
    expect(mockCreateAdminClient).not.toHaveBeenCalled()
  })

  it("returns null when no stored token is found in DB", async () => {
    vi.stubEnv("ENCRYPTION_KEY", "a".repeat(64))
    mockCreateAdminClient.mockReturnValue(makeSupabaseMock(null))
    const token = await getActiveTmdbToken()
    expect(token).toBeNull()
    expect(mockDecrypt).not.toHaveBeenCalled()
  })

  it("decrypts and returns the stored token", async () => {
    vi.stubEnv("ENCRYPTION_KEY", "a".repeat(64))
    mockCreateAdminClient.mockReturnValue(makeSupabaseMock("encrypted-blob"))
    mockDecrypt.mockResolvedValue("decrypted-token")

    const token = await getActiveTmdbToken()
    expect(mockDecrypt).toHaveBeenCalledWith("encrypted-blob", "a".repeat(64))
    expect(token).toBe("decrypted-token")
  })

  it("returns null when decrypt throws", async () => {
    vi.stubEnv("ENCRYPTION_KEY", "a".repeat(64))
    mockCreateAdminClient.mockReturnValue(makeSupabaseMock("corrupted-blob"))
    mockDecrypt.mockRejectedValue(new Error("decrypt failed"))

    const token = await getActiveTmdbToken()
    expect(token).toBeNull()
  })

  it("returns null when Supabase throws", async () => {
    vi.stubEnv("ENCRYPTION_KEY", "a".repeat(64))
    mockCreateAdminClient.mockImplementation(() => {
      throw new Error("connection error")
    })
    const token = await getActiveTmdbToken()
    expect(token).toBeNull()
  })
})
