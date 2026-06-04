import { describe, it, expect } from "vitest";
import {
  BRISTOL_SCALE,
  BRISTOL_LABELS,
  getBristolInfo,
  getBristolCategory,
} from "@/lib/bristol";

describe("BRISTOL_SCALE", () => {
  it("has 7 entries numbered 1..7", () => {
    expect(BRISTOL_SCALE).toHaveLength(7);
    expect(BRISTOL_SCALE.map((b) => b.type)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe("BRISTOL_LABELS", () => {
  it("is derived from the scale descriptions", () => {
    expect(BRISTOL_LABELS[4]).toBe("Lisse et souple");
    expect(BRISTOL_LABELS[7]).toBe("Liquide, sans morceaux");
  });
});

describe("getBristolCategory", () => {
  it("maps types to clinical categories", () => {
    expect(getBristolCategory(1)).toBe("Constipation");
    expect(getBristolCategory(2)).toBe("Constipation");
    expect(getBristolCategory(3)).toBe("Normal");
    expect(getBristolCategory(4)).toBe("Normal");
    expect(getBristolCategory(5)).toBe("Mou");
    expect(getBristolCategory(6)).toBe("Diarrhée");
    expect(getBristolCategory(7)).toBe("Diarrhée");
  });
});

describe("getBristolInfo", () => {
  it("returns the matching entry", () => {
    expect(getBristolInfo(4).emoji).toBe("🟢");
  });

  it("falls back to type 4 for out-of-range values", () => {
    expect(getBristolInfo(99).type).toBe(4);
    expect(getBristolInfo(0).type).toBe(4);
  });
});
