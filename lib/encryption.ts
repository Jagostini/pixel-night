/**
 * AES-256-GCM encryption helpers using the Web Crypto API.
 *
 * The ENCRYPTION_KEY env var must be a 64-character hex string (32 bytes).
 * Generate one with:  openssl rand -hex 32
 *
 * Storage format: JSON { iv: base64, ct: base64 }
 * (AES-GCM appends the 16-byte auth tag to the ciphertext automatically)
 */

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function importKey(
  keyHex: string,
  usage: "encrypt" | "decrypt"
): Promise<CryptoKey> {
  if (keyHex.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)")
  }
  return crypto.subtle.importKey(
    "raw",
    hexToBytes(keyHex),
    { name: "AES-GCM" },
    false,
    [usage]
  )
}

export async function encrypt(plaintext: string, keyHex: string): Promise<string> {
  const key = await importKey(keyHex, "encrypt")
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded)
  return JSON.stringify({
    iv: bytesToBase64(iv),
    ct: bytesToBase64(new Uint8Array(ciphertext)),
  })
}

export async function decrypt(stored: string, keyHex: string): Promise<string> {
  const { iv, ct } = JSON.parse(stored) as { iv: string; ct: string }
  const key = await importKey(keyHex, "decrypt")
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    key,
    base64ToBytes(ct)
  )
  return new TextDecoder().decode(plaintext)
}
