"use client";

import {
  ComposedChart,
  Line,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { SymptomResponse, MedicationLogResponse, MissedMedicationEntry } from "@/lib/types";

const CHART_COLORS = [
  "oklch(0.55 0.20 270)",
  "oklch(0.65 0.18 200)",
  "oklch(0.60 0.22 25)",
  "oklch(0.70 0.18 150)",
  "oklch(0.65 0.20 320)",
  "oklch(0.75 0.15 80)",
  "oklch(0.55 0.15 230)",
  "oklch(0.70 0.15 40)",
];

type MedStatus = "onTime" | "late" | "missed" | "none";

interface MedEvent {
  name: string;
  status: Exclude<MedStatus, "none">;
  deltaMinutes?: number;
}

interface IntensityChartProps {
  symptoms: SymptomResponse[];
  medicationLogs?: MedicationLogResponse[];
  missedMedications?: MissedMedicationEntry[];
}

type ChartDataPoint = {
  date: string;
  dateLabel: string;
  _bgBar: number;
  _medStatus: MedStatus;
  medEvents: MedEvent[];
  [key: string]: unknown;
};

// Okabe-Ito palette — safe for all types of color blindness
const STATUS_COLOR: Record<MedStatus, string> = {
  onTime: "#0072B2",  // blue
  late: "#E69F00",    // orange/amber
  missed: "#D55E00",  // vermillion
  none: "transparent",
};

const STATUS_LABEL: Record<Exclude<MedStatus, "none">, string> = {
  onTime: "À l'heure",
  late: "En retard",
  missed: "Oublié",
};

function dominantStatus(events: MedEvent[]): MedStatus {
  if (events.length === 0) return "none";
  if (events.some((e) => e.status === "missed")) return "missed";
  if (events.some((e) => e.status === "late")) return "late";
  return "onTime";
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    color: string;
    value: unknown;
    payload: ChartDataPoint;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as ChartDataPoint;
  const medEvents = (point.medEvents || []) as MedEvent[];
  const symptomEntries = payload.filter(
    (p) =>
      p.dataKey !== "_bgBar" &&
      p.value !== undefined &&
      p.value !== null
  );

  return (
    <div
      style={{
        borderRadius: "8px",
        border: "1px solid var(--border)",
        backgroundColor: "var(--popover)",
        color: "var(--popover-foreground)",
        padding: "8px 12px",
        fontSize: "13px",
        minWidth: "160px",
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {symptomEntries.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, margin: "2px 0" }}>
          {p.dataKey} :{" "}
          <strong>
            {typeof p.value === "number" ? p.value : String(p.value)}
          </strong>
        </p>
      ))}
      {medEvents.length > 0 && (
        <>
          {symptomEntries.length > 0 && (
            <hr style={{ margin: "6px 0", opacity: 0.25 }} />
          )}
          <p style={{ fontWeight: 500, marginBottom: 4 }}>Médicaments :</p>
          {medEvents.map((e, i) => (
            <p
              key={i}
              style={{ color: STATUS_COLOR[e.status], margin: "2px 0" }}
            >
              💊 {e.name} — {STATUS_LABEL[e.status]}
              {e.deltaMinutes !== undefined &&
                e.status !== "missed" &&
                e.deltaMinutes !== 0 && (
                  <span style={{ opacity: 0.7 }}>
                    {e.deltaMinutes > 0
                      ? ` (+${e.deltaMinutes} min)`
                      : ` (${e.deltaMinutes} min)`}
                  </span>
                )}
            </p>
          ))}
        </>
      )}
    </div>
  );
}

export function IntensityChart({
  symptoms,
  medicationLogs = [],
  missedMedications = [],
}: IntensityChartProps) {
  const hasMedData = medicationLogs.length > 0 || missedMedications.length > 0;

  if (symptoms.length === 0 && !hasMedData) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Pas assez de données pour afficher le graphique.
      </p>
    );
  }

  const symptomNames = [...new Set(symptoms.map((s) => s.name))];

  const dateMap: Record<string, Record<string, number>> = {};
  for (const s of symptoms) {
    const dateKey = new Date(s.occurredAt).toISOString().split("T")[0];
    if (!dateMap[dateKey]) dateMap[dateKey] = {};
    const current = (dateMap[dateKey][s.name] as number) || 0;
    dateMap[dateKey][s.name] = Math.max(current, s.intensity);
  }

  const medEventMap: Record<string, MedEvent[]> = {};

  for (const log of medicationLogs) {
    const dateKey = log.date;
    if (!medEventMap[dateKey]) medEventMap[dateKey] = [];
    const status: Exclude<MedStatus, "none"> =
      Math.abs(log.deltaMinutes) <= 30 ? "onTime" : "late";
    medEventMap[dateKey].push({
      name: log.medication?.name ?? "Médicament",
      status,
      deltaMinutes: log.deltaMinutes,
    });
  }

  for (const missed of missedMedications) {
    const dateKey = missed.date;
    if (!medEventMap[dateKey]) medEventMap[dateKey] = [];
    medEventMap[dateKey].push({
      name: missed.medication.name,
      status: "missed",
    });
  }

  for (const dateKey of Object.keys(medEventMap)) {
    if (!dateMap[dateKey]) dateMap[dateKey] = {};
  }

  const chartData: ChartDataPoint[] = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, values]) => {
      const events = medEventMap[dateKey] ?? [];
      return {
        date: dateKey,
        dateLabel: format(new Date(dateKey + "T12:00:00"), "d MMM", {
          locale: fr,
        }),
        _bgBar: 10,
        _medStatus: dominantStatus(events),
        medEvents: events,
        ...values,
      };
    });

  return (
    <div className="space-y-3">
      {hasMedData && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span className="font-medium">Médicaments :</span>
          {(["onTime", "late", "missed"] as Exclude<MedStatus, "none">[]).map(
            (status) => (
              <span key={status} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ backgroundColor: STATUS_COLOR[status], opacity: 0.35 }}
                />
                {STATUS_LABEL[status]}
              </span>
            )
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          barCategoryGap={0}
          barGap={0}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* Background bars: full height (10), colored per med status */}
          {hasMedData && (
            <Bar
              dataKey="_bgBar"
              isAnimationActive={false}
              legendType="none"
              barSize={999}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.date}
                  fill={STATUS_COLOR[entry._medStatus]}
                  fillOpacity={
                    entry._medStatus === "none"
                      ? 0
                      : entry._medStatus === "missed"
                        ? 0.35
                        : 0.15
                  }
                />
              ))}
            </Bar>
          )}

          {/* Symptom lines on top */}
          {symptomNames.map((name, idx) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={CHART_COLORS[idx % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
