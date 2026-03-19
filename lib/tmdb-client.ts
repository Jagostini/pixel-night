/**
 * TMDb HTTP client with concurrency control and 429 retry.
 *
 * - Limits parallel requests to MAX_CONCURRENT (protects against burst in Promise.all)
 * - Retries once after RETRY_DELAY_MS when TMDb returns 429
 */
import pLimit from "p-limit"

const MAX_CONCURRENT = 8
const RETRY_DELAY_MS = 1000
const MAX_RETRIES = 2

export const tmdbLimiter = pLimit(MAX_CONCURRENT)

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function tmdbFetch(
  url: string,
  headers: HeadersInit,
  attempt = 1
): Promise<Response> {
  const res = await fetch(url, { headers })

  if (res.status === 429 && attempt < MAX_RETRIES) {
    await sleep(RETRY_DELAY_MS * attempt)
    return tmdbFetch(url, headers, attempt + 1)
  }

  return res
}
