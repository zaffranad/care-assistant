import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";
import type { ExportData } from "@/lib/types";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const [predefinedSymptoms, symptoms, medications, bowelMovements] = await Promise.all([
      prisma.predefinedSymptom.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
      prisma.symptom.findMany({
        where: { userId },
        orderBy: { occurredAt: "asc" },
      }),
      prisma.medication.findMany({
        where: { userId },
        include: { logs: { orderBy: { date: "asc" } } },
      }),
      prisma.bowelMovement.findMany({
        where: { userId },
        orderBy: { occurredAt: "asc" },
      }),
    ]);

    const data: ExportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      predefinedSymptoms: predefinedSymptoms.map((ps) => ({
        name: ps.name,
        createdAt: ps.createdAt.toISOString(),
      })),
      symptoms: symptoms.map((s) => ({
        name: s.name,
        intensity: s.intensity,
        notes: s.notes,
        occurredAt: s.occurredAt.toISOString(),
        createdAt: s.createdAt.toISOString(),
      })),
      medications: medications.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        time: m.time,
        active: m.active,
        createdAt: m.createdAt.toISOString(),
        logs: m.logs.map((l) => ({
          takenAt: l.takenAt.toISOString(),
          scheduledAt: l.scheduledAt.toISOString(),
          deltaMinutes: l.deltaMinutes,
          date: l.date,
          createdAt: l.createdAt.toISOString(),
        })),
      })),
      bowelMovements: bowelMovements.map((bm) => ({
        bristolType: bm.bristolType,
        notes: bm.notes,
        occurredAt: bm.occurredAt.toISOString(),
        createdAt: bm.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export des données" },
      { status: 500 }
    );
  }
}
