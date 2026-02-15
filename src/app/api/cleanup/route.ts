import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/cleanup -- Supprimer tout l'historique des symptômes
export async function DELETE() {
  try {
    const result = await prisma.symptom.deleteMany();

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `${result.count} symptôme(s) supprimé(s)`,
    });
  } catch (error) {
    console.error("Error cleaning up symptoms:", error);
    return NextResponse.json(
      { error: "Erreur lors du nettoyage de la base de données" },
      { status: 500 }
    );
  }
}
