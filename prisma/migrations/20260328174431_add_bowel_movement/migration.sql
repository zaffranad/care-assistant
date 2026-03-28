-- CreateTable
CREATE TABLE "BowelMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bristolType" INTEGER NOT NULL,
    "notes" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "BowelMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "BowelMovement_occurredAt_idx" ON "BowelMovement"("occurredAt");

-- CreateIndex
CREATE INDEX "BowelMovement_userId_idx" ON "BowelMovement"("userId");
