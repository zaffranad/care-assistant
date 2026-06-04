import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";
import { occurredAtRange } from "@/lib/query-utils";
import { Prisma } from "@/generated/prisma/client";

// GET /api/bowel-movements?date=YYYY-MM-DD or ?from=YYYY-MM-DD&to=YYYY-MM-DD
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

    const where: Prisma.BowelMovementWhereInput = {
      userId,
      ...(range ? { occurredAt: range } : {}),
    };

    const movements = await prisma.bowelMovement.findMany({
      where,
      orderBy: { occurredAt: "desc" },
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error("Error fetching bowel movements:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des selles" },
      { status: 500 }
    );
  }
}

// POST /api/bowel-movements
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { bristolType, notes, occurredAt } = body;

    if (!bristolType || !occurredAt) {
      return NextResponse.json(
        { error: "Le type Bristol et la date sont requis" },
        { status: 400 }
      );
    }

    if (bristolType < 1 || bristolType > 7) {
      return NextResponse.json(
        { error: "Le type Bristol doit être entre 1 et 7" },
        { status: 400 }
      );
    }

    const movement = await prisma.bowelMovement.create({
      data: {
        bristolType: Number(bristolType),
        notes: notes?.trim() || null,
        occurredAt: new Date(occurredAt),
        userId,
      },
    });

    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error("Error creating bowel movement:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement" },
      { status: 500 }
    );
  }
}
