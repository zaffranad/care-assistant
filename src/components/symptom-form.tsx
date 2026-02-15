"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ClipboardPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateForInput, formatTimeForInput, getIntensityBgClass } from "@/lib/date-utils";
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardPlus className="h-5 w-5 text-primary" />
          Nouveau symptôme
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sélection rapide depuis les symptômes prédéfinis */}
          {predefined.length > 0 && (
            <div className="space-y-2">
              <Label>Sélection rapide</Label>
              <div className="flex flex-wrap gap-2">
                {predefined.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setName(s.name)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                      name === s.name
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted text-muted-foreground border-transparent hover:border-primary/30 hover:bg-accent"
                    )}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nom (saisie libre ou rempli par la sélection rapide) */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {predefined.length > 0 ? "Ou saisir un nom" : "Nom du symptôme"}
            </Label>
            <Input
              id="name"
              placeholder="Ex : Migraine, Fatigue, Nausée..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Intensité */}
          <div className="space-y-2">
            <Label>Intensité : <span className="font-bold">{intensity}/10</span></Label>
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setIntensity(val)}
                  className={cn(
                    "w-9 h-9 rounded-md text-sm font-medium transition-all",
                    "border-2 hover:scale-110",
                    intensity === val
                      ? cn(getIntensityBgClass(val), "text-white border-transparent shadow-md")
                      : "bg-muted text-muted-foreground border-transparent hover:border-primary/30"
                  )}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Détails supplémentaires..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Date et Heure */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
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

          <Button type="submit" className="w-full" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
