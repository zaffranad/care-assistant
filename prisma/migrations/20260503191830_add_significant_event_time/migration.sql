-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SignificantEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL DEFAULT '12:00',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "SignificantEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SignificantEvent" ("createdAt", "date", "id", "text", "updatedAt", "userId") SELECT "createdAt", "date", "id", "text", "updatedAt", "userId" FROM "SignificantEvent";
DROP TABLE "SignificantEvent";
ALTER TABLE "new_SignificantEvent" RENAME TO "SignificantEvent";
CREATE INDEX "SignificantEvent_date_idx" ON "SignificantEvent"("date");
CREATE INDEX "SignificantEvent_date_time_idx" ON "SignificantEvent"("date", "time");
CREATE INDEX "SignificantEvent_userId_idx" ON "SignificantEvent"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
