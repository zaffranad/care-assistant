"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Timeline } from "@/components/timeline";
import { TimelineWeekPicker } from "@/components/timeline-week-picker";
import { IntensityChart } from "@/components/intensity-chart";
import { ExportButton } from "@/components/export-button";
import { BowelMovementChart } from "@/components/bowel-movement-chart";
import { Clock, TrendingUp, Filter, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { subDays, format, startOfWeek, endOfWeek, addWeeks, differenceInCalendarWeeks } from "date-fns";
import type { SymptomResponse, MedicationLogResponse, MedicationResponse, MissedMedicationEntry, BowelMovementResponse, SignificantEventResponse } from "@/lib/types";
import { computeMissedEntries } from "@/lib/medication-utils";
import { toast } from "sonner";

type PeriodFilter = "7" | "30" | "90" | "all";

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: "7", label: "7 j" },
  { value: "30", label: "30 j" },
  { value: "90", label: "90 j" },
  { value: "all", label: "Tout" },
];

export default function ReportingPage() {
  const [symptoms, setSymptoms] = useState<SymptomResponse[]>([]);
  const [medLogs, setMedLogs] = useState<MedicationLogResponse[]>([]);
  const [medications, setMedications] = useState<MedicationResponse[]>([]);
  const [bowelMovements, setBowelMovements] = useState<BowelMovementResponse[]>([]);
  const [significantEvents, setSignificantEvents] = useState<SignificantEventResponse[]>([]);
  const [timelineSymptoms, setTimelineSymptoms] = useState<SymptomResponse[]>([]);
  const [timelineMedLogs, setTimelineMedLogs] = useState<MedicationLogResponse[]>([]);
  const [timelineBowelMovements, setTimelineBowelMovements] = useState<BowelMovementResponse[]>([]);
  const [timelineSignificantEvents, setTimelineSignificantEvents] = useState<SignificantEventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("7");
  const [nameFilter, setNameFilter] = useState<string>("all");
  const [timelineWeekOffset, setTimelineWeekOffset] = useState(0);
  const currentWeekStart = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    []
  );

  const getDateRange = useCallback(() => {
    if (period === "all") return { from: undefined, to: undefined };
    const days = parseInt(period);
    return {
      from: format(subDays(new Date(), days), "yyyy-MM-dd"),
      to: format(new Date(), "yyyy-MM-dd"),
    };
  }, [period]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange();
      const dateParams = from && to ? `?from=${from}&to=${to}` : "";

      const [sympRes, medRes, medsRes, bowelRes, significantRes] = await Promise.all([
        fetch(`/api/symptoms${dateParams}`),
        fetch(`/api/medication-logs${dateParams}`),
        fetch(`/api/medications?all=true`),
        fetch(`/api/bowel-movements${dateParams}`),
        fetch(`/api/significant-events${dateParams}`),
      ]);

      if (sympRes.ok) {
        setSymptoms(await sympRes.json());
      } else {
        toast.error("Impossible de charger les symptômes");
      }

      if (medRes.ok) {
        setMedLogs(await medRes.json());
      }

      if (medsRes.ok) {
        setMedications(await medsRes.json());
      }

      if (bowelRes.ok) {
        setBowelMovements(await bowelRes.json());
      }

      if (significantRes.ok) {
        setSignificantEvents(await significantRes.json());
      }
    } catch {
      toast.error("Erreur de connexion", {
        description: "Impossible de contacter le serveur.",
      });
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  const getTimelineWeekRange = useCallback(() => {
    const weekStart = addWeeks(currentWeekStart, -timelineWeekOffset);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    return {
      from: format(weekStart, "yyyy-MM-dd"),
      to: format(weekEnd, "yyyy-MM-dd"),
      label: `${format(weekStart, "dd/MM")} - ${format(weekEnd, "dd/MM")}`,
    };
  }, [currentWeekStart, timelineWeekOffset]);

  const timelineWeekRange = useMemo(() => getTimelineWeekRange(), [getTimelineWeekRange]);
  const selectedTimelineWeekStart = useMemo(
    () => addWeeks(currentWeekStart, -timelineWeekOffset),
    [currentWeekStart, timelineWeekOffset]
  );

  const fetchTimelineData = useCallback(async () => {
    setTimelineLoading(true);
    try {
      const { from, to } = timelineWeekRange;
      const dateParams = `?from=${from}&to=${to}`;

      const [sympRes, medRes, bowelRes, significantRes] = await Promise.all([
        fetch(`/api/symptoms${dateParams}`),
        fetch(`/api/medication-logs${dateParams}`),
        fetch(`/api/bowel-movements${dateParams}`),
        fetch(`/api/significant-events${dateParams}`),
      ]);

      if (sympRes.ok) {
        setTimelineSymptoms(await sympRes.json());
      } else {
        toast.error("Impossible de charger les symptômes de la timeline");
      }

      if (medRes.ok) {
        setTimelineMedLogs(await medRes.json());
      } else {
        toast.error("Impossible de charger les prises de la timeline");
      }

      if (bowelRes.ok) {
        setTimelineBowelMovements(await bowelRes.json());
      }

      if (significantRes.ok) {
        setTimelineSignificantEvents(await significantRes.json());
      }
    } catch {
      toast.error("Erreur de connexion", {
        description: "Impossible de charger les données de timeline.",
      });
    } finally {
      setTimelineLoading(false);
    }
  }, [timelineWeekRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchTimelineData();
  }, [fetchTimelineData]);

  // Get unique symptom names for filter
  const symptomNames = useMemo(
    () => [...new Set(symptoms.map((s) => s.name))].sort(),
    [symptoms]
  );

  // Filtered symptoms
  const filteredSymptoms = useMemo(
    () =>
      nameFilter === "all"
        ? symptoms
        : symptoms.filter((s) => s.name === nameFilter),
    [symptoms, nameFilter]
  );

  const filteredTimelineSymptoms = useMemo(
    () =>
      nameFilter === "all"
        ? timelineSymptoms
        : timelineSymptoms.filter((s) => s.name === nameFilter),
    [timelineSymptoms, nameFilter]
  );

  // Medication logs are always shown (no name filter for now)
  const filteredMedLogs = useMemo(
    () => (nameFilter === "all" ? medLogs : []),
    [medLogs, nameFilter]
  );

  const filteredTimelineMedLogs = useMemo(
    () => (nameFilter === "all" ? timelineMedLogs : []),
    [timelineMedLogs, nameFilter]
  );

  const filteredBowelMovements = useMemo(
    () => (nameFilter === "all" ? bowelMovements : []),
    [bowelMovements, nameFilter]
  );

  const filteredTimelineBowelMovements = useMemo(
    () => (nameFilter === "all" ? timelineBowelMovements : []),
    [timelineBowelMovements, nameFilter]
  );

  const filteredSignificantEvents = useMemo(
    () => (nameFilter === "all" ? significantEvents : []),
    [significantEvents, nameFilter]
  );

  const filteredTimelineSignificantEvents = useMemo(
    () => (nameFilter === "all" ? timelineSignificantEvents : []),
    [timelineSignificantEvents, nameFilter]
  );

  // Compute missed medication entries: medications with no log in the date range
  const missedEntries = useMemo((): MissedMedicationEntry[] => {
    if (nameFilter !== "all") return [];
    const { from, to } = getDateRange();
    return computeMissedEntries(medications, medLogs, from, to);
  }, [medications, medLogs, getDateRange, nameFilter]);

  const timelineMissedEntries = useMemo((): MissedMedicationEntry[] => {
    if (nameFilter !== "all") return [];
    const { from, to } = timelineWeekRange;
    return computeMissedEntries(medications, timelineMedLogs, from, to);
  }, [medications, timelineMedLogs, timelineWeekRange, nameFilter]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-center">
        Reporting & Visualisation
      </h1>

      {/* Filtres */}
      <Card className="border-dashed bg-muted/20 shadow-none">
        <CardContent className="p-2.5 sm:p-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <Filter className="h-3 w-3" />
                Filtres
              </span>
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                {period === "all" ? "Tout l'historique" : `${period} derniers jours`}
              </Badge>
              {nameFilter !== "all" && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                  {nameFilter}
                </Badge>
              )}
              {(period !== "7" || nameFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-5 px-1.5 text-[10px] text-muted-foreground"
                  onClick={() => {
                    setPeriod("7");
                    setNameFilter("all");
                  }}
                >
                  Réinitialiser
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex w-full rounded-md border bg-background p-0.5 sm:w-auto">
                {periodOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={period === option.value ? "secondary" : "ghost"}
                    size="xs"
                    className="h-6 flex-1 rounded-sm px-2 text-[11px] sm:flex-none"
                    onClick={() => setPeriod(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              <Select value={nameFilter} onValueChange={setNameFilter}>
                <SelectTrigger className="h-7 w-full text-[11px] sm:w-[190px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les événements</SelectItem>
                  {symptomNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Chargement...
        </div>
      ) : (
        <>
          {/* Graphique d'évolution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Évolution de l&apos;intensité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IntensityChart
                symptoms={filteredSymptoms}
                medicationLogs={filteredMedLogs}
                missedMedications={missedEntries}
                significantEvents={filteredSignificantEvents}
              />
            </CardContent>
          </Card>

          {/* Graphique transit intestinal */}
          {filteredBowelMovements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-primary" />
                  Transit intestinal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BowelMovementChart bowelMovements={filteredBowelMovements} />
              </CardContent>
            </Card>
          )}

          {/* Export */}
          <div className="flex flex-wrap gap-3 justify-center">
            <ExportButton
              symptoms={filteredSymptoms}
              bowelMovements={filteredBowelMovements}
              format="csv"
            />
            <ExportButton
              symptoms={filteredSymptoms}
              bowelMovements={filteredBowelMovements}
              format="json"
            />
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Timeline
              </CardTitle>
              <div className="flex items-center justify-between gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 sm:px-3 text-xs sm:text-sm shrink-0"
                  onClick={() => setTimelineWeekOffset((v) => v + 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="ml-1 hidden sm:inline">Semaine précédente</span>
                  <span className="ml-1 sm:hidden">Préc.</span>
                </Button>
                <div className="flex min-w-0 items-center justify-center">
                  <TimelineWeekPicker
                    selectedWeekStart={selectedTimelineWeekStart}
                    onWeekSelect={(weekStart) => {
                      const nextOffset = Math.max(
                        0,
                        differenceInCalendarWeeks(currentWeekStart, weekStart, {
                          weekStartsOn: 1,
                        })
                      );
                      setTimelineWeekOffset(nextOffset);
                    }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 sm:px-3 text-xs sm:text-sm shrink-0"
                  onClick={() => setTimelineWeekOffset((v) => Math.max(0, v - 1))}
                  disabled={timelineWeekOffset === 0}
                >
                  <span className="mr-1 hidden sm:inline">Semaine suivante</span>
                  <span className="mr-1 sm:hidden">Suiv.</span>
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {timelineLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement de la semaine...
                </div>
              ) : (
                <Timeline
                  symptoms={filteredTimelineSymptoms}
                  medicationLogs={filteredTimelineMedLogs}
                  missedMedications={timelineMissedEntries}
                  bowelMovements={filteredTimelineBowelMovements}
                  significantEvents={filteredTimelineSignificantEvents}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
