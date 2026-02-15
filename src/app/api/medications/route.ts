import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/medications -- Liste des médicaments (actifs par défaut, ?all=true pour tous)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    const medications = await prisma.medication.findMany({
      where: all ? {} : { active: true },
      orderBy: { time: "asc" },
    });

    return NextResponse.json(medications);
  } catch (error) {
    console.error("Error fetching medications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des médicaments" },
      { status: 500 }
    );
  }
}

// POST /api/medications -- Ajouter un médicament
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, dosage, time } = body;

    if (!name?.trim() || !dosage || !time) {
      return NextResponse.json(
        { error: "Les champs nom, posologie et heure de prise sont requis" },
        { status: 400 }
      );
    }

    const medication = await prisma.medication.create({
      data: {
        name: name.trim(),
        dosage: Number(dosage),
        time: time.trim(),
      },
    });

    return NextResponse.json(medication, { status: 201 });
  } catch (error) {
    console.error("Error creating medication:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du médicament" },
      { status: 500 }
    );
  }
}
