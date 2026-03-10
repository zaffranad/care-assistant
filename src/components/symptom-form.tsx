"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ClipboardPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateForInput, formatTimeForInput } from "@/lib/date-utils";
import { toast } from "sonner";
import type { PredefinedSymptomResponse } from "@/lib/types";

interface SymptomFormProps {
  onSubmit: () => void;
}

export function SymptomForm({ onSubmit }: SymptomFormProps) {
  const now = new Date();
  const [name, setName] = useState("");
  const [intensity, setIntensity] = useState<number>(5);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(formatDateForInput(now));
  const [time, setTime] = useState(formatTimeForInput(now));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [predefined, setPredefined] = useState<PredefinedSymptomResponse[]>([]);
  const [showCustomNameInput, setShowCustomNameInput] = useState(false);

  const fetchPredefined = useCallback(async () => {
    try {
      const res = await fetch("/api/predefined-symptoms");
      if (res.ok) {
        const data = await res.json();
        setPredefined(data);
      }
    } catch {
      // Silencieux : on peut saisir manuellement si la liste ne charge pas
    }
  }, []);

  useEffect(() => {
    fetchPredefined();
  }, [fetchPredefined]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const occurredAt = new Date(`${date}T${time}:00`).toISOString();

      const res = await fetch("/api/symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, intensity, notes, occurredAt }),
      });

      if (res.ok) {
        setName("");
        setIntensity(5);
        setNotes("");
        const newNow = new Date();
        setDate(formatDateForInput(newNow));
        setTime(formatTimeForInput(newNow));
        setShowCustomNameInput(false);
        toast.success("Symptôme enregistré avec succès");
        onSubmit();
      } else {
        const error = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        toast.error("Impossible d'enregistrer le symptôme", {
          description: error.error || "Veuillez réessayer dans quelques instants.",
        });
      }
    } catch (error) {
      toast.error("Erreur de connexion", {
        description: "Impossible de contacter le serveur. Vérifiez votre connexion internet.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardPlus className="h-5 w-5 text-primary" />
          Nouveau symptôme
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Sélection rapide depuis les symptômes prédéfinis */}
          {predefined.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Sélection rapide</Label>
              <div className="flex flex-wrap gap-1.5">
                {predefined.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setName(s.name)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                      name === s.name
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted text-muted-foreground border-transparent hover:border-primary/30 hover:bg-accent"
                    )}
                  >
                    {s.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowCustomNameInput((prev) => !prev)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                    showCustomNameInput
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted text-muted-foreground border-transparent hover:border-primary/30 hover:bg-accent"
                  )}
                >
                  + Nouveau symptôme
                </button>
              </div>
            </div>
          )}

          {/* Nom (saisie libre ou rempli par la sélection rapide) */}
          {(predefined.length === 0 || showCustomNameInput) && (
            <div className="space-y-1.5">
              <Label htmlFor="name">
                {predefined.length > 0 ? "Nouveau nom de symptôme" : "Nom du symptôme"}
              </Label>
              <Input
                id="name"
                placeholder="Ex : Migraine, Fatigue, Nausée..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={predefined.length === 0}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Intensité */}
            <div className="space-y-1.5">
              <Label className="flex items-center justify-between gap-2">
                Intensité
                <span className="font-semibold text-primary">{intensity}/10</span>
              </Label>
              <div className="space-y-1.5 pt-1">
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[intensity]}
                  onValueChange={(value) => setIntensity(value[0] ?? 5)}
                  aria-label="Intensité du symptôme"
                />
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Faible (1)</span>
                  <span>Forte (10)</span>
                </div>
              </div>
            </div>

            {/* Date et Heure */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="time">Heure</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Détails supplémentaires..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="min-h-16"
            />
          </div>

          <Button type="submit" className="w-full h-9" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
