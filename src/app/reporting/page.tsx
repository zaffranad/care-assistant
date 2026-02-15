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
import { IntensityChart } from "@/components/intensity-chart";
import { ExportButton } from "@/components/export-button";
import { Clock, TrendingUp, Filter } from "lucide-react";
import { subDays, format } from "date-fns";
import type { SymptomResponse, MedicationLogResponse } from "@/lib/types";
import { toast } from "sonner";

type PeriodFilter = "7" | "30" | "90" | "all";

export default function ReportingPage() {
  const [symptoms, setSymptoms] = useState<SymptomResponse[]>([]);
  const [medLogs, setMedLogs] = useState<MedicationLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("7");
  const [nameFilter, setNameFilter] = useState<string>("all");

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

      const [sympRes, medRes] = await Promise.all([
        fetch(`/api/symptoms${dateParams}`),
        fetch(`/api/medication-logs${dateParams}`),
      ]);

      if (sympRes.ok) {
        setSymptoms(await sympRes.json());
      } else {
        toast.error("Impossible de charger les symptômes");
      }

      if (medRes.ok) {
        setMedLogs(await medRes.json());
      }
    } catch (error) {
      toast.error("Erreur de connexion", {
        description: "Impossible de contacter le serveur.",
      });
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // Medication logs are always shown (no name filter for now)
  const filteredMedLogs = useMemo(
    () => (nameFilter === "all" ? medLogs : []),
    [medLogs, nameFilter]
  );

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
            </CardHeader>
            <CardContent>
              <Timeline symptoms={filteredSymptoms} medicationLogs={filteredMedLogs} />
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
              <IntensityChart symptoms={filteredSymptoms} />
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
