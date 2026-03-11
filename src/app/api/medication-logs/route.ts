import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

// GET /api/medication-logs?date=YYYY-MM-DD or ?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let dateFilter: Record<string, unknown> = {};

    if (date) {
      dateFilter = { date };
    } else if (from && to) {
      dateFilter = {
        date: {
          gte: from,
          lte: to,
        },
      };
    }

    const logs = await prisma.medicationLog.findMany({
      where: {
        ...dateFilter,
        medication: { userId },
      },
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
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { medicationId, date, deltaMinutes } = body;

    if (!medicationId || !date) {
      return NextResponse.json(
        { error: "L'identifiant du médicament et la date sont requis" },
        { status: 400 }
      );
    }

    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
    });

    if (!medication || medication.userId !== userId) {
      return NextResponse.json(
        { error: "Médicament introuvable" },
        { status: 404 }
      );
    }

    const scheduledAt = new Date(`${date}T${medication.time}:00`);
    const delta = Number(deltaMinutes) || 0;
    const takenAt = new Date(scheduledAt.getTime() + delta * 60 * 1000);

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
