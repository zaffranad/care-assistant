"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Settings,
  Plus,
  X,
  Trash2,
  AlertTriangle,
  ListRestart,
} from "lucide-react";
import { toast } from "sonner";
import type { PredefinedSymptomResponse } from "@/lib/types";

export default function SettingsPage() {
  const [predefined, setPredefined] = useState<PredefinedSymptomResponse[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchPredefined = useCallback(async () => {
    try {
      const res = await fetch("/api/predefined-symptoms");
      if (res.ok) {
        const data = await res.json();
        setPredefined(data);
      } else {
        toast.error("Impossible de charger la liste des symptômes");
      }
    } catch {
      toast.error("Erreur de connexion", {
        description: "Impossible de contacter le serveur.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPredefined();
  }, [fetchPredefined]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setAdding(true);
    try {
      const res = await fetch("/api/predefined-symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (res.ok) {
        setNewName("");
        toast.success(`"${newName.trim()}" ajouté à la liste`);
        fetchPredefined();
      } else {
        const error = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        toast.error("Impossible d'ajouter le symptôme", {
          description: error.error,
        });
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteOne = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/predefined-symptoms/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPredefined((prev) => prev.filter((s) => s.id !== id));
        toast.success(`"${name}" retiré de la liste`, {
          description: "Les données historiques restent disponibles.",
        });
      } else {
        const error = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        toast.error("Impossible de supprimer le symptôme", {
          description: error.error,
        });
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  const handleResetList = async () => {
    try {
      const res = await fetch("/api/predefined-symptoms", {
        method: "DELETE",
      });
      if (res.ok) {
        setPredefined([]);
        toast.success("Liste des symptômes vidée", {
          description: "Les données historiques restent disponibles.",
        });
      } else {
        toast.error("Impossible de vider la liste");
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  const handleCleanupHistory = async () => {
    try {
      const res = await fetch("/api/cleanup", { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        toast.success("Base de données nettoyée", {
          description: data.message,
        });
      } else {
        toast.error("Impossible de nettoyer la base de données");
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-center flex items-center justify-center gap-2">
        <Settings className="h-7 w-7 text-primary" />
        Paramètres
      </h1>

      {/* Section : Liste des symptômes prédéfinis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Symptômes prédéfinis</CardTitle>
          <CardDescription>
            Gérez la liste des symptômes disponibles lors de la saisie.
            Retirer un symptôme de cette liste ne supprime pas les données déjà enregistrées.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulaire d'ajout */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              placeholder="Nom du symptôme..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={adding || !newName.trim()} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </form>

          {/* Liste */}
          {loading ? (
            <p className="text-muted-foreground text-center py-4">Chargement...</p>
          ) : predefined.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucun symptôme prédéfini. Ajoutez-en pour faciliter la saisie.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {predefined.map((s) => (
                <Badge
                  key={s.id}
                  variant="secondary"
                  className="text-sm px-3 py-1.5 gap-1.5 group"
                >
                  {s.name}
                  <button
                    onClick={() => handleDeleteOne(s.id, s.name)}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                    aria-label={`Supprimer ${s.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Bouton reset liste */}
          {predefined.length > 0 && (
            <ConfirmDialog
              title="Vider la liste des symptômes"
              description="Cette action supprimera tous les symptômes prédéfinis de la liste. Les données historiques ne seront pas affectées."
              confirmLabel="Vider la liste"
              onConfirm={handleResetList}
            >
              <Button variant="outline" size="sm" className="gap-2 text-muted-foreground">
                <ListRestart className="h-4 w-4" />
                Vider la liste
              </Button>
            </ConfirmDialog>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Section : Zone de danger */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zone dangereuse
          </CardTitle>
          <CardDescription>
            Ces actions sont irréversibles. Procédez avec précaution.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nettoyage de l'historique */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <div>
              <p className="font-medium">Supprimer tout l&apos;historique</p>
              <p className="text-sm text-muted-foreground">
                Supprime toutes les données de symptômes enregistrés. La liste des symptômes prédéfinis sera conservée.
              </p>
            </div>
            <ConfirmDialog
              title="Supprimer tout l'historique ?"
              description="Cette action est irréversible. Toutes les données de symptômes enregistrés seront définitivement supprimées. La liste des symptômes prédéfinis ne sera pas affectée."
              confirmLabel="Tout supprimer"
              onConfirm={handleCleanupHistory}
            >
              <Button variant="destructive" size="sm" className="gap-2 whitespace-nowrap">
                <Trash2 className="h-4 w-4" />
                Supprimer l&apos;historique
              </Button>
            </ConfirmDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
