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
import { Timeline } from "@/components/timeline";
import { TimelineWeekPicker } from "@/components/timeline-week-picker";
import { IntensityChart } from "@/components/intensity-chart";
import { ExportButton } from "@/components/export-button";
import { Clock, TrendingUp, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { subDays, format, eachDayOfInterval, parseISO, startOfWeek, endOfWeek, addWeeks, differenceInCalendarWeeks } from "date-fns";
import type { SymptomResponse, MedicationLogResponse, MedicationResponse, MissedMedicationEntry } from "@/lib/types";
import { toast } from "sonner";

type PeriodFilter = "7" | "30" | "90" | "all";

export default function ReportingPage() {
  const [symptoms, setSymptoms] = useState<SymptomResponse[]>([]);
  const [medLogs, setMedLogs] = useState<MedicationLogResponse[]>([]);
  const [medications, setMedications] = useState<MedicationResponse[]>([]);
  const [timelineSymptoms, setTimelineSymptoms] = useState<SymptomResponse[]>([]);
  const [timelineMedLogs, setTimelineMedLogs] = useState<MedicationLogResponse[]>([]);
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

      const [sympRes, medRes, medsRes] = await Promise.all([
        fetch(`/api/symptoms${dateParams}`),
        fetch(`/api/medication-logs${dateParams}`),
        fetch(`/api/medications?all=true`),
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
    } catch (error) {
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

      const [sympRes, medRes] = await Promise.all([
        fetch(`/api/symptoms${dateParams}`),
        fetch(`/api/medication-logs${dateParams}`),
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

  // Compute missed medication entries: medications with no log in the date range
  const missedEntries = useMemo((): MissedMedicationEntry[] => {
    if (nameFilter !== "all" || medications.length === 0) return [];

    const { from, to } = getDateRange();
    const today = format(new Date(), "yyyy-MM-dd");
    const startDate = from ?? (
      medications.reduce((min, m) => {
        const d = m.createdAt.split("T")[0];
        return d < min ? d : min;
      }, today)
    );
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
  }, [medications, medLogs, getDateRange, nameFilter]);

  const timelineMissedEntries = useMemo((): MissedMedicationEntry[] => {
    if (nameFilter !== "all" || medications.length === 0) return [];

    const { from, to } = timelineWeekRange;
    const startDate = from;
    const endDate = to;

    if (startDate > endDate) return [];

    const days = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate),
    });

    const loggedSet = new Set(timelineMedLogs.map((l) => `${l.medicationId}|${l.date}`));

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
  }, [medications, timelineMedLogs, timelineWeekRange, nameFilter]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-center">
        Reporting & Visualisation
      </h1>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <span className="text-sm font-medium text-muted-foreground">Filtres :</span>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 derniers jours</SelectItem>
                <SelectItem value="30">30 derniers jours</SelectItem>
                <SelectItem value="90">90 derniers jours</SelectItem>
                <SelectItem value="all">Tout l&apos;historique</SelectItem>
              </SelectContent>
            </Select>

            <Select value={nameFilter} onValueChange={setNameFilter}>
              <SelectTrigger className="w-[200px]">
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
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Chargement...
        </div>
      ) : (
        <>
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
                />
              )}
            </CardContent>
          </Card>

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
              />
            </CardContent>
          </Card>

          {/* Export */}
          <div className="flex flex-wrap gap-3 justify-center">
            <ExportButton symptoms={filteredSymptoms} format="csv" />
            <ExportButton symptoms={filteredSymptoms} format="json" />
          </div>
        </>
      )}
    </div>
  );
}
