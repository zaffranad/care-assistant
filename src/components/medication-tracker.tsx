"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pill,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getTodayDateString } from "@/lib/date-utils";
import type { MedicationResponse, MedicationLogResponse } from "@/lib/types";

type MedStatus = "pending" | "upcoming" | "due" | "overdue" | "taken";

interface MedWithStatus extends MedicationResponse {
  status: MedStatus;
  log?: MedicationLogResponse;
  minutesUntil: number;
}

function getTimeMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getMedStatus(
  med: MedicationResponse,
  log?: MedicationLogResponse
): { status: MedStatus; minutesUntil: number } {
  if (log) return { status: "taken", minutesUntil: 0 };

  const currentMin = getCurrentMinutes();
  const schedMin = getTimeMinutes(med.time);
  const diff = schedMin - currentMin;

  if (diff > 60) return { status: "pending", minutesUntil: diff };
  if (diff > 0) return { status: "upcoming", minutesUntil: diff };
  if (diff > -30) return { status: "due", minutesUntil: diff };
  return { status: "overdue", minutesUntil: diff };
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

function StatusBadge({ status }: { status: MedStatus }) {
  switch (status) {
    case "taken":
      return (
        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-medium">Pris</span>
        </div>
      );
    case "due":
      return (
        <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 animate-pulse">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs font-medium">À prendre</span>
        </div>
      );
    case "overdue":
      return (
        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs font-medium">En retard</span>
        </div>
      );
    case "upcoming":
      return (
        <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
          <Clock className="h-4 w-4" />
          <span className="text-xs font-medium">Bientôt</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-xs font-medium">Plus tard</span>
        </div>
      );
  }
}

export function MedicationTracker() {
  const [meds, setMeds] = useState<MedWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [showCustomTime, setShowCustomTime] = useState<Record<string, boolean>>({});
  const [customTimes, setCustomTimes] = useState<Record<string, string>>({});

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

        const medsWithStatus: MedWithStatus[] = medsData.map((med) => {
          const log = logsData.find((l) => l.medicationId === med.id);
          const { status, minutesUntil } = getMedStatus(med, log);
          return { ...med, status, log, minutesUntil };
        });

        const order: Record<MedStatus, number> = {
          due: 0, overdue: 1, upcoming: 2, pending: 3, taken: 4,
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
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const submitConfirmation = async (
    medId: string,
    delta: number,
    date: string,
    name: string,
    takenLabel: string
  ) => {
    setSubmitting((prev) => ({ ...prev, [medId]: true }));
    try {
      const res = await fetch("/api/medication-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicationId: medId, date, deltaMinutes: delta }),
      });

      if (res.ok) {
        toast.success(`Prise de "${name}" confirmée`, { description: takenLabel });
        setShowCustomTime((prev) => ({ ...prev, [medId]: false }));
        fetchData();
      } else {
        const error = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        toast.error("Impossible de confirmer la prise", { description: error.error });
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setSubmitting((prev) => ({ ...prev, [medId]: false }));
    }
  };

  // Confirme la prise à l'instant présent
  const handleConfirmNow = (med: MedWithStatus) => {
    const now = new Date();
    const dateStr = format(now, "yyyy-MM-dd");
    const scheduledAt = new Date(`${dateStr}T${med.time}:00`);
    const delta = Math.round((now.getTime() - scheduledAt.getTime()) / 60_000);
    const label = delta === 0 ? "À l'heure" : formatDelta(delta);
    submitConfirmation(med.id, delta, dateStr, med.name, label);
  };

  // Confirme la prise à une date/heure choisie
  const handleConfirmCustom = (med: MedWithStatus) => {
    const raw = customTimes[med.id];
    if (!raw) return;
    const takenAt = new Date(raw);
    if (isNaN(takenAt.getTime())) return;
    const dateStr = format(takenAt, "yyyy-MM-dd");
    const scheduledAt = new Date(`${dateStr}T${med.time}:00`);
    const delta = Math.round((takenAt.getTime() - scheduledAt.getTime()) / 60_000);
    const label = `${format(takenAt, "dd/MM à HH:mm", { locale: fr })} (${formatDelta(delta)})`;
    submitConfirmation(med.id, delta, dateStr, med.name, label);
  };

  const toggleCustomTime = (medId: string) => {
    setShowCustomTime((prev) => {
      const next = !prev[medId];
      if (next && !customTimes[medId]) {
        // Pré-remplir avec l'heure actuelle
        setCustomTimes((ct) => ({
          ...ct,
          [medId]: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        }));
      }
      return { ...prev, [medId]: next };
    });
  };

  if (loading || meds.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
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
              "rounded-lg border transition-all",
              med.status === "taken" &&
                "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900",
              med.status === "due" &&
                "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900",
              med.status === "overdue" &&
                "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
              med.status === "upcoming" &&
                "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900",
              med.status === "pending" && "bg-muted/30 border-border"
            )}
          >
            {/* En-tête de la carte médicament */}
            <div className="flex items-center gap-3 p-3">
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
              <StatusBadge status={med.status} />
            </div>

            {/* Confirmation de prise */}
            {med.status === "taken" && med.log ? (
              <div className="px-3 pb-3 text-xs text-muted-foreground">
                Pris le{" "}
                {format(new Date(med.log.takenAt), "dd/MM à HH:mm", { locale: fr })}{" "}
                <span className="font-medium">({formatDelta(med.log.deltaMinutes)})</span>
              </div>
            ) : (
              <div className="px-3 pb-3 space-y-2">
                {/* Bouton principal */}
                <Button
                  className="w-full gap-2"
                  onClick={() => handleConfirmNow(med)}
                  disabled={submitting[med.id]}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {submitting[med.id] ? "Enregistrement…" : "Je viens de prendre"}
                </Button>

                {/* Toggle "Préciser l'heure" */}
                <button
                  type="button"
                  onClick={() => toggleCustomTime(med.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCustomTime[med.id] ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  Préciser la date et l&apos;heure de prise
                </button>

                {/* Panneau de saisie d'heure personnalisée */}
                {showCustomTime[med.id] && (
                  <div className="space-y-2 pt-1 border-t border-border/50">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Date et heure de prise
                      </Label>
                      <Input
                        type="datetime-local"
                        value={customTimes[med.id] || ""}
                        max={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                        onChange={(e) =>
                          setCustomTimes((prev) => ({
                            ...prev,
                            [med.id]: e.target.value,
                          }))
                        }
                        className="h-9 text-sm"
                      />
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => handleConfirmCustom(med)}
                      disabled={submitting[med.id] || !customTimes[med.id]}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {submitting[med.id] ? "Enregistrement…" : "Confirmer à cette heure"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
