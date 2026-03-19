import { describe, it, expect } from "vitest"
import { getBuildBadge } from "@/lib/build-info"

describe("getBuildBadge", () => {
  it("returns version tag in production", () => {
    const result = getBuildBadge("production", undefined)
    expect(result).toMatch(/^v\d+\.\d+\.\d+$/)
  })

  it("returns build hash in preview with SHA", () => {
    expect(getBuildBadge("preview", "abc1234def5678")).toBe("build #abc1234")
  })

  it("returns 'preview' when SHA is missing", () => {
    expect(getBuildBadge("preview", undefined)).toBe("preview")
  })

  it("returns null in development", () => {
    expect(getBuildBadge("development", "abc1234")).toBeNull()
  })

  it("returns null when env is undefined (local)", () => {
    expect(getBuildBadge(undefined, undefined)).toBeNull()
  })
})
