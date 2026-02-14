-- CreateTable
CREATE TABLE "Symptom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "intensity" INTEGER NOT NULL,
    "notes" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Symptom_occurredAt_idx" ON "Symptom"("occurredAt");

-- CreateIndex
CREATE INDEX "Symptom_name_idx" ON "Symptom"("name");
