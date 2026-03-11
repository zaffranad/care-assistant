import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

// DELETE /api/symptoms/[id]
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

    const symptom = await prisma.symptom.findUnique({ where: { id } });
    if (!symptom || symptom.userId !== userId) {
      return NextResponse.json({ error: "Symptôme introuvable" }, { status: 404 });
    }

    await prisma.symptom.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting symptom:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du symptôme" },
      { status: 500 }
    );
  }
}
