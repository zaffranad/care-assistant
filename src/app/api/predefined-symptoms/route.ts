import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/predefined-symptoms -- Liste des symptômes prédéfinis
export async function GET() {
  try {
    const symptoms = await prisma.predefinedSymptom.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(symptoms);
  } catch (error) {
    console.error("Error fetching predefined symptoms:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des symptômes prédéfinis" },
      { status: 500 }
    );
  }
}

// POST /api/predefined-symptoms -- Ajouter un symptôme prédéfini
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Le nom du symptôme est requis" },
        { status: 400 }
      );
    }

    // Vérifier si le nom existe déjà
    const existing = await prisma.predefinedSymptom.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ce symptôme existe déjà dans la liste" },
        { status: 409 }
      );
    }

    const symptom = await prisma.predefinedSymptom.create({
      data: { name: name.trim() },
    });

    return NextResponse.json(symptom, { status: 201 });
  } catch (error) {
    console.error("Error creating predefined symptom:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du symptôme prédéfini" },
      { status: 500 }
    );
  }
}

// DELETE /api/predefined-symptoms -- Supprimer TOUS les symptômes prédéfinis (reset liste)
export async function DELETE() {
  try {
    await prisma.predefinedSymptom.deleteMany();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting all predefined symptoms:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la liste" },
      { status: 500 }
    );
  }
}
