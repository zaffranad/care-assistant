import { describe, it, expect } from "vitest";
import { occurredAtRange, dateStringRange } from "@/lib/query-utils";

describe("occurredAtRange", () => {
  it("builds UTC day bounds for a single date", () => {
    const range = occurredAtRange("2026-01-05", null, null);
    expect(range?.gte.toISOString()).toBe("2026-01-05T00:00:00.000Z");
    expect(range?.lte.toISOString()).toBe("2026-01-05T23:59:59.999Z");
  });

  it("builds UTC bounds for a from/to range", () => {
    const range = occurredAtRange(null, "2026-01-01", "2026-01-31");
    expect(range?.gte.toISOString()).toBe("2026-01-01T00:00:00.000Z");
    expect(range?.lte.toISOString()).toBe("2026-01-31T23:59:59.999Z");
  });

  it("returns undefined when no usable params are provided", () => {
    expect(occurredAtRange(null, null, null)).toBeUndefined();
    expect(occurredAtRange(null, "2026-01-01", null)).toBeUndefined();
  });
});

describe("dateStringRange", () => {
  it("returns the exact date string for a single date", () => {
    expect(dateStringRange("2026-01-05", null, null)).toBe("2026-01-05");
  });

  it("returns a gte/lte object for a from/to range", () => {
    expect(dateStringRange(null, "2026-01-01", "2026-01-31")).toEqual({
      gte: "2026-01-01",
      lte: "2026-01-31",
    });
  });

  it("returns undefined when no usable params are provided", () => {
    expect(dateStringRange(null, null, null)).toBeUndefined();
    expect(dateStringRange(null, null, "2026-01-31")).toBeUndefined();
  });
});
