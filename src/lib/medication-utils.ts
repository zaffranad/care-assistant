import { eachDayOfInterval, format, parseISO } from "date-fns";
import type { MedicationResponse, MedicationLogResponse, MedicationIntakeResponse, MissedMedicationEntry, IntakeSuggestion } from "@/lib/types";

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

/**
 * Normalizes a medication name for comparison: trimmed, lowercased, accents removed.
 */
export function normalizeMedicationName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Builds the autocomplete suggestion list for one-off intakes.
 *
 * Past intakes come first (assumed sorted most recent first, so each name keeps
 * its latest dosage), then regular medications not already present. Names are
 * deduplicated case- and accent-insensitively.
 */
export function buildIntakeSuggestions(
  intakes: MedicationIntakeResponse[],
  medications: MedicationResponse[]
): IntakeSuggestion[] {
  const seen = new Set<string>();
  const suggestions: IntakeSuggestion[] = [];

  for (const entry of [...intakes, ...medications]) {
    const key = normalizeMedicationName(entry.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    suggestions.push({ name: entry.name.trim(), dosage: entry.dosage });
  }

  return suggestions;
}

/**
 * Filters suggestions against the typed query, case- and accent-insensitively.
 * Names starting with the query come before names merely containing it.
 * An empty query returns the full list; an exact match returns nothing
 * (the user already picked or typed that name).
 */
export function filterIntakeSuggestions(
  suggestions: IntakeSuggestion[],
  query: string
): IntakeSuggestion[] {
  const q = normalizeMedicationName(query);
  if (!q) return suggestions;

  const starts: IntakeSuggestion[] = [];
  const contains: IntakeSuggestion[] = [];
  for (const s of suggestions) {
    const name = normalizeMedicationName(s.name);
    if (name === q) return [];
    if (name.startsWith(q)) starts.push(s);
    else if (name.includes(q)) contains.push(s);
  }
  return [...starts, ...contains];
}
