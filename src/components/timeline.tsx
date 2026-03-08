"use client";

import { cn } from "@/lib/utils";
import { formatShortDate, formatTime, getIntensityBgClass, getIntensityTextClass } from "@/lib/date-utils";
import { Pill } from "lucide-react";
import type { SymptomResponse, MedicationLogResponse, MissedMedicationEntry } from "@/lib/types";

interface TimelineProps {
  symptoms: SymptomResponse[];
  medicationLogs?: MedicationLogResponse[];
  missedMedications?: MissedMedicationEntry[];
}

type TimelineEvent = {
  id: string;
  type: "symptom" | "medication" | "missed";
  date: string; // YYYY-MM-DD
  time: Date;
  symptom?: SymptomResponse;
  medLog?: MedicationLogResponse;
  missedMed?: MissedMedicationEntry;
};

interface GroupedEvents {
  date: string;
  label: string;
  items: TimelineEvent[];
}

function buildEvents(
  symptoms: SymptomResponse[],
  medLogs: MedicationLogResponse[],
  missedMeds: MissedMedicationEntry[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const s of symptoms) {
    events.push({
      id: s.id,
      type: "symptom",
      date: new Date(s.occurredAt).toISOString().split("T")[0],
      time: new Date(s.occurredAt),
      symptom: s,
    });
  }

  for (const l of medLogs) {
    events.push({
      id: l.id,
      type: "medication",
      date: l.date,
      time: new Date(l.takenAt),
      medLog: l,
    });
  }

  for (const m of missedMeds) {
    const t = new Date(`${m.date}T${m.scheduledTime}:00`);
    if (isNaN(t.getTime())) continue;
    events.push({
      id: `missed-${m.medicationId}-${m.date}`,
      type: "missed",
      date: m.date,
      time: t,
      missedMed: m,
    });
  }

  return events;
}

function groupByDate(events: TimelineEvent[]): GroupedEvents[] {
  const groups: Record<string, TimelineEvent[]> = {};

  for (const event of events) {
    if (!groups[event.date]) {
      groups[event.date] = [];
    }
    groups[event.date].push(event);
  }

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, items]) => ({
      date: dateKey,
      label: formatShortDate(new Date(dateKey + "T12:00:00")),
      items: items.sort((a, b) => b.time.getTime() - a.time.getTime()),
    }));
}

function formatDelta(delta: number): string {
  if (delta === 0) return "à l'heure";
  const abs = Math.abs(delta);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const prefix = delta < 0 ? "−" : "+";
  if (h > 0 && m > 0) return `${prefix}${h}h${m.toString().padStart(2, "0")}`;
  if (h > 0) return `${prefix}${h}h`;
  return `${prefix}${m}min`;
}

export function Timeline({ symptoms, medicationLogs = [], missedMedications = [] }: TimelineProps) {
  const events = buildEvents(symptoms, medicationLogs, missedMedications);
  const grouped = groupByDate(events);

  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Aucun événement sur cette période.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {grouped.map((group, groupIdx) => (
        <div key={group.date} className="relative">
          {/* Date label */}
          <div className="flex items-center gap-3 py-3">
            <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full capitalize whitespace-nowrap">
              {group.label}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Items */}
          <div className="ml-4 border-l-2 border-primary/20 pl-6 space-y-3 pb-2">
            {group.items.map((event) =>
              event.type === "symptom" && event.symptom ? (
                <div
                  key={event.id}
                  className="relative flex items-start gap-3"
                >
                  <div
                    className={cn(
                      "absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 border-background",
                      getIntensityBgClass(event.symptom.intensity)
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{event.symptom.name}</span>
                      <span
                        className={cn(
                          "text-sm font-bold",
                          getIntensityTextClass(event.symptom.intensity)
                        )}
                      >
                        {event.symptom.intensity}/10
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatTime(event.symptom.occurredAt)}
                      </span>
                    </div>
                    {event.symptom.notes && (
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {event.symptom.notes}
                      </p>
                    )}
                  </div>
                </div>
              ) : event.type === "medication" && event.medLog ? (
                <div
                  key={event.id}
                  className="relative flex items-start gap-3"
                >
                  <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 border-background bg-blue-500" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Pill className="h-3.5 w-3.5 text-blue-500" />
                      <span className="font-medium">
                        {event.medLog.medication?.name ?? "Médicament"}
                      </span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {event.medLog.medication?.dosage} mg
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({formatDelta(event.medLog.deltaMinutes)})
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatTime(event.medLog.takenAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : event.type === "missed" && event.missedMed ? (
                <div
                  key={event.id}
                  className="relative flex items-start gap-3 opacity-70"
                >
                  <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 border-background bg-red-500" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Pill className="h-3.5 w-3.5 text-red-500" />
                      <span className="font-medium line-through text-muted-foreground">
                        {event.missedMed.medication.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {event.missedMed.medication.dosage} mg
                      </span>
                      <span className="text-xs bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 font-medium px-1.5 py-0.5 rounded">
                        Oublié
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        prévu {event.missedMed.scheduledTime}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null
            )}
          </div>

          {groupIdx < grouped.length - 1 && <div className="h-1" />}
        </div>
      ))}
    </div>
  );
}
