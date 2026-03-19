import { version } from "@/package.json"

/**
 * Returns a display badge for the current build environment.
 * - production → "v1.3.0"
 * - preview    → "build #abc1234"
 * - other      → null (local dev, not shown)
 */
export function getBuildBadge(
  env = process.env.VERCEL_ENV,
  sha = process.env.VERCEL_GIT_COMMIT_SHA
): string | null {
  if (env === "production") return `v${version}`
  if (env === "preview") {
    const short = sha?.slice(0, 7)
    return short ? `build #${short}` : "preview"
  }
  return null
}
