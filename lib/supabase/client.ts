// Supabase browser client – singleton
import { createBrowserClient } from "@supabase/ssr"

let _client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

  if (!url || !key) {
    throw new Error(
      "Supabase non configure : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY requis."
    )
  }

  _client = createBrowserClient(url, key)
  return _client
}
