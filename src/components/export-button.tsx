"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { format } from "date-fns";
import type { SymptomResponse } from "@/lib/types";
import { toast } from "sonner";

interface ExportButtonProps {
  symptoms: SymptomResponse[];
  format: "csv" | "json";
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCSV(symptoms: SymptomResponse[]) {
  const header = "Date,Heure,Nom,Intensité,Notes";
  const rows = symptoms.map((s) => {
    const d = new Date(s.occurredAt);
    const date = format(d, "yyyy-MM-dd");
    const time = format(d, "HH:mm");
    const notes = s.notes ? `"${s.notes.replace(/"/g, '""')}"` : "";
    return `${date},${time},${s.name},${s.intensity},${notes}`;
  });

  const csv = [header, ...rows].join("\n");
  const timestamp = format(new Date(), "yyyy-MM-dd");
  downloadFile(csv, `symptomes-${timestamp}.csv`, "text/csv;charset=utf-8;");
}

function exportJSON(symptoms: SymptomResponse[]) {
  const data = symptoms.map((s) => ({
    nom: s.name,
    intensite: s.intensity,
    notes: s.notes,
    date: s.occurredAt,
    cree_le: s.createdAt,
  }));

  const json = JSON.stringify(data, null, 2);
  const timestamp = format(new Date(), "yyyy-MM-dd");
  downloadFile(json, `symptomes-${timestamp}.json`, "application/json");
}

export function ExportButton({ symptoms, format: fmt }: ExportButtonProps) {
  const handleExport = () => {
    if (symptoms.length === 0) {
      toast.error("Aucune donnée à exporter", {
        description: "Il n'y a aucun symptôme sur cette période.",
      });
      return;
    }
    
    try {
      if (fmt === "csv") {
        exportCSV(symptoms);
        toast.success("Fichier CSV exporté avec succès");
      } else {
        exportJSON(symptoms);
        toast.success("Fichier JSON exporté avec succès");
      }
    } catch (error) {
      toast.error("Erreur lors de l'export", {
        description: "Une erreur est survenue lors de la génération du fichier.",
      });
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={symptoms.length === 0}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Exporter {fmt.toUpperCase()}
    </Button>
  );
}
