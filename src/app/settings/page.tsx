"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Pill,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import type { PredefinedSymptomResponse, MedicationResponse } from "@/lib/types";

export default function SettingsPage() {
  const [predefined, setPredefined] = useState<PredefinedSymptomResponse[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Medications state
  const [medications, setMedications] = useState<MedicationResponse[]>([]);
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medTime, setMedTime] = useState("08:00");
  const [addingMed, setAddingMed] = useState(false);
  const [loadingMeds, setLoadingMeds] = useState(true);

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

  const fetchMedications = useCallback(async () => {
    try {
      const res = await fetch("/api/medications?all=true");
      if (res.ok) {
        const data = await res.json();
        setMedications(data);
      } else {
        toast.error("Impossible de charger les médicaments");
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setLoadingMeds(false);
    }
  }, []);

  useEffect(() => {
    fetchPredefined();
    fetchMedications();
  }, [fetchPredefined, fetchMedications]);

  // --- Symptômes prédéfinis ---

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

  // --- Médicaments ---

  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName.trim() || !medDosage || !medTime) return;

    setAddingMed(true);
    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: medName.trim(),
          dosage: Number(medDosage),
          time: medTime,
        }),
      });

      if (res.ok) {
        setMedName("");
        setMedDosage("");
        setMedTime("08:00");
        toast.success(`"${medName.trim()}" ajouté`);
        fetchMedications();
      } else {
        const error = await res.json().catch(() => ({ error: "Erreur inconnue" }));
        toast.error("Impossible d'ajouter le médicament", {
          description: error.error,
        });
      }
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setAddingMed(false);
    }
  };

  const handleToggleMed = async (med: MedicationResponse) => {
    try {
      const res = await fetch(`/api/medications/${med.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !med.active }),
      });
      if (res.ok) {
        toast.success(
          med.active
            ? `"${med.name}" désactivé`
            : `"${med.name}" réactivé`
        );
        fetchMedications();
      } else {
        toast.error("Impossible de modifier le médicament");
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  const handleDeleteMed = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/medications/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMedications((prev) => prev.filter((m) => m.id !== id));
        toast.success(`"${name}" supprimé`, {
          description: "Le médicament et son historique de prises ont été supprimés.",
        });
      } else {
        toast.error("Impossible de supprimer le médicament");
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  // --- Nettoyage ---

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

      {/* Section : Médicaments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Médicaments quotidiens
          </CardTitle>
          <CardDescription>
            Configurez vos médicaments quotidiens avec leur posologie et l&apos;heure de prise.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulaire d'ajout de médicament */}
          <form onSubmit={handleAddMed} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="medName" className="text-xs">Nom</Label>
                <Input
                  id="medName"
                  placeholder="Ex : Doliprane..."
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="medDosage" className="text-xs">Posologie (mg)</Label>
                <Input
                  id="medDosage"
                  type="number"
                  placeholder="500"
                  min="1"
                  value={medDosage}
                  onChange={(e) => setMedDosage(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="medTime" className="text-xs">Heure de prise</Label>
                <Input
                  id="medTime"
                  type="time"
                  value={medTime}
                  onChange={(e) => setMedTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={addingMed || !medName.trim() || !medDosage} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Ajouter le médicament
            </Button>
          </form>

          <Separator />

          {/* Liste des médicaments */}
          {loadingMeds ? (
            <p className="text-muted-foreground text-center py-4">Chargement...</p>
          ) : medications.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Aucun médicament configuré.
            </p>
          ) : (
            <div className="space-y-2">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    med.active
                      ? "bg-muted/50 border-border"
                      : "bg-muted/20 border-border/50 opacity-60"
                  }`}
                >
                  <Pill className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{med.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {med.dosage} mg
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {med.time}
                      </span>
                      {!med.active && (
                        <Badge variant="secondary" className="text-xs">
                          Inactif
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleMed(med)}
                    className="text-xs"
                  >
                    {med.active ? "Désactiver" : "Réactiver"}
                  </Button>
                  <ConfirmDialog
                    title={`Supprimer "${med.name}" ?`}
                    description="Le médicament et tout son historique de prises seront définitivement supprimés."
                    confirmLabel="Supprimer"
                    onConfirm={() => handleDeleteMed(med.id, med.name)}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </ConfirmDialog>
                </div>
              ))}
            </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <div>
              <p className="font-medium">Supprimer tout l&apos;historique</p>
              <p className="text-sm text-muted-foreground">
                Supprime toutes les données de symptômes et prises de médicaments. Les configurations seront conservées.
              </p>
            </div>
            <ConfirmDialog
              title="Supprimer tout l'historique ?"
              description="Cette action est irréversible. Toutes les données de symptômes et prises de médicaments seront définitivement supprimées. Les listes configurées ne seront pas affectées."
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
