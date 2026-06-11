import type {
  SymptomResponse,
  MedicationLogResponse,
  MissedMedicationEntry,
  BowelMovementResponse,
  SignificantEventResponse,
} from "@/lib/types";

/**
 * Aggregated metrics over a reporting period, used by the "Vue d'ensemble"
 * section of the reporting page.
 */
export interface PeriodMetrics {
  symptomCount: number;
  /** Distinct days (YYYY-MM-DD) with at least one symptom. */
  symptomDayCount: number;
  avgIntensity: number | null;
  maxIntensity: number | null;
  /** Most frequent symptom names, sorted by count descending. */
  topSymptoms: { name: string; count: number }[];
  dosesTaken: number;
  dosesMissed: number;
  /** Percentage of expected doses actually taken (0-100). */
  adherenceRate: number | null;
  bowelCount: number;
  avgBristol: number | null;
  /** Percentage of movements in the normal Bristol zone 3-4 (0-100). */
  bristolNormalRate: number | null;
  eventCount: number;
}

export interface PeriodMetricsInput {
  symptoms: SymptomResponse[];
  medLogs: MedicationLogResponse[];
  missedMedications: MissedMedicationEntry[];
  bowelMovements: BowelMovementResponse[];
  significantEvents: SignificantEventResponse[];
}

export function computePeriodMetrics(input: PeriodMetricsInput): PeriodMetrics {
  const { symptoms, medLogs, missedMedications, bowelMovements, significantEvents } = input;

  const intensities = symptoms.map((s) => s.intensity);
  const symptomDays = new Set(symptoms.map((s) => s.occurredAt.split("T")[0]));

  const countsByName = new Map<string, number>();
  for (const s of symptoms) {
    countsByName.set(s.name, (countsByName.get(s.name) ?? 0) + 1);
  }
  const topSymptoms = [...countsByName.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const dosesTaken = medLogs.length;
  const dosesMissed = missedMedications.length;
  const expectedDoses = dosesTaken + dosesMissed;

  const bristolTypes = bowelMovements.map((b) => b.bristolType);
  const normalCount = bristolTypes.filter((t) => t >= 3 && t <= 4).length;

  return {
    symptomCount: symptoms.length,
    symptomDayCount: symptomDays.size,
    avgIntensity:
      intensities.length > 0
        ? intensities.reduce((s, v) => s + v, 0) / intensities.length
        : null,
    maxIntensity: intensities.length > 0 ? Math.max(...intensities) : null,
    topSymptoms,
    dosesTaken,
    dosesMissed,
    adherenceRate: expectedDoses > 0 ? (dosesTaken / expectedDoses) * 100 : null,
    bowelCount: bowelMovements.length,
    avgBristol:
      bristolTypes.length > 0
        ? bristolTypes.reduce((s, v) => s + v, 0) / bristolTypes.length
        : null,
    bristolNormalRate:
      bristolTypes.length > 0 ? (normalCount / bristolTypes.length) * 100 : null,
    eventCount: significantEvents.length,
  };
}

export interface Trend {
  /** current - previous */
  delta: number;
  /** Relative change in percent, null when the previous value is 0. */
  percent: number | null;
}

/**
 * Compares a metric between two periods. Returns null when either value is
 * missing, so the UI can simply skip the trend badge.
 */
export function computeTrend(
  current: number | null,
  previous: number | null
): Trend | null {
  if (current === null || previous === null) return null;
  const delta = current - previous;
  return {
    delta,
    percent: previous !== 0 ? (delta / previous) * 100 : null,
  };
}
