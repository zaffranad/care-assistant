import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/cleanup -- Supprimer tout l'historique (symptômes + prises de médicaments)
export async function DELETE() {
  try {
    const [symptoms, medLogs] = await Promise.all([
      prisma.symptom.deleteMany(),
      prisma.medicationLog.deleteMany(),
    ]);

    const total = symptoms.count + medLogs.count;

    return NextResponse.json({
      success: true,
      deleted: total,
      message: `${symptoms.count} symptôme(s) et ${medLogs.count} prise(s) de médicament supprimés`,
    });
  } catch (error) {
    console.error("Error cleaning up:", error);
    return NextResponse.json(
      { error: "Erreur lors du nettoyage de la base de données" },
      { status: 500 }
    );
  }
}
