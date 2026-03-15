/**
 * Retrieve the active TMDb API token.
 *
 * Priority:
 *  1. TMDB_API_READ_ACCESS_TOKEN env var (Vercel env / local .env.local)
 *  2. Encrypted token stored in sp_salles.tmdb_token_encrypted (requires ENCRYPTION_KEY)
 *
 * Pass a userId to fetch the token for a specific salle owner.
 * Without userId, fetches the first non-null stored token (works for single-admin setups).
 */
import { createAdminClient } from "@/lib/supabase/admin"
import { decrypt } from "@/lib/encryption"

export async function getActiveTmdbToken(userId?: string): Promise<string | null> {
  // 1. Env var takes priority
  const envToken = process.env.TMDB_API_READ_ACCESS_TOKEN
  if (envToken) return envToken

  // 2. DB fallback — requires ENCRYPTION_KEY
  const encKey = process.env.ENCRYPTION_KEY
  if (!encKey) return null

  try {
    const supabase = createAdminClient()
    let query = supabase
      .from("sp_salles")
      .select("tmdb_token_encrypted")
      .not("tmdb_token_encrypted", "is", null)
      .limit(1)

    if (userId) {
      query = query.eq("created_by", userId)
    }

    const { data } = await query.single()
    if (!data?.tmdb_token_encrypted) return null

    return await decrypt(data.tmdb_token_encrypted as string, encKey)
  } catch {
    return null
  }
}
