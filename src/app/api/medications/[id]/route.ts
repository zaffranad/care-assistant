import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

// PATCH /api/medications/[id] -- Modifier un médicament (active, dosage, time)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.medication.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Médicament introuvable" }, { status: 404 });
    }

    const body = await request.json();

    const data: { active?: boolean; dosage?: number; time?: string } = {};
    if (typeof body.active === "boolean") data.active = body.active;
    if (typeof body.dosage === "number" && body.dosage > 0) data.dosage = body.dosage;
    if (typeof body.time === "string" && body.time.length > 0) data.time = body.time;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ valide à mettre à jour" },
        { status: 400 }
      );
    }

    const medication = await prisma.medication.update({
      where: { id },
      data,
    });

    return NextResponse.json(medication);
  } catch (error) {
    console.error("Error updating medication:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du médicament" },
      { status: 500 }
    );
  }
}

// DELETE /api/medications/[id] -- Supprimer un médicament et ses logs
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.medication.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Médicament introuvable" }, { status: 404 });
    }

    await prisma.medication.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting medication:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du médicament" },
      { status: 500 }
    );
  }
}
