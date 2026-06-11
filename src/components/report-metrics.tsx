"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Thermometer,
  Pill,
  Activity,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { computeTrend, type PeriodMetrics, type Trend } from "@/lib/report-metrics";
import { getIntensityTextClass } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

interface ReportMetricsProps {
  current: PeriodMetrics;
  /** Metrics of the previous period of the same length; null disables trends. */
  previous: PeriodMetrics | null;
  /** When a symptom name filter is active, only symptom metrics are relevant. */
  symptomOnly?: boolean;
}

/** How to color a variation: does an increase mean improvement or worsening? */
type TrendDirection = "up-is-bad" | "up-is-good" | "neutral";

function trendColorClass(delta: number, direction: TrendDirection): string {
  if (delta === 0 || direction === "neutral") return "text-muted-foreground";
  const improving = direction === "up-is-good" ? delta > 0 : delta < 0;
  return improving
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";
}

function formatTrendValue(trend: Trend, unit: "percent" | "points" | "count"): string {
  const sign = trend.delta > 0 ? "+" : "";
  if (unit === "points") return `${sign}${trend.delta.toFixed(0)} pts`;
  if (unit === "percent" && trend.percent !== null)
    return `${sign}${trend.percent.toFixed(0)}%`;
  return `${sign}${trend.delta.toFixed(0)}`;
}

function TrendBadge({
  trend,
  direction,
  unit = "percent",
}: {
  trend: Trend | null;
  direction: TrendDirection;
  unit?: "percent" | "points" | "count";
}) {
  if (trend === null) return null;
  const Icon = trend.delta > 0 ? TrendingUp : trend.delta < 0 ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-medium",
        trendColorClass(trend.delta, direction)
      )}
      title="Par rapport à la période précédente"
    >
      <Icon className="h-3 w-3" />
      {formatTrendValue(trend, unit)}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  trend,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  trend?: React.ReactNode;
}) {
  return (
    <Card className="py-0">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <div className="mt-1.5 flex items-baseline justify-between gap-2">
          <span className="text-2xl font-bold leading-none">{value}</span>
          {trend}
        </div>
        {detail && (
          <div className="mt-1.5 text-[11px] text-muted-foreground">{detail}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function ReportMetrics({ current, previous, symptomOnly = false }: ReportMetricsProps) {
  const symptomCountTrend = previous
    ? computeTrend(current.symptomCount, previous.symptomCount)
    : null;
  const intensityTrend = previous
    ? computeTrend(current.avgIntensity, previous.avgIntensity)
    : null;
  const adherenceTrend = previous
    ? computeTrend(current.adherenceRate, previous.adherenceRate)
    : null;
  const bowelTrend = previous
    ? computeTrend(current.bowelCount, previous.bowelCount)
    : null;
  const eventTrend = previous
    ? computeTrend(current.eventCount, previous.eventCount)
    : null;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "grid gap-2 sm:gap-3",
          symptomOnly ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 lg:grid-cols-4"
        )}
      >
        <StatCard
          icon={Thermometer}
          label="Symptômes"
          value={current.symptomCount}
          trend={<TrendBadge trend={symptomCountTrend} direction="up-is-bad" />}
          detail={
            current.symptomCount > 0
              ? `Sur ${current.symptomDayCount} jour${current.symptomDayCount > 1 ? "s" : ""}`
              : "Aucun symptôme enregistré"
          }
        />

        <StatCard
          icon={Activity}
          label="Intensité moy."
          value={
            current.avgIntensity !== null ? (
              <span className={getIntensityTextClass(Math.round(current.avgIntensity))}>
                {current.avgIntensity.toFixed(1)}
              </span>
            ) : (
              "—"
            )
          }
          trend={<TrendBadge trend={intensityTrend} direction="up-is-bad" unit="points" />}
          detail={
            current.maxIntensity !== null
              ? `Pic à ${current.maxIntensity}/10`
              : undefined
          }
        />

        {!symptomOnly && (
          <>
            <StatCard
              icon={Pill}
              label="Observance"
              value={
                current.adherenceRate !== null
                  ? `${Math.round(current.adherenceRate)}%`
                  : "—"
              }
              trend={<TrendBadge trend={adherenceTrend} direction="up-is-good" unit="points" />}
              detail={`${current.dosesTaken} prise${current.dosesTaken > 1 ? "s" : ""} · ${current.dosesMissed} manquée${current.dosesMissed > 1 ? "s" : ""}`}
            />

            <StatCard
              icon={Star}
              label="Transit & événements"
              value={current.bowelCount}
              trend={<TrendBadge trend={bowelTrend} direction="neutral" />}
              detail={
                <>
                  {current.avgBristol !== null && (
                    <span>
                      Bristol moy. {current.avgBristol.toFixed(1)}
                      {current.bristolNormalRate !== null &&
                        ` · ${Math.round(current.bristolNormalRate)}% normal`}
                    </span>
                  )}
                  <span className={cn(current.avgBristol !== null && "block")}>
                    {current.eventCount} événement{current.eventCount > 1 ? "s" : ""} marquant{current.eventCount > 1 ? "s" : ""}
                    {eventTrend !== null && eventTrend.delta !== 0 && (
                      <span className="ml-1 text-muted-foreground">
                        ({eventTrend.delta > 0 ? "+" : ""}{eventTrend.delta})
                      </span>
                    )}
                  </span>
                </>
              }
            />
          </>
        )}
      </div>

      {!symptomOnly && current.topSymptoms.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Plus fréquents
          </span>
          {current.topSymptoms.slice(0, 3).map((s) => (
            <Badge key={s.name} variant="secondary" className="px-1.5 py-0 text-[11px] font-normal">
              {s.name} × {s.count}
            </Badge>
          ))}
        </div>
      )}

      {previous && (
        <p className="text-[11px] text-muted-foreground">
          Les variations comparent avec la période précédente de même durée.
        </p>
      )}
    </div>
  );
}
