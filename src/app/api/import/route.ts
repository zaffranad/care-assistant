import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";
import type { ExportData, ImportResult } from "@/lib/types";

function validateExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (d.version !== 1) return false;
  if (!Array.isArray(d.predefinedSymptoms)) return false;
  if (!Array.isArray(d.symptoms)) return false;
  if (!Array.isArray(d.medications)) return false;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();

    if (!validateExportData(body)) {
      return NextResponse.json(
        { error: "Format de fichier invalide. Veuillez utiliser un fichier exporté depuis l'application." },
        { status: 400 }
      );
    }

    // Phase 1: Delete all existing user data
    const existingMeds = await prisma.medication.findMany({
      where: { userId },
      select: { id: true },
    });
    const existingMedIds = existingMeds.map((m) => m.id);

    await Promise.all([
      prisma.medicationLog.deleteMany({ where: { medicationId: { in: existingMedIds } } }),
      prisma.symptom.deleteMany({ where: { userId } }),
      prisma.predefinedSymptom.deleteMany({ where: { userId } }),
      prisma.bowelMovement.deleteMany({ where: { userId } }),
      prisma.significantEvent.deleteMany({ where: { userId } }),
      prisma.medicationIntake.deleteMany({ where: { userId } }),
    ]);
    await prisma.medication.deleteMany({ where: { userId } });

    // Phase 2: Import new data
    let totalLogs = 0;

    if (body.predefinedSymptoms.length > 0) {
      await prisma.predefinedSymptom.createMany({
        data: body.predefinedSymptoms.map((ps) => ({
          name: ps.name,
          createdAt: new Date(ps.createdAt),
          userId,
        })),
      });
    }

    if (body.symptoms.length > 0) {
      await prisma.symptom.createMany({
        data: body.symptoms.map((s) => ({
          name: s.name,
          intensity: s.intensity,
          notes: s.notes ?? null,
          occurredAt: new Date(s.occurredAt),
          createdAt: new Date(s.createdAt),
          userId,
        })),
      });
    }

    for (const med of body.medications) {
      const created = await prisma.medication.create({
        data: {
          name: med.name,
          dosage: med.dosage,
          time: med.time,
          active: med.active,
          createdAt: new Date(med.createdAt),
          userId,
        },
      });

      if (med.logs.length > 0) {
        await prisma.medicationLog.createMany({
          data: med.logs.map((l) => ({
            medicationId: created.id,
            takenAt: new Date(l.takenAt),
            scheduledAt: new Date(l.scheduledAt),
            deltaMinutes: l.deltaMinutes,
            date: l.date,
            createdAt: new Date(l.createdAt),
          })),
        });
        totalLogs += med.logs.length;
      }
    }

    // Import bowel movements
    const bowelMovements = body.bowelMovements ?? [];
    if (bowelMovements.length > 0) {
      await prisma.bowelMovement.createMany({
        data: bowelMovements.map((bm: { bristolType: number; notes?: string | null; occurredAt: string; createdAt: string }) => ({
          bristolType: bm.bristolType,
          notes: bm.notes ?? null,
          occurredAt: new Date(bm.occurredAt),
          createdAt: new Date(bm.createdAt),
          userId,
        })),
      });
    }

    const significantEvents = body.significantEvents ?? [];
    if (significantEvents.length > 0) {
      await prisma.significantEvent.createMany({
        data: significantEvents.map((event: { text: string; date: string; time?: string; createdAt: string }) => ({
          text: event.text,
          date: event.date,
          time: event.time ?? "12:00",
          createdAt: new Date(event.createdAt),
          userId,
        })),
      });
    }

    const medicationIntakes = body.medicationIntakes ?? [];
    if (medicationIntakes.length > 0) {
      await prisma.medicationIntake.createMany({
        data: medicationIntakes.map((intake: { name: string; dosage: number; notes?: string | null; takenAt: string; createdAt: string }) => ({
          name: intake.name,
          dosage: intake.dosage,
          notes: intake.notes ?? null,
          takenAt: new Date(intake.takenAt),
          createdAt: new Date(intake.createdAt),
          userId,
        })),
      });
    }

    const result: ImportResult = {
      success: true,
      imported: {
        predefinedSymptoms: body.predefinedSymptoms.length,
        symptoms: body.symptoms.length,
        medications: body.medications.length,
        medicationLogs: totalLogs,
        bowelMovements: bowelMovements.length,
        significantEvents: significantEvents.length,
        medicationIntakes: medicationIntakes.length,
      },
      message: [
        `${body.predefinedSymptoms.length} symptôme(s) prédéfini(s)`,
        `${body.symptoms.length} symptôme(s)`,
        `${body.medications.length} médicament(s)`,
        `${totalLogs} prise(s) de médicament`,
        `${medicationIntakes.length} prise(s) ponctuelle(s)`,
        `${bowelMovements.length} selle(s)`,
        `${significantEvents.length} fait(s) marquant(s)`,
      ].join(", "),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error importing data:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'import des données" },
      { status: 500 }
    );
  }
}
