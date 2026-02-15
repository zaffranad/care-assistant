import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/medications/[id] -- Modifier un médicament (désactiver, modifier)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const medication = await prisma.medication.update({
      where: { id },
      data: body,
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
    const { id } = await params;

    await prisma.medication.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting medication:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du médicament" },
      { status: 500 }
    );
  }
}
