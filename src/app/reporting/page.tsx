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
import type { SymptomResponse } from "@/lib/types";

type PeriodFilter = "7" | "30" | "90" | "all";

export default function ReportingPage() {
  const [symptoms, setSymptoms] = useState<SymptomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>("7");
  const [nameFilter, setNameFilter] = useState<string>("all");

  const fetchSymptoms = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/symptoms";

      if (period !== "all") {
        const days = parseInt(period);
        const from = format(subDays(new Date(), days), "yyyy-MM-dd");
        const to = format(new Date(), "yyyy-MM-dd");
        url += `?from=${from}&to=${to}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSymptoms(data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchSymptoms();
  }, [fetchSymptoms]);

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
                <SelectItem value="all">Tous les symptômes</SelectItem>
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
              <Timeline symptoms={filteredSymptoms} />
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
