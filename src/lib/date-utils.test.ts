import { describe, it, expect } from "vitest";
import { formatDelta } from "@/lib/date-utils";

describe("formatDelta", () => {
  it("returns 'à l'heure' for zero", () => {
    expect(formatDelta(0)).toBe("à l'heure");
  });

  it("formats positive minutes", () => {
    expect(formatDelta(45)).toBe("+45min");
  });

  it("formats whole positive hours", () => {
    expect(formatDelta(60)).toBe("+1h");
  });

  it("formats positive hours and minutes with zero-padding", () => {
    expect(formatDelta(90)).toBe("+1h30");
    expect(formatDelta(65)).toBe("+1h05");
  });

  it("uses the minus sign (U+2212) for negative deltas", () => {
    expect(formatDelta(-45)).toBe("−45min");
    expect(formatDelta(-90)).toBe("−1h30");
  });
});
