import { describe, it, expect } from "vitest";
import { computePeriodMetrics, computeTrend } from "@/lib/report-metrics";
import type {
  SymptomResponse,
  MedicationLogResponse,
  MissedMedicationEntry,
  BowelMovementResponse,
  SignificantEventResponse,
} from "@/lib/types";

function makeSymptom(overrides: Partial<SymptomResponse> = {}): SymptomResponse {
  return {
    id: "symp-1",
    name: "Migraine",
    intensity: 5,
    notes: null,
    occurredAt: "2026-01-02T10:00:00.000Z",
    createdAt: "2026-01-02T10:00:00.000Z",
    updatedAt: "2026-01-02T10:00:00.000Z",
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

function makeMissed(overrides: Partial<MissedMedicationEntry> = {}): MissedMedicationEntry {
  return {
    medicationId: "med-1",
    medication: {
      id: "med-1",
      name: "Doliprane",
      dosage: 500,
      time: "08:00",
      active: true,
      createdAt: "2025-12-01T08:00:00.000Z",
      updatedAt: "2025-12-01T08:00:00.000Z",
    },
    date: "2026-01-03",
    scheduledTime: "08:00",
    ...overrides,
  };
}

function makeBowel(overrides: Partial<BowelMovementResponse> = {}): BowelMovementResponse {
  return {
    id: "bm-1",
    bristolType: 4,
    notes: null,
    occurredAt: "2026-01-02T09:00:00.000Z",
    createdAt: "2026-01-02T09:00:00.000Z",
    ...overrides,
  };
}

function makeEvent(overrides: Partial<SignificantEventResponse> = {}): SignificantEventResponse {
  return {
    id: "ev-1",
    text: "Repas copieux",
    date: "2026-01-02",
    time: "20:00",
    createdAt: "2026-01-02T20:00:00.000Z",
    updatedAt: "2026-01-02T20:00:00.000Z",
    ...overrides,
  };
}

const emptyInput = {
  symptoms: [],
  medLogs: [],
  missedMedications: [],
  bowelMovements: [],
  significantEvents: [],
};

describe("computePeriodMetrics", () => {
  it("returns zeroed metrics with null averages on empty input", () => {
    const m = computePeriodMetrics(emptyInput);
    expect(m.symptomCount).toBe(0);
    expect(m.symptomDayCount).toBe(0);
    expect(m.avgIntensity).toBeNull();
    expect(m.maxIntensity).toBeNull();
    expect(m.topSymptoms).toEqual([]);
    expect(m.adherenceRate).toBeNull();
    expect(m.avgBristol).toBeNull();
    expect(m.bristolNormalRate).toBeNull();
    expect(m.eventCount).toBe(0);
  });

  it("computes symptom count, distinct days and intensity stats", () => {
    const m = computePeriodMetrics({
      ...emptyInput,
      symptoms: [
        makeSymptom({ id: "a", intensity: 4, occurredAt: "2026-01-02T10:00:00.000Z" }),
        makeSymptom({ id: "b", intensity: 8, occurredAt: "2026-01-02T18:00:00.000Z" }),
        makeSymptom({ id: "c", intensity: 6, occurredAt: "2026-01-03T10:00:00.000Z" }),
      ],
    });
    expect(m.symptomCount).toBe(3);
    expect(m.symptomDayCount).toBe(2);
    expect(m.avgIntensity).toBe(6);
    expect(m.maxIntensity).toBe(8);
  });

  it("ranks top symptoms by count then name", () => {
    const m = computePeriodMetrics({
      ...emptyInput,
      symptoms: [
        makeSymptom({ id: "a", name: "Nausée" }),
        makeSymptom({ id: "b", name: "Migraine" }),
        makeSymptom({ id: "c", name: "Nausée" }),
        makeSymptom({ id: "d", name: "Fatigue" }),
      ],
    });
    expect(m.topSymptoms).toEqual([
      { name: "Nausée", count: 2 },
      { name: "Fatigue", count: 1 },
      { name: "Migraine", count: 1 },
    ]);
  });

  it("computes medication adherence from taken and missed doses", () => {
    const m = computePeriodMetrics({
      ...emptyInput,
      medLogs: [makeLog({ id: "a" }), makeLog({ id: "b" }), makeLog({ id: "c" })],
      missedMedications: [makeMissed()],
    });
    expect(m.dosesTaken).toBe(3);
    expect(m.dosesMissed).toBe(1);
    expect(m.adherenceRate).toBe(75);
  });

  it("computes bristol average and normal-zone rate", () => {
    const m = computePeriodMetrics({
      ...emptyInput,
      bowelMovements: [
        makeBowel({ id: "a", bristolType: 3 }),
        makeBowel({ id: "b", bristolType: 4 }),
        makeBowel({ id: "c", bristolType: 6 }),
        makeBowel({ id: "d", bristolType: 7 }),
      ],
    });
    expect(m.bowelCount).toBe(4);
    expect(m.avgBristol).toBe(5);
    expect(m.bristolNormalRate).toBe(50);
  });

  it("counts significant events", () => {
    const m = computePeriodMetrics({
      ...emptyInput,
      significantEvents: [makeEvent({ id: "a" }), makeEvent({ id: "b" })],
    });
    expect(m.eventCount).toBe(2);
  });
});

describe("computeTrend", () => {
  it("returns null when either value is missing", () => {
    expect(computeTrend(null, 5)).toBeNull();
    expect(computeTrend(5, null)).toBeNull();
  });

  it("computes delta and relative percent", () => {
    expect(computeTrend(15, 10)).toEqual({ delta: 5, percent: 50 });
    expect(computeTrend(5, 10)).toEqual({ delta: -5, percent: -50 });
  });

  it("returns a null percent when the previous value is 0", () => {
    expect(computeTrend(3, 0)).toEqual({ delta: 3, percent: null });
  });

  it("handles equal values", () => {
    expect(computeTrend(10, 10)).toEqual({ delta: 0, percent: 0 });
  });
});
