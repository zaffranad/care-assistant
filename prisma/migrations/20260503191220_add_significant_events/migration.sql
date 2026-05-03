-- CreateTable
CREATE TABLE "SignificantEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "SignificantEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SignificantEvent_date_idx" ON "SignificantEvent"("date");

-- CreateIndex
CREATE INDEX "SignificantEvent_userId_idx" ON "SignificantEvent"("userId");
