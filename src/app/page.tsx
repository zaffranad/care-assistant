"use client";

import { useEffect, useState, useCallback } from "react";
import { SymptomForm } from "@/components/symptom-form";
import { SymptomList } from "@/components/symptom-list";
import { formatFullDate, getTodayDateString } from "@/lib/date-utils";
import type { SymptomResponse } from "@/lib/types";

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
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
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
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Date du jour */}
      <h1 className="text-2xl sm:text-3xl font-bold capitalize text-center">
        {formatFullDate(today)}
      </h1>

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
