import { describe, it, expect } from "vitest"
import { encrypt, decrypt } from "@/lib/encryption"

const KEY = "a".repeat(64) // valid 32-byte hex key (all 'a's)
const WRONG_KEY = "b".repeat(64)

describe("encrypt", () => {
  it("returns a JSON string with iv and ct fields", async () => {
    const result = await encrypt("hello", KEY)
    const parsed = JSON.parse(result)
    expect(parsed).toHaveProperty("iv")
    expect(parsed).toHaveProperty("ct")
    expect(typeof parsed.iv).toBe("string")
    expect(typeof parsed.ct).toBe("string")
  })

  it("produces different ciphertexts for the same plaintext (random IV)", async () => {
    const a = await encrypt("hello", KEY)
    const b = await encrypt("hello", KEY)
    expect(a).not.toBe(b)
    // IVs must differ
    expect(JSON.parse(a).iv).not.toBe(JSON.parse(b).iv)
  })

  it("throws when key is not 64 hex chars", async () => {
    await expect(encrypt("hello", "tooshort")).rejects.toThrow()
  })
})

describe("decrypt", () => {
  it("round-trips a short string", async () => {
    const ciphertext = await encrypt("hello world", KEY)
    expect(await decrypt(ciphertext, KEY)).toBe("hello world")
  })

  it("round-trips a long string (TMDb JWT-like token)", async () => {
    const token = "eyJhbGciOiJIUzI1NiJ9." + "x".repeat(200)
    const ciphertext = await encrypt(token, KEY)
    expect(await decrypt(ciphertext, KEY)).toBe(token)
  })

  it("round-trips a string with special characters", async () => {
    const plaintext = "café & résumé: 100%"
    expect(await decrypt(await encrypt(plaintext, KEY), KEY)).toBe(plaintext)
  })

  it("fails with the wrong key", async () => {
    const ciphertext = await encrypt("secret", KEY)
    await expect(decrypt(ciphertext, WRONG_KEY)).rejects.toThrow()
  })

  it("fails when ciphertext is tampered", async () => {
    const ciphertext = await encrypt("secret", KEY)
    const parsed = JSON.parse(ciphertext)
    // Flip one character in the ciphertext
    parsed.ct = parsed.ct.slice(0, -1) + (parsed.ct.endsWith("A") ? "B" : "A")
    await expect(decrypt(JSON.stringify(parsed), KEY)).rejects.toThrow()
  })

  it("fails when iv is tampered", async () => {
    const ciphertext = await encrypt("secret", KEY)
    const parsed = JSON.parse(ciphertext)
    parsed.iv = parsed.iv.slice(0, -1) + (parsed.iv.endsWith("A") ? "B" : "A")
    await expect(decrypt(JSON.stringify(parsed), KEY)).rejects.toThrow()
  })

  it("throws when key is not 64 hex chars", async () => {
    const ciphertext = await encrypt("hello", KEY)
    await expect(decrypt(ciphertext, "short")).rejects.toThrow()
  })
})
