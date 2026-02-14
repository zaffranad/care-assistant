"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { SymptomResponse } from "@/lib/types";

interface IntensityChartProps {
  symptoms: SymptomResponse[];
}

// Assign consistent colors to symptom names
const CHART_COLORS = [
  "oklch(0.55 0.20 270)",  // violet
  "oklch(0.65 0.18 200)",  // teal
  "oklch(0.60 0.22 25)",   // red-orange
  "oklch(0.70 0.18 150)",  // green
  "oklch(0.65 0.20 320)",  // pink
  "oklch(0.75 0.15 80)",   // yellow
  "oklch(0.55 0.15 230)",  // blue
  "oklch(0.70 0.15 40)",   // orange
];

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  [symptomName: string]: number | string;
}

export function IntensityChart({ symptoms }: IntensityChartProps) {
  if (symptoms.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Pas assez de données pour afficher le graphique.
      </p>
    );
  }

  // Get unique symptom names
  const symptomNames = [...new Set(symptoms.map((s) => s.name))];

  // Group by date and compute max intensity per symptom per day
  const dateMap: Record<string, Record<string, number>> = {};

  for (const s of symptoms) {
    const dateKey = new Date(s.occurredAt).toISOString().split("T")[0];
    if (!dateMap[dateKey]) dateMap[dateKey] = {};
    const current = dateMap[dateKey][s.name] || 0;
    dateMap[dateKey][s.name] = Math.max(current, s.intensity);
  }

  const chartData: ChartDataPoint[] = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, values]) => ({
      date: dateKey,
      dateLabel: format(new Date(dateKey + "T12:00:00"), "d MMM", { locale: fr }),
      ...values,
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
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
        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--popover)",
            color: "var(--popover-foreground)",
          }}
        />
        <Legend />
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
      </LineChart>
    </ResponsiveContainer>
  );
}
