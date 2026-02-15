import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/medication-logs?date=YYYY-MM-DD or ?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let where = {};

    if (date) {
      where = { date };
    } else if (from && to) {
      where = {
        date: {
          gte: from,
          lte: to,
        },
      };
    }

    const logs = await prisma.medicationLog.findMany({
      where,
      include: { medication: true },
      orderBy: { takenAt: "desc" },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching medication logs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des prises" },
      { status: 500 }
    );
  }
}

// POST /api/medication-logs -- Enregistrer une prise de médicament
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { medicationId, date, deltaMinutes } = body;

    if (!medicationId || !date) {
      return NextResponse.json(
        { error: "L'identifiant du médicament et la date sont requis" },
        { status: 400 }
      );
    }

    // Récupérer le médicament pour connaître l'heure prévue
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
    });

    if (!medication) {
      return NextResponse.json(
        { error: "Médicament introuvable" },
        { status: 404 }
      );
    }

    // Calculer l'heure prévue et l'heure réelle
    const [hours, minutes] = medication.time.split(":").map(Number);
    const scheduledAt = new Date(`${date}T${medication.time}:00`);
    const delta = Number(deltaMinutes) || 0;
    const takenAt = new Date(scheduledAt.getTime() + delta * 60 * 1000);

    // Upsert : si déjà enregistré ce jour, mettre à jour
    const log = await prisma.medicationLog.upsert({
      where: {
        medicationId_date: {
          medicationId,
          date,
        },
      },
      update: {
        takenAt,
        scheduledAt,
        deltaMinutes: delta,
      },
      create: {
        medicationId,
        takenAt,
        scheduledAt,
        deltaMinutes: delta,
        date,
      },
      include: { medication: true },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Error creating medication log:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement de la prise" },
      { status: 500 }
    );
  }
}
