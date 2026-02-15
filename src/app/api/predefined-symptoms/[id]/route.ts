import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/predefined-symptoms/[id] -- Supprimer un symptôme prédéfini
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.predefinedSymptom.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting predefined symptom:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du symptôme prédéfini" },
      { status: 500 }
    );
  }
}
