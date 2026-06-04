"use client";

import { useEffect, useState, useCallback } from "react";
import { SymptomForm } from "@/components/symptom-form";
import { SymptomList } from "@/components/symptom-list";
import { MedicationTracker } from "@/components/medication-tracker";
import { BowelMovementTracker } from "@/components/bowel-movement-tracker";
import { SignificantEventTracker } from "@/components/significant-event-tracker";
import { formatFullDate, getTodayDateString } from "@/lib/date-utils";
import type { SymptomResponse } from "@/lib/types";
import { toast } from "sonner";

export default function SaisiePage() {
  const [symptoms, setSymptoms] = useState<SymptomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date();

  const fetchTodaySymptoms = useCallback(async () => {
    try {
      const dateStr = getTodayDateString();
      const res = await fetch(`/api/symptoms?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setSymptoms(data);
      } else {
        toast.error("Impossible de charger les symptômes", {
          description: "Une erreur est survenue lors du chargement.",
        });
      }
    } catch {
      toast.error("Erreur de connexion", {
        description: "Impossible de contacter le serveur. Vérifiez votre connexion internet.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaySymptoms();
  }, [fetchTodaySymptoms]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/symptoms/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSymptoms((prev) => prev.filter((s) => s.id !== id));
        toast.success("Symptôme supprimé");
      } else {
        const error = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        toast.error("Impossible de supprimer le symptôme", {
          description: error.error || "Veuillez réessayer.",
        });
      }
    } catch {
      toast.error("Erreur de connexion", {
        description: "Impossible de contacter le serveur.",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Date du jour */}
      <h1 className="text-2xl sm:text-3xl font-bold capitalize text-center">
        {formatFullDate(today)}
      </h1>

      {/* Suivi médicaments */}
      <MedicationTracker />

      {/* Transit intestinal */}
      <BowelMovementTracker />

      {/* Faits marquants */}
      <SignificantEventTracker />

      {/* Formulaire */}
      <SymptomForm onSubmit={fetchTodaySymptoms} />

      {/* Liste des symptômes du jour */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Chargement...
        </div>
      ) : (
        <SymptomList symptoms={symptoms} onDelete={handleDelete} />
      )}
    </div>
  );
}
