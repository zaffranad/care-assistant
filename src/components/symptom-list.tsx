"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime, getIntensityBgClass, getIntensityTextClass } from "@/lib/date-utils";
import type { SymptomResponse } from "@/lib/types";
import { toast } from "sonner";

interface SymptomListProps {
  symptoms: SymptomResponse[];
  onDelete: (id: string) => void;
}

export function SymptomList({ symptoms, onDelete }: SymptomListProps) {
  if (symptoms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ListChecks className="h-5 w-5 text-primary" />
            Symptômes du jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Aucun symptôme enregistré aujourd&apos;hui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListChecks className="h-5 w-5 text-primary" />
          Symptômes du jour
          <Badge variant="secondary" className="ml-auto">
            {symptoms.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {symptoms.map((symptom) => (
          <div
            key={symptom.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group hover:bg-muted transition-colors"
          >
            {/* Heure */}
            <span className="text-sm font-mono text-muted-foreground min-w-[3rem]">
              {formatTime(symptom.occurredAt)}
            </span>

            {/* Nom */}
            <span className="font-medium flex-1 min-w-0 truncate">
              {symptom.name}
            </span>

            {/* Barre d'intensité */}
            <div className="hidden sm:flex items-center gap-2 min-w-[120px]">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", getIntensityBgClass(symptom.intensity))}
                  style={{ width: `${symptom.intensity * 10}%` }}
                />
              </div>
              <span className={cn("text-sm font-bold min-w-[2.5rem] text-right", getIntensityTextClass(symptom.intensity))}>
                {symptom.intensity}/10
              </span>
            </div>

            {/* Intensité mobile */}
            <span className={cn("sm:hidden text-sm font-bold", getIntensityTextClass(symptom.intensity))}>
              {symptom.intensity}/10
            </span>

            {/* Supprimer */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
              onClick={() => onDelete(symptom.id)}
              aria-label="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
