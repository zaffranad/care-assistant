"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDateForInput, formatTimeForInput, getTodayDateString } from "@/lib/date-utils";
import {
  BRISTOL_SCALE,
  getBristolColor,
  getBristolBgClass,
  getCategoryBadgeClasses,
} from "@/lib/bristol";
import type { BowelMovementResponse } from "@/lib/types";

export function BowelMovementTracker() {
  const [movements, setMovements] = useState<BowelMovementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [bristolValue, setBristolValue] = useState(4);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const today = getTodayDateString();
  const currentBristol = BRISTOL_SCALE[bristolValue - 1];

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/bowel-movements?date=${today}`);
      if (res.ok) {
        setMovements(await res.json());
      }
    } catch {
      // Silencieux
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const submitMovement = async (occurredAt: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/bowel-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bristolType: bristolValue,
          notes: notes.trim() || undefined,
          occurredAt,
        }),
      });

      if (res.ok) {
        toast.success("Selle enregistrée", {
          description: `Type ${bristolValue} — ${currentBristol.description}`,
        });
        setNotes("");
        setShowNotes(false);
        setUseCustomTime(false);
        setCustomDate("");
        setCustomTime("");
        fetchData();
      } else {
        const error = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        toast.error("Impossible d'enregistrer", { description: error.error });
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitNow = () => submitMovement(new Date().toISOString());

  const handleSubmitCustom = () => {
    if (!customDate || !customTime) return;
    submitMovement(new Date(`${customDate}T${customTime}:00`).toISOString());
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/bowel-movements/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMovements((prev) => prev.filter((m) => m.id !== id));
        toast.success("Enregistrement supprimé");
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
          <span className="text-lg">🚽</span>
          Transit intestinal
          {movements.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {movements.length} aujourd&apos;hui
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bristol slider — always visible */}
        <div className="space-y-3">
          {/* Info panel for current selection */}
          <div className={cn(
            "rounded-lg border p-3 flex items-center gap-3 transition-all",
            getBristolBgClass(bristolValue)
          )}>
            <span className="text-2xl leading-none">{currentBristol.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("font-semibold", getBristolColor(bristolValue))}>
                  Type {bristolValue}
                </span>
                <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                  getCategoryBadgeClasses(bristolValue)
                )}>
                  {currentBristol.category}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {currentBristol.description}
              </p>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-1.5">
            <Label className="flex items-center justify-between gap-2">
              Type Bristol
              <span className="font-semibold text-primary">{bristolValue}/7</span>
            </Label>
            <div className="space-y-1.5 pt-1">
              <Slider
                min={1}
                max={7}
                step={1}
                value={[bristolValue]}
                onValueChange={(v) => setBristolValue(v[0] ?? 4)}
                aria-label="Type Bristol"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Dur (1)</span>
                <span>Liquide (7)</span>
              </div>
            </div>
          </div>

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
              placeholder="Couleur, douleur, remarques..."
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
            disabled={submitting}
          >
            <CheckCircle2 className="h-4 w-4" />
            {submitting ? "Enregistrement…" : "C'est maintenant"}
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
            Préciser la date et l&apos;heure
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
                disabled={submitting || !customDate || !customTime}
              >
                <CheckCircle2 className="h-4 w-4" />
                {submitting ? "Enregistrement…" : "Confirmer à cette heure"}
              </Button>
            </div>
          )}
        </div>

        {/* Today's entries */}
        {movements.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Aujourd&apos;hui
            </Label>
            {movements.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "rounded-lg border p-2.5 flex items-center gap-2.5",
                  getBristolBgClass(m.bristolType)
                )}
              >
                <span className="text-base leading-none">
                  {BRISTOL_SCALE[m.bristolType - 1].emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={cn("font-medium text-sm", getBristolColor(m.bristolType))}>
                      Type {m.bristolType}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {BRISTOL_SCALE[m.bristolType - 1].description}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(m.occurredAt), "HH:mm", { locale: fr })}
                    </span>
                  </div>
                  {m.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.notes}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  disabled={deletingId === m.id}
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
