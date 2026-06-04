import { eachDayOfInterval, format, parseISO } from "date-fns";
import type { MedicationResponse, MedicationLogResponse, MissedMedicationEntry } from "@/lib/types";

/**
 * Computes the medications that have no log on each day of the given range.
 *
 * A medication only counts as "missed" from its creation date onward.
 * When `from` is omitted, the range starts at the earliest medication creation date.
 * When `to` is omitted, the range ends today.
 */
export function computeMissedEntries(
  medications: MedicationResponse[],
  medLogs: MedicationLogResponse[],
  from?: string,
  to?: string
): MissedMedicationEntry[] {
  if (medications.length === 0) return [];

  const today = format(new Date(), "yyyy-MM-dd");
  const startDate =
    from ??
    medications.reduce((min, m) => {
      const d = m.createdAt.split("T")[0];
      return d < min ? d : min;
    }, today);
  const endDate = to ?? today;

  if (startDate > endDate) return [];

  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });

  const loggedSet = new Set(medLogs.map((l) => `${l.medicationId}|${l.date}`));

  const missed: MissedMedicationEntry[] = [];
  for (const day of days) {
    const dateStr = format(day, "yyyy-MM-dd");
    for (const med of medications) {
      const medCreatedDate = med.createdAt.split("T")[0];
      if (medCreatedDate > dateStr) continue;
      if (!loggedSet.has(`${med.id}|${dateStr}`)) {
        missed.push({
          medicationId: med.id,
          medication: med,
          date: dateStr,
          scheduledTime: med.time,
        });
      }
    }
  }
  return missed;
}
