import { describe, it, expect } from "vitest"
import { parseDurationToMinutes, formatDurationFromMinutes } from "@/lib/duration"

describe("parseDurationToMinutes", () => {
  describe("pure numbers", () => {
    it("parses a plain integer as minutes", () => {
      expect(parseDurationToMinutes("60")).toBe(60)
    })
    it("parses '1' as 1 minute", () => {
      expect(parseDurationToMinutes("1")).toBe(1)
    })
    it("returns null for '0'", () => {
      expect(parseDurationToMinutes("0")).toBeNull()
    })
  })

  describe("minutes", () => {
    it("parses '30min'", () => {
      expect(parseDurationToMinutes("30min")).toBe(30)
    })
    it("parses '30 min'", () => {
      expect(parseDurationToMinutes("30 min")).toBe(30)
    })
    it("parses '30minutes'", () => {
      expect(parseDurationToMinutes("30minutes")).toBe(30)
    })
    it("parses '45 minute'", () => {
      expect(parseDurationToMinutes("45 minute")).toBe(45)
    })
  })

  describe("hours", () => {
    it("parses '1h'", () => {
      expect(parseDurationToMinutes("1h")).toBe(60)
    })
    it("parses '2h'", () => {
      expect(parseDurationToMinutes("2h")).toBe(120)
    })
    it("parses '1 h'", () => {
      expect(parseDurationToMinutes("1 h")).toBe(60)
    })
    it("parses '2heure'", () => {
      expect(parseDurationToMinutes("2heure")).toBe(120)
    })
    it("parses '2heures'", () => {
      expect(parseDurationToMinutes("2heures")).toBe(120)
    })
  })

  describe("hours + bare minutes", () => {
    it("parses '1h30'", () => {
      expect(parseDurationToMinutes("1h30")).toBe(90)
    })
    it("parses '1h 30'", () => {
      expect(parseDurationToMinutes("1h 30")).toBe(90)
    })
    it("parses '2h15'", () => {
      expect(parseDurationToMinutes("2h15")).toBe(135)
    })
    it("parses '0h45'", () => {
      expect(parseDurationToMinutes("0h45")).toBe(45)
    })
  })

  describe("days", () => {
    it("parses '1j'", () => {
      expect(parseDurationToMinutes("1j")).toBe(1440)
    })
    it("parses '2j'", () => {
      expect(parseDurationToMinutes("2j")).toBe(2880)
    })
    it("parses '1 jour'", () => {
      expect(parseDurationToMinutes("1 jour")).toBe(1440)
    })
    it("parses '2 jours'", () => {
      expect(parseDurationToMinutes("2 jours")).toBe(2880)
    })
    it("parses '3jours'", () => {
      expect(parseDurationToMinutes("3jours")).toBe(4320)
    })
  })

  describe("combinations", () => {
    it("parses '1j12h'", () => {
      expect(parseDurationToMinutes("1j12h")).toBe(1440 + 720)
    })
    it("parses '2 jours 3h'", () => {
      expect(parseDurationToMinutes("2 jours 3h")).toBe(2880 + 180)
    })
    it("parses '1j 1h30'", () => {
      expect(parseDurationToMinutes("1j 1h30")).toBe(1440 + 90)
    })
    it("parses '2j 3h 15min'", () => {
      expect(parseDurationToMinutes("2j 3h 15min")).toBe(2880 + 180 + 15)
    })
  })

  describe("invalid / empty", () => {
    it("returns null for empty string", () => {
      expect(parseDurationToMinutes("")).toBeNull()
    })
    it("returns null for whitespace", () => {
      expect(parseDurationToMinutes("   ")).toBeNull()
    })
    it("returns null for unrecognised text", () => {
      expect(parseDurationToMinutes("demain")).toBeNull()
    })
    it("returns null for letters only", () => {
      expect(parseDurationToMinutes("abc")).toBeNull()
    })
  })
})

describe("formatDurationFromMinutes", () => {
  it("formats minutes only", () => {
    expect(formatDurationFromMinutes(45)).toBe("45min")
  })
  it("formats exact hours", () => {
    expect(formatDurationFromMinutes(60)).toBe("1h")
    expect(formatDurationFromMinutes(120)).toBe("2h")
  })
  it("formats hours with minutes", () => {
    expect(formatDurationFromMinutes(90)).toBe("1h30")
    expect(formatDurationFromMinutes(135)).toBe("2h15")
  })
  it("formats exact days", () => {
    expect(formatDurationFromMinutes(1440)).toBe("1 jour")
    expect(formatDurationFromMinutes(2880)).toBe("2 jours")
  })
  it("formats days + hours", () => {
    expect(formatDurationFromMinutes(1440 + 180)).toBe("1 jour 3h")
  })
  it("formats days + hours + minutes", () => {
    expect(formatDurationFromMinutes(2880 + 90)).toBe("2 jours 1h30")
  })
  it("handles 0 gracefully", () => {
    expect(formatDurationFromMinutes(0)).toBe("0min")
  })

  describe("round-trip with parseDurationToMinutes", () => {
    const cases = [30, 60, 90, 120, 1440, 2880, 2880 + 90]
    for (const mins of cases) {
      it(`round-trips ${mins} minutes`, () => {
        const formatted = formatDurationFromMinutes(mins)
        expect(parseDurationToMinutes(formatted)).toBe(mins)
      })
    }
  })
})
