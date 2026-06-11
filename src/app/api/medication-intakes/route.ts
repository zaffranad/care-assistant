import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";
import { occurredAtRange } from "@/lib/query-utils";
import { Prisma } from "@/generated/prisma/client";

// GET /api/medication-intakes?date=YYYY-MM-DD or ?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = occurredAtRange(
      searchParams.get("date"),
      searchParams.get("from"),
      searchParams.get("to")
    );

    const where: Prisma.MedicationIntakeWhereInput = {
      userId,
      ...(range ? { takenAt: range } : {}),
    };

    const intakes = await prisma.medicationIntake.findMany({
      where,
      orderBy: { takenAt: "desc" },
    });

    return NextResponse.json(intakes);
  } catch (error) {
    console.error("Error fetching medication intakes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des prises ponctuelles" },
      { status: 500 }
    );
  }
}

// POST /api/medication-intakes -- Enregistrer une prise ponctuelle de médicament
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { name, dosage, notes, takenAt } = body;

    if (!name?.trim() || !takenAt) {
      return NextResponse.json(
        { error: "Le nom du médicament et la date de prise sont requis" },
        { status: 400 }
      );
    }

    const dosageValue = Number(dosage);
    if (!Number.isFinite(dosageValue) || dosageValue <= 0) {
      return NextResponse.json(
        { error: "Le dosage doit être un nombre positif (en mg)" },
        { status: 400 }
      );
    }

    const takenAtDate = new Date(takenAt);
    if (isNaN(takenAtDate.getTime())) {
      return NextResponse.json(
        { error: "La date de prise est invalide" },
        { status: 400 }
      );
    }

    const intake = await prisma.medicationIntake.create({
      data: {
        name: name.trim(),
        dosage: Math.round(dosageValue),
        notes: notes?.trim() || null,
        takenAt: takenAtDate,
        userId,
      },
    });

    return NextResponse.json(intake, { status: 201 });
  } catch (error) {
    console.error("Error creating medication intake:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement de la prise" },
      { status: 500 }
    );
  }
}
