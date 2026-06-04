import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";
import { dateStringRange } from "@/lib/query-utils";
import { Prisma } from "@/generated/prisma/client";

// GET /api/significant-events?date=YYYY-MM-DD or ?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = dateStringRange(
      searchParams.get("date"),
      searchParams.get("from"),
      searchParams.get("to")
    );

    const where: Prisma.SignificantEventWhereInput = {
      userId,
      ...(range ? { date: range } : {}),
    };

    const events = await prisma.significantEvent.findMany({
      where,
      orderBy: [{ date: "desc" }, { time: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching significant events:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des faits marquants" },
      { status: 500 }
    );
  }
}

// POST /api/significant-events
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const date = typeof body.date === "string" ? body.date : "";
    const time = typeof body.time === "string" ? body.time : "";

    if (!text || !date || !time) {
      return NextResponse.json(
        { error: "Le texte, la date et l'heure sont requis" },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "La date doit être au format YYYY-MM-DD" },
        { status: 400 }
      );
    }

    if (!/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json(
        { error: "L'heure doit être au format HH:mm" },
        { status: 400 }
      );
    }

    const event = await prisma.significantEvent.create({
      data: {
        text,
        date,
        time,
        userId,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating significant event:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du fait marquant" },
      { status: 500 }
    );
  }
}
