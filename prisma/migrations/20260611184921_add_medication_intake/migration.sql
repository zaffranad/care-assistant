-- CreateTable
CREATE TABLE "MedicationIntake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "dosage" INTEGER NOT NULL,
    "notes" TEXT,
    "takenAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "MedicationIntake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MedicationIntake_takenAt_idx" ON "MedicationIntake"("takenAt");

-- CreateIndex
CREATE INDEX "MedicationIntake_userId_idx" ON "MedicationIntake"("userId");
