"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatTimeForInput, getTodayDateString } from "@/lib/date-utils";
import type { SignificantEventResponse } from "@/lib/types";

export function SignificantEventTracker() {
  const [events, setEvents] = useState<SignificantEventResponse[]>([]);
  const [text, setText] = useState("");
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(formatTimeForInput(new Date()));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const today = getTodayDateString();

  const fetchTodayEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/significant-events?date=${today}`);
      if (res.ok) {
        setEvents(await res.json());
      }
    } catch {
      // Silencieux : la saisie reste possible si le chargement échoue.
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchTodayEvents();
  }, [fetchTodayEvents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !date || !time) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/significant-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, date, time }),
      });

      if (res.ok) {
        setText("");
        setDate(today);
        setTime(formatTimeForInput(new Date()));
        toast.success("Fait marquant enregistré", {
          description: "Il apparaîtra dans la timeline et les graphiques.",
        });
        fetchTodayEvents();
      } else {
        const error = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        toast.error("Impossible d'enregistrer le fait marquant", {
          description: error.error || "Veuillez réessayer.",
        });
      }
    } catch {
      toast.error("Erreur de connexion", {
        description: "Impossible de contacter le serveur.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/significant-events/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEvents((prev) => prev.filter((event) => event.id !== id));
        toast.success("Fait marquant supprimé");
      } else {
        toast.error("Impossible de supprimer le fait marquant");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Fait marquant
          {events.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {events.length} aujourd&apos;hui
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="significant-event-text">Texte libre</Label>
            <Textarea
              id="significant-event-text"
              placeholder="Ex : Rendez-vous médical, changement de traitement, événement important..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="min-h-20"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="significant-event-date">Date</Label>
              <Input
                id="significant-event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="significant-event-time">Heure</Label>
              <Input
                id="significant-event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={submitting || !text.trim() || !date || !time}>
              {submitting ? "Enregistrement..." : "Ajouter"}
            </Button>
          </div>
        </form>

        {!loading && events.length > 0 && (
          <div className="space-y-2 border-t border-border/50 pt-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Aujourd&apos;hui
            </Label>
            {events.map((event) => (
              <div
                key={event.id}
                className="rounded-lg border bg-violet-50/70 p-2.5 dark:bg-violet-950/20"
              >
                <div className="flex items-start gap-2.5">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{event.text}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(`${event.date}T12:00:00`), "d MMMM yyyy", {
                        locale: fr,
                      })} à {event.time}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(event.id)}
                    disabled={deletingId === event.id}
                    className="shrink-0 p-1 -m-1 text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="Supprimer le fait marquant"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
