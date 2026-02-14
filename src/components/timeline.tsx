"use client";

import { cn } from "@/lib/utils";
import { formatShortDate, formatTime, getIntensityBgClass, getIntensityTextClass } from "@/lib/date-utils";
import type { SymptomResponse } from "@/lib/types";

interface TimelineProps {
  symptoms: SymptomResponse[];
}

interface GroupedSymptoms {
  date: string;
  label: string;
  items: SymptomResponse[];
}

function groupByDate(symptoms: SymptomResponse[]): GroupedSymptoms[] {
  const groups: Record<string, SymptomResponse[]> = {};

  for (const symptom of symptoms) {
    const dateKey = new Date(symptom.occurredAt).toISOString().split("T")[0];
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(symptom);
  }

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, items]) => ({
      date: dateKey,
      label: formatShortDate(new Date(dateKey + "T12:00:00")),
      items: items.sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      ),
    }));
}

export function Timeline({ symptoms }: TimelineProps) {
  const grouped = groupByDate(symptoms);

  if (symptoms.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Aucun symptôme sur cette période.
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
            {group.items.map((symptom) => (
              <div
                key={symptom.id}
                className="relative flex items-start gap-3"
              >
                {/* Dot */}
                <div
                  className={cn(
                    "absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 border-background",
                    getIntensityBgClass(symptom.intensity)
                  )}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{symptom.name}</span>
                    <span
                      className={cn(
                        "text-sm font-bold",
                        getIntensityTextClass(symptom.intensity)
                      )}
                    >
                      {symptom.intensity}/10
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatTime(symptom.occurredAt)}
                    </span>
                  </div>
                  {symptom.notes && (
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      {symptom.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Spacer between groups (except last) */}
          {groupIdx < grouped.length - 1 && <div className="h-1" />}
        </div>
      ))}
    </div>
  );
}
