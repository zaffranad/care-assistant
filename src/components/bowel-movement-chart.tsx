"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { BowelMovementResponse } from "@/lib/types";

interface BowelMovementChartProps {
  bowelMovements: BowelMovementResponse[];
}

const BRISTOL_LABELS: Record<number, string> = {
  1: "Billes dures séparées",
  2: "En saucisse, grumeleuse",
  3: "En saucisse, fissurée",
  4: "Lisse et souple",
  5: "Morceaux mous",
  6: "Floconneuse, pâteuse",
  7: "Liquide, sans morceaux",
};

function getBristolBarColor(type: number): string {
  if (type <= 2) return "oklch(0.60 0.15 70)";
  if (type <= 4) return "oklch(0.65 0.18 150)";
  if (type === 5) return "oklch(0.70 0.15 80)";
  return "oklch(0.60 0.20 25)";
}

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  count: number;
  avgBristol: number | null;
  maxBristol: number | null;
  minBristol: number | null;
  entries: { bristolType: number; time: string; notes: string | null }[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    color: string;
    value: unknown;
    payload: ChartDataPoint;
  }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as ChartDataPoint;
  if (!point || point.count === 0) return null;

  return (
    <div
      style={{
        borderRadius: "8px",
        border: "1px solid var(--border)",
        backgroundColor: "var(--popover)",
        color: "var(--popover-foreground)",
        padding: "8px 12px",
        fontSize: "13px",
        minWidth: "180px",
        maxWidth: "280px",
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>
        {format(parseISO(point.date), "EEEE d MMMM", { locale: fr })}
      </p>
      <p style={{ margin: "2px 0" }}>
        <strong>{point.count}</strong> selle{point.count > 1 ? "s" : ""}
      </p>
      {point.avgBristol !== null && (
        <p style={{ margin: "2px 0", opacity: 0.8 }}>
          Bristol moyen : <strong>{point.avgBristol.toFixed(1)}</strong>
        </p>
      )}
      <hr style={{ margin: "6px 0", opacity: 0.25 }} />
      {point.entries.map((e, i) => (
        <p key={i} style={{ margin: "2px 0" }}>
          🚽 {e.time} — Type {e.bristolType} ({BRISTOL_LABELS[e.bristolType]})
          {e.notes && (
            <span style={{ opacity: 0.7, display: "block", fontSize: "11px" }}>
              {e.notes}
            </span>
          )}
        </p>
      ))}
    </div>
  );
}

export function BowelMovementChart({ bowelMovements }: BowelMovementChartProps) {
  if (bowelMovements.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Pas assez de données pour afficher le graphique.
      </p>
    );
  }

  const dateMap: Record<
    string,
    { bristolTypes: number[]; entries: { bristolType: number; time: string; notes: string | null }[] }
  > = {};

  for (const bm of bowelMovements) {
    const dateKey = new Date(bm.occurredAt).toISOString().split("T")[0];
    if (!dateMap[dateKey]) dateMap[dateKey] = { bristolTypes: [], entries: [] };
    dateMap[dateKey].bristolTypes.push(bm.bristolType);
    dateMap[dateKey].entries.push({
      bristolType: bm.bristolType,
      time: format(new Date(bm.occurredAt), "HH:mm"),
      notes: bm.notes,
    });
  }

  const dateKeys = Object.keys(dateMap).sort();
  if (dateKeys.length > 1) {
    const allDays = eachDayOfInterval({
      start: parseISO(dateKeys[0]),
      end: parseISO(dateKeys[dateKeys.length - 1]),
    });
    for (const day of allDays) {
      const dateKey = format(day, "yyyy-MM-dd");
      if (!dateMap[dateKey]) dateMap[dateKey] = { bristolTypes: [], entries: [] };
    }
  }

  const chartData: ChartDataPoint[] = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, { bristolTypes, entries }]) => {
      const count = bristolTypes.length;
      const avg = count > 0 ? bristolTypes.reduce((s, v) => s + v, 0) / count : null;
      return {
        date: dateKey,
        dateLabel: format(new Date(dateKey + "T12:00:00"), "d MMM", { locale: fr }),
        count,
        avgBristol: avg,
        maxBristol: count > 0 ? Math.max(...bristolTypes) : null,
        minBristol: count > 0 ? Math.min(...bristolTypes) : null,
        entries: entries.sort((a, b) => a.time.localeCompare(b.time)),
      };
    });

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: "oklch(0.65 0.18 150)" }} />
          Nombre de selles / jour
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: "oklch(0.55 0.20 270)" }} />
          Type Bristol moyen
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-px border-t-2 border-dashed" style={{ borderColor: "oklch(0.65 0.18 150)" }} />
          Zone normale (3–4)
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            yAxisId="count"
            orientation="left"
            domain={[0, Math.max(maxCount + 1, 4)]}
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            label={{ value: "Nb/jour", angle: -90, position: "insideLeft", offset: 20, style: { fontSize: 11, fill: "var(--muted-foreground)" } }}
          />
          <YAxis
            yAxisId="bristol"
            orientation="right"
            domain={[1, 7]}
            ticks={[1, 2, 3, 4, 5, 6, 7]}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            label={{ value: "Bristol", angle: 90, position: "insideRight", offset: 20, style: { fontSize: 11, fill: "var(--muted-foreground)" } }}
          />
          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine
            yAxisId="bristol"
            y={3}
            stroke="oklch(0.65 0.18 150)"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />
          <ReferenceLine
            yAxisId="bristol"
            y={4}
            stroke="oklch(0.65 0.18 150)"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />

          <Bar
            yAxisId="count"
            dataKey="count"
            barSize={20}
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.date}
                fill={entry.avgBristol !== null ? getBristolBarColor(Math.round(entry.avgBristol)) : "oklch(0.65 0.18 150)"}
                fillOpacity={entry.count > 0 ? 0.7 : 0}
              />
            ))}
          </Bar>

          <Line
            yAxisId="bristol"
            type="monotone"
            dataKey="avgBristol"
            stroke="oklch(0.55 0.20 270)"
            strokeWidth={2}
            dot={{ r: 4 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
