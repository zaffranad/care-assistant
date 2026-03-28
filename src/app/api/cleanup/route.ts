import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/auth";

// DELETE /api/cleanup -- Supprimer tout l'historique de l'utilisateur (symptômes + prises de médicaments)
export async function DELETE() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userMedications = await prisma.medication.findMany({
      where: { userId },
      select: { id: true },
    });
    const medicationIds = userMedications.map((m) => m.id);

    const [symptoms, medLogs, bowelMovements] = await Promise.all([
      prisma.symptom.deleteMany({ where: { userId } }),
      prisma.medicationLog.deleteMany({
        where: { medicationId: { in: medicationIds } },
      }),
      prisma.bowelMovement.deleteMany({ where: { userId } }),
    ]);

    const total = symptoms.count + medLogs.count + bowelMovements.count;

    return NextResponse.json({
      success: true,
      deleted: total,
      message: `${symptoms.count} symptôme(s), ${medLogs.count} prise(s) de médicament et ${bowelMovements.count} selle(s) supprimés`,
    });
  } catch (error) {
    console.error("Error cleaning up:", error);
    return NextResponse.json(
      { error: "Erreur lors du nettoyage de la base de données" },
      { status: 500 }
    );
  }
}
