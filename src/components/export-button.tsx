"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { getBristolCategory } from "@/lib/bristol";
import type { SymptomResponse, BowelMovementResponse } from "@/lib/types";
import { toast } from "sonner";

interface ExportButtonProps {
  symptoms: SymptomResponse[];
  bowelMovements?: BowelMovementResponse[];
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

function exportCSV(symptoms: SymptomResponse[], bowelMovements: BowelMovementResponse[]) {
  const sections: string[] = [];

  if (symptoms.length > 0) {
    const header = "Type,Date,Heure,Nom,Intensité,Notes";
    const rows = symptoms.map((s) => {
      const d = new Date(s.occurredAt);
      const date = format(d, "yyyy-MM-dd");
      const time = format(d, "HH:mm");
      const notes = s.notes ? `"${s.notes.replace(/"/g, '""')}"` : "";
      return `Symptôme,${date},${time},${s.name},${s.intensity},${notes}`;
    });
    sections.push(header, ...rows);
  }

  if (bowelMovements.length > 0) {
    if (sections.length > 0) sections.push("");
    const bmHeader = "Type,Date,Heure,Bristol,Catégorie,Notes";
    const bmRows = bowelMovements.map((bm) => {
      const d = new Date(bm.occurredAt);
      const date = format(d, "yyyy-MM-dd");
      const time = format(d, "HH:mm");
      const cat = getBristolCategory(bm.bristolType);
      const notes = bm.notes ? `"${bm.notes.replace(/"/g, '""')}"` : "";
      return `Selle,${date},${time},${bm.bristolType},${cat},${notes}`;
    });
    sections.push(bmHeader, ...bmRows);
  }

  const csv = sections.join("\n");
  const timestamp = format(new Date(), "yyyy-MM-dd");
  downloadFile(csv, `sante-${timestamp}.csv`, "text/csv;charset=utf-8;");
}

function exportJSON(symptoms: SymptomResponse[], bowelMovements: BowelMovementResponse[]) {
  const data = {
    symptomes: symptoms.map((s) => ({
      nom: s.name,
      intensite: s.intensity,
      notes: s.notes,
      date: s.occurredAt,
      cree_le: s.createdAt,
    })),
    selles: bowelMovements.map((bm) => ({
      bristol: bm.bristolType,
      notes: bm.notes,
      date: bm.occurredAt,
      cree_le: bm.createdAt,
    })),
  };

  const json = JSON.stringify(data, null, 2);
  const timestamp = format(new Date(), "yyyy-MM-dd");
  downloadFile(json, `sante-${timestamp}.json`, "application/json");
}

export function ExportButton({ symptoms, bowelMovements = [], format: fmt }: ExportButtonProps) {
  const totalCount = symptoms.length + bowelMovements.length;

  const handleExport = () => {
    if (totalCount === 0) {
      toast.error("Aucune donnée à exporter", {
        description: "Il n'y a aucune donnée sur cette période.",
      });
      return;
    }
    
    try {
      if (fmt === "csv") {
        exportCSV(symptoms, bowelMovements);
        toast.success("Fichier CSV exporté avec succès");
      } else {
        exportJSON(symptoms, bowelMovements);
        toast.success("Fichier JSON exporté avec succès");
      }
    } catch {
      toast.error("Erreur lors de l'export", {
        description: "Une erreur est survenue lors de la génération du fichier.",
      });
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={totalCount === 0}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Exporter {fmt.toUpperCase()}
    </Button>
  );
}
