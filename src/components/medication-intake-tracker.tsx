"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  PillBottle,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDateForInput, formatTimeForInput, getTodayDateString } from "@/lib/date-utils";
import { buildIntakeSuggestions, filterIntakeSuggestions } from "@/lib/medication-utils";
import type { MedicationIntakeResponse, MedicationResponse, IntakeSuggestion } from "@/lib/types";

// Dosages courants proposés en un tap (en mg)
const DOSAGE_PRESETS = [100, 200, 500, 1000];

export function MedicationIntakeTracker() {
  const [intakes, setIntakes] = useState<MedicationIntakeResponse[]>([]);
  const [suggestions, setSuggestions] = useState<IntakeSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const today = getTodayDateString();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/medication-intakes?date=${today}`);
      if (res.ok) {
        setIntakes(await res.json());
      }
    } catch {
      // Silencieux
    } finally {
      setLoading(false);
    }
  }, [today]);

  const fetchSuggestions = useCallback(async () => {
    try {
      const [intakesRes, medsRes] = await Promise.all([
        fetch("/api/medication-intakes"),
        fetch("/api/medications?all=true"),
      ]);
      const allIntakes: MedicationIntakeResponse[] = intakesRes.ok ? await intakesRes.json() : [];
      const meds: MedicationResponse[] = medsRes.ok ? await medsRes.json() : [];
      setSuggestions(buildIntakeSuggestions(allIntakes, meds));
    } catch {
      // Silencieux : l'autocomplétion est un confort, pas un bloquant
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchSuggestions();
  }, [fetchData, fetchSuggestions]);

  const matchingSuggestions = filterIntakeSuggestions(suggestions, name);

  const pickSuggestion = (suggestion: IntakeSuggestion) => {
    setName(suggestion.name);
    setDosage(String(suggestion.dosage));
    setShowSuggestions(false);
  };

  const canSubmit = name.trim().length > 0 && Number(dosage) > 0;

  const submitIntake = async (takenAt: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/medication-intakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          dosage: Number(dosage),
          notes: notes.trim() || undefined,
          takenAt,
        }),
      });

      if (res.ok) {
        toast.success(`Prise de "${name.trim()}" enregistrée`, {
          description: `${dosage} mg le ${format(new Date(takenAt), "dd/MM à HH:mm", { locale: fr })}`,
        });
        setName("");
        setDosage("");
        setNotes("");
        setShowNotes(false);
        setUseCustomTime(false);
        setCustomDate("");
        setCustomTime("");
        fetchData();
        fetchSuggestions();
      } else {
        const error = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        toast.error("Impossible d'enregistrer la prise", { description: error.error });
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitNow = () => submitIntake(new Date().toISOString());

  const handleSubmitCustom = () => {
    if (!customDate || !customTime) return;
    const takenAt = new Date(`${customDate}T${customTime}:00`);
    if (isNaN(takenAt.getTime())) return;
    submitIntake(takenAt.toISOString());
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/medication-intakes/${id}`, { method: "DELETE" });
      if (res.ok) {
        setIntakes((prev) => prev.filter((i) => i.id !== id));
        toast.success("Prise supprimée");
      } else {
        toast.error("Impossible de supprimer");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PillBottle className="h-5 w-5 text-primary" />
          Prise ponctuelle
          {intakes.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {intakes.length} aujourd&apos;hui
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Saisie du médicament */}
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_110px] gap-2.5">
            <div className="space-y-1.5 relative">
              <Label htmlFor="intake-name" className="text-xs text-muted-foreground">
                Médicament
              </Label>
              <Input
                id="intake-name"
                placeholder="Ex : Doliprane"
                autoComplete="off"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setShowSuggestions(false)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowSuggestions(false);
                }}
              />
              {showSuggestions && name.trim() !== "" && matchingSuggestions.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md max-h-48 overflow-y-auto">
                  {matchingSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.name}
                      type="button"
                      // preventDefault pour ne pas déclencher le blur de l'input avant le clic
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickSuggestion(suggestion)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <span className="truncate">{suggestion.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {suggestion.dosage} mg
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="intake-dosage" className="text-xs text-muted-foreground">
                Dosage (mg)
              </Label>
              <Input
                id="intake-dosage"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="500"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
              />
            </div>
          </div>

          {/* Raccourcis : médicaments récents quand le champ est vide, sinon dosages courants */}
          {name.trim() === "" && suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.slice(0, 6).map((suggestion) => (
                <button
                  key={suggestion.name}
                  type="button"
                  onClick={() => pickSuggestion(suggestion)}
                  className="rounded-full border px-2.5 py-1 text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {suggestion.name}{" "}
                  <span className="text-muted-foreground">{suggestion.dosage} mg</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Dosage :</span>
              {DOSAGE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDosage(String(preset))}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    dosage === String(preset)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {preset} mg
                </button>
              ))}
            </div>
          )}

          {/* Notes toggle */}
          <button
            type="button"
            onClick={() => setShowNotes((prev) => !prev)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showNotes ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            Ajouter une note
          </button>

          {showNotes && (
            <Textarea
              placeholder="Raison de la prise, remarques..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="min-h-12 text-sm"
            />
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button
            className="w-full gap-2"
            onClick={handleSubmitNow}
            disabled={submitting || !canSubmit}
          >
            <CheckCircle2 className="h-4 w-4" />
            {submitting ? "Enregistrement…" : "Je viens de prendre"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setUseCustomTime((prev) => {
                const next = !prev;
                if (next && !customDate) {
                  const now = new Date();
                  setCustomDate(formatDateForInput(now));
                  setCustomTime(formatTimeForInput(now));
                }
                return next;
              });
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {useCustomTime ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            Préciser la date et l&apos;heure de prise
          </button>

          {useCustomTime && (
            <div className="space-y-2 pt-1 border-t border-border/50">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Heure</Label>
                  <Input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                  />
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="w-full gap-2"
                onClick={handleSubmitCustom}
                disabled={submitting || !canSubmit || !customDate || !customTime}
              >
                <CheckCircle2 className="h-4 w-4" />
                {submitting ? "Enregistrement…" : "Confirmer à cette heure"}
              </Button>
            </div>
          )}
        </div>

        {/* Prises du jour */}
        {intakes.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Aujourd&apos;hui
            </Label>
            {intakes.map((intake) => (
              <div
                key={intake.id}
                className="rounded-lg border p-2.5 flex items-center gap-2.5 bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900"
              >
                <PillBottle className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-sm">{intake.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {intake.dosage} mg
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(intake.takenAt), "HH:mm", { locale: fr })}
                    </span>
                  </div>
                  {intake.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {intake.notes}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(intake.id)}
                  disabled={deletingId === intake.id}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 -m-1 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
