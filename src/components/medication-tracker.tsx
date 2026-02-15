"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pill,
  Check,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getTodayDateString } from "@/lib/date-utils";
import type { MedicationResponse, MedicationLogResponse } from "@/lib/types";

type MedStatus = "pending" | "upcoming" | "due" | "overdue" | "taken";

interface MedWithStatus extends MedicationResponse {
  status: MedStatus;
  log?: MedicationLogResponse;
  minutesUntil: number; // minutes avant/après l'heure prévue
}

const DELTA_OPTIONS = [
  { value: "0", label: "À l'heure" },
  { value: "-120", label: "−2h (en avance)" },
  { value: "-60", label: "−1h" },
  { value: "-30", label: "−30min" },
  { value: "-15", label: "−15min" },
  { value: "15", label: "+15min (en retard)" },
  { value: "30", label: "+30min" },
  { value: "60", label: "+1h" },
  { value: "120", label: "+2h" },
  { value: "180", label: "+3h" },
];

function getTimeMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getMedStatus(med: MedicationResponse, log?: MedicationLogResponse): { status: MedStatus; minutesUntil: number } {
  if (log) {
    return { status: "taken", minutesUntil: 0 };
  }

  const currentMin = getCurrentMinutes();
  const schedMin = getTimeMinutes(med.time);
  const diff = schedMin - currentMin; // positif = dans le futur

  if (diff > 60) return { status: "pending", minutesUntil: diff };
  if (diff > 0) return { status: "upcoming", minutesUntil: diff };
  if (diff > -30) return { status: "due", minutesUntil: diff };
  return { status: "overdue", minutesUntil: diff };
}

function StatusIndicator({ status }: { status: MedStatus }) {
  switch (status) {
    case "taken":
      return (
        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-xs font-medium">Pris</span>
        </div>
      );
    case "due":
      return (
        <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 animate-pulse">
          <AlertCircle className="h-5 w-5" />
          <span className="text-xs font-medium">À prendre</span>
        </div>
      );
    case "overdue":
      return (
        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span className="text-xs font-medium">En retard</span>
        </div>
      );
    case "upcoming":
      return (
        <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
          <Clock className="h-5 w-5" />
          <span className="text-xs font-medium">Bientôt</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-5 w-5" />
          <span className="text-xs font-medium">Plus tard</span>
        </div>
      );
  }
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

export function MedicationTracker() {
  const [meds, setMeds] = useState<MedWithStatus[]>([]);
  const [logs, setLogs] = useState<MedicationLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeltas, setSelectedDeltas] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const today = getTodayDateString();

  const fetchData = useCallback(async () => {
    try {
      const [medsRes, logsRes] = await Promise.all([
        fetch("/api/medications"),
        fetch(`/api/medication-logs?date=${today}`),
      ]);

      if (medsRes.ok && logsRes.ok) {
        const medsData: MedicationResponse[] = await medsRes.json();
        const logsData: MedicationLogResponse[] = await logsRes.json();
        setLogs(logsData);

        const medsWithStatus: MedWithStatus[] = medsData.map((med) => {
          const log = logsData.find((l) => l.medicationId === med.id);
          const { status, minutesUntil } = getMedStatus(med, log);
          return { ...med, status, log, minutesUntil };
        });

        // Trier : due/overdue en premier, puis upcoming, puis pending, puis taken
        const order: Record<MedStatus, number> = {
          due: 0,
          overdue: 1,
          upcoming: 2,
          pending: 3,
          taken: 4,
        };
        medsWithStatus.sort((a, b) => order[a.status] - order[b.status]);

        setMeds(medsWithStatus);
      }
    } catch {
      // Silencieux
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchData();
    // Rafraîchir le statut toutes les minutes
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleConfirm = async (medId: string) => {
    setSubmitting((prev) => ({ ...prev, [medId]: true }));
    try {
      const delta = Number(selectedDeltas[medId] || "0");
      const res = await fetch("/api/medication-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationId: medId,
          date: today,
          deltaMinutes: delta,
        }),
      });

      if (res.ok) {
        const med = meds.find((m) => m.id === medId);
        toast.success(`Prise de "${med?.name}" confirmée`, {
          description: delta === 0 ? "À l'heure" : formatDelta(delta),
        });
        fetchData();
      } else {
        const error = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        toast.error("Impossible de confirmer la prise", {
          description: error.error,
        });
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setSubmitting((prev) => ({ ...prev, [medId]: false }));
    }
  };

  if (loading) {
    return null;
  }

  if (meds.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Pill className="h-5 w-5 text-primary" />
          Médicaments du jour
          <Badge variant="secondary" className="ml-auto">
            {meds.filter((m) => m.status === "taken").length}/{meds.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {meds.map((med) => (
          <div
            key={med.id}
            className={cn(
              "p-3 rounded-lg border transition-all",
              med.status === "taken" && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900",
              med.status === "due" && "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900",
              med.status === "overdue" && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
              med.status === "upcoming" && "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900",
              med.status === "pending" && "bg-muted/30 border-border"
            )}
          >
            <div className="flex items-center gap-3 flex-wrap">
              {/* Infos médicament */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{med.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {med.dosage} mg
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    prévu à {med.time}
                  </span>
                </div>
              </div>

              {/* Statut */}
              <StatusIndicator status={med.status} />
            </div>

            {/* Actions selon le statut */}
            {med.status === "taken" && med.log ? (
              <p className="text-xs text-muted-foreground mt-2">
                Pris {formatDelta(med.log.deltaMinutes)}
              </p>
            ) : (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Select
                  value={selectedDeltas[med.id] || "0"}
                  onValueChange={(v) =>
                    setSelectedDeltas((prev) => ({ ...prev, [med.id]: v }))
                  }
                >
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELTA_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={() => handleConfirm(med.id)}
                  disabled={submitting[med.id]}
                >
                  <Check className="h-3.5 w-3.5" />
                  {submitting[med.id] ? "..." : "Confirmer la prise"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
