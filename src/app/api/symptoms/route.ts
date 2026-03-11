import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

// GET /api/symptoms?date=YYYY-MM-DD or ?from=YYYY-MM-DD&to=YYYY-MM-DD
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

    let where: Record<string, unknown> = { userId };

    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const dayEnd = new Date(`${date}T23:59:59.999Z`);
      where = {
        userId,
        occurredAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      };
    } else if (from && to) {
      const fromDate = new Date(`${from}T00:00:00.000Z`);
      const toDate = new Date(`${to}T23:59:59.999Z`);
      where = {
        userId,
        occurredAt: {
          gte: fromDate,
          lte: toDate,
        },
      };
    }

    const symptoms = await prisma.symptom.findMany({
      where,
      orderBy: { occurredAt: "desc" },
    });

    return NextResponse.json(symptoms);
  } catch (error) {
    console.error("Error fetching symptoms:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des symptômes" },
      { status: 500 }
    );
  }
}

// POST /api/symptoms
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { name, intensity, notes, occurredAt } = body;

    if (!name || !intensity || !occurredAt) {
      return NextResponse.json(
        { error: "Les champs nom, intensité et date sont requis" },
        { status: 400 }
      );
    }

    if (intensity < 1 || intensity > 10) {
      return NextResponse.json(
        { error: "L'intensité doit être entre 1 et 10" },
        { status: 400 }
      );
    }

    const symptom = await prisma.symptom.create({
      data: {
        name: name.trim(),
        intensity: Number(intensity),
        notes: notes?.trim() || null,
        occurredAt: new Date(occurredAt),
        userId,
      },
    });

    return NextResponse.json(symptom, { status: 201 });
  } catch (error) {
    console.error("Error creating symptom:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du symptôme" },
      { status: 500 }
    );
  }
}
