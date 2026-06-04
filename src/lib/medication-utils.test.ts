import { describe, it, expect } from "vitest";
import { computeMissedEntries } from "@/lib/medication-utils";
import type { MedicationResponse, MedicationLogResponse } from "@/lib/types";

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
