import { describe, it, expect } from "vitest";
import {
  computeMissedEntries,
  buildIntakeSuggestions,
  filterIntakeSuggestions,
  normalizeMedicationName,
} from "@/lib/medication-utils";
import type { MedicationResponse, MedicationLogResponse, MedicationIntakeResponse } from "@/lib/types";

function makeMed(overrides: Partial<MedicationResponse> = {}): MedicationResponse {
  return {
    id: "med-1",
    name: "Doliprane",
    dosage: 500,
    time: "08:00",
    active: true,
    createdAt: "2025-12-01T08:00:00.000Z",
    updatedAt: "2025-12-01T08:00:00.000Z",
    ...overrides,
  };
}

function makeLog(overrides: Partial<MedicationLogResponse> = {}): MedicationLogResponse {
  return {
    id: "log-1",
    medicationId: "med-1",
    takenAt: "2026-01-02T08:00:00.000Z",
    scheduledAt: "2026-01-02T08:00:00.000Z",
    deltaMinutes: 0,
    date: "2026-01-02",
    createdAt: "2026-01-02T08:00:00.000Z",
    ...overrides,
  };
}

function makeIntake(overrides: Partial<MedicationIntakeResponse> = {}): MedicationIntakeResponse {
  return {
    id: "intake-1",
    name: "Doliprane",
    dosage: 500,
    notes: null,
    takenAt: "2026-01-02T18:00:00.000Z",
    createdAt: "2026-01-02T18:00:00.000Z",
    ...overrides,
  };
}

describe("computeMissedEntries", () => {
  it("returns an empty array when there are no medications", () => {
    expect(computeMissedEntries([], [], "2026-01-01", "2026-01-03")).toEqual([]);
  });

  it("flags every day with no log over the range", () => {
    const missed = computeMissedEntries([makeMed()], [], "2026-01-01", "2026-01-03");
    expect(missed).toHaveLength(3);
    expect(missed.map((m) => m.date)).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
    ]);
    expect(missed[0].scheduledTime).toBe("08:00");
  });

  it("excludes days that already have a log", () => {
    const missed = computeMissedEntries(
      [makeMed()],
      [makeLog({ date: "2026-01-02" })],
      "2026-01-01",
      "2026-01-03"
    );
    expect(missed.map((m) => m.date)).toEqual(["2026-01-01", "2026-01-03"]);
  });

  it("ignores days before the medication was created", () => {
    const missed = computeMissedEntries(
      [makeMed({ createdAt: "2026-01-02T08:00:00.000Z" })],
      [],
      "2026-01-01",
      "2026-01-03"
    );
    expect(missed.map((m) => m.date)).toEqual(["2026-01-02", "2026-01-03"]);
  });

  it("returns an empty array when the range is inverted", () => {
    expect(
      computeMissedEntries([makeMed()], [], "2026-01-05", "2026-01-01")
    ).toEqual([]);
  });
});

describe("normalizeMedicationName", () => {
  it("trims, lowercases and strips accents", () => {
    expect(normalizeMedicationName("  Paracétamol ")).toBe("paracetamol");
  });
});

describe("buildIntakeSuggestions", () => {
  it("keeps the most recent dosage per name, intakes first", () => {
    const suggestions = buildIntakeSuggestions(
      [
        makeIntake({ id: "i1", name: "Doliprane", dosage: 1000 }),
        makeIntake({ id: "i2", name: "doliprane", dosage: 500 }),
        makeIntake({ id: "i3", name: "Spasfon", dosage: 80 }),
      ],
      [makeMed({ name: "Levothyrox", dosage: 75 })]
    );
    expect(suggestions).toEqual([
      { name: "Doliprane", dosage: 1000 },
      { name: "Spasfon", dosage: 80 },
      { name: "Levothyrox", dosage: 75 },
    ]);
  });

  it("dedupes regular medications already present as intakes, accent-insensitively", () => {
    const suggestions = buildIntakeSuggestions(
      [makeIntake({ name: "Paracétamol", dosage: 500 })],
      [makeMed({ name: "paracetamol", dosage: 1000 })]
    );
    expect(suggestions).toEqual([{ name: "Paracétamol", dosage: 500 }]);
  });

  it("ignores blank names", () => {
    expect(buildIntakeSuggestions([makeIntake({ name: "   " })], [])).toEqual([]);
  });
});

describe("filterIntakeSuggestions", () => {
  const suggestions = [
    { name: "Doliprane", dosage: 500 },
    { name: "Spasfon", dosage: 80 },
    { name: "Tradolan", dosage: 50 },
  ];

  it("returns everything for an empty query", () => {
    expect(filterIntakeSuggestions(suggestions, "")).toEqual(suggestions);
  });

  it("matches case-insensitively, prefix matches first", () => {
    expect(filterIntakeSuggestions(suggestions, "dol")).toEqual([
      { name: "Doliprane", dosage: 500 },
      { name: "Tradolan", dosage: 50 },
    ]);
  });

  it("returns nothing when the query is an exact name", () => {
    expect(filterIntakeSuggestions(suggestions, "doliprane")).toEqual([]);
  });
});
