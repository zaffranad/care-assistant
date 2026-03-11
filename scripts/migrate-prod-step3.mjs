/**
 * Migration production - Etape 3
 * Finalise le schema : rend userId NOT NULL et ajoute les index/FK manquants.
 * SQLite ne supporte pas ALTER COLUMN, donc on recree les tables.
 *
 * Usage:
 *   1. Avoir execute step1 et step2 avec succes
 *   2. Mettre DATABASE_URL et DATABASE_AUTH_TOKEN de Turso prod dans .env
 *   3. node scripts/migrate-prod-step3.mjs
 */
import { createClient } from "@libsql/client";
import "dotenv/config";

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url || url.startsWith("file:")) {
  console.error("ERREUR: DATABASE_URL doit pointer sur votre base Turso de production.");
  process.exit(1);
}

const client = createClient({ url, authToken });

// Verifier qu'il n'y a pas d'orphelins avant de continuer
const tables = ["Symptom", "Medication", "PredefinedSymptom"];
for (const table of tables) {
  const check = await client.execute(
    `SELECT COUNT(*) as cnt FROM "${table}" WHERE "userId" IS NULL`
  );
  if (check.rows[0].cnt > 0) {
    console.error(`ERREUR: ${table} a encore ${check.rows[0].cnt} ligne(s) sans userId.`);
    console.error("Executez d'abord: node scripts/migrate-prod-step2.mjs");
    process.exit(1);
  }
}

console.log(`Connexion a Turso: ${url}`);
console.log("Finalisation du schema (NOT NULL + index + FK)...\n");

const migrations = [
  // --- Symptom: recreer avec userId NOT NULL ---
  `CREATE TABLE "Symptom_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "intensity" INTEGER NOT NULL,
    "notes" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Symptom_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
  )`,
  `INSERT INTO "Symptom_new" SELECT "id","name","intensity","notes","occurredAt","createdAt","updatedAt","userId" FROM "Symptom"`,
  `DROP TABLE "Symptom"`,
  `ALTER TABLE "Symptom_new" RENAME TO "Symptom"`,
  `CREATE INDEX "Symptom_occurredAt_idx" ON "Symptom"("occurredAt")`,
  `CREATE INDEX "Symptom_name_idx" ON "Symptom"("name")`,
  `CREATE INDEX "Symptom_userId_idx" ON "Symptom"("userId")`,

  // --- PredefinedSymptom: recreer avec userId NOT NULL + unique(name, userId) ---
  `CREATE TABLE "PredefinedSymptom_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "PredefinedSymptom_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
  )`,
  `INSERT INTO "PredefinedSymptom_new" SELECT "id","name","createdAt","userId" FROM "PredefinedSymptom"`,
  `DROP TABLE "PredefinedSymptom"`,
  `ALTER TABLE "PredefinedSymptom_new" RENAME TO "PredefinedSymptom"`,
  `CREATE UNIQUE INDEX "PredefinedSymptom_name_userId_key" ON "PredefinedSymptom"("name", "userId")`,
  `CREATE INDEX "PredefinedSymptom_userId_idx" ON "PredefinedSymptom"("userId")`,

  // --- Medication: recreer avec userId NOT NULL ---
  `CREATE TABLE "Medication_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "dosage" INTEGER NOT NULL,
    "time" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Medication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
  )`,
  `INSERT INTO "Medication_new" SELECT "id","name","dosage","time","active","createdAt","updatedAt","userId" FROM "Medication"`,
  // MedicationLog a une FK vers Medication, il faut la gerer
  `CREATE TABLE "MedicationLog_backup" AS SELECT * FROM "MedicationLog"`,
  `DROP TABLE "MedicationLog"`,
  `DROP TABLE "Medication"`,
  `ALTER TABLE "Medication_new" RENAME TO "Medication"`,
  `CREATE INDEX "Medication_userId_idx" ON "Medication"("userId")`,

  // --- MedicationLog: recreer avec FK vers la nouvelle table Medication ---
  `CREATE TABLE "MedicationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "medicationId" TEXT NOT NULL,
    "takenAt" DATETIME NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "deltaMinutes" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MedicationLog_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication" ("id") ON DELETE CASCADE
  )`,
  `INSERT INTO "MedicationLog" SELECT "id","medicationId","takenAt","scheduledAt","deltaMinutes","date","createdAt" FROM "MedicationLog_backup"`,
  `DROP TABLE "MedicationLog_backup"`,
  `CREATE UNIQUE INDEX "MedicationLog_medicationId_date_key" ON "MedicationLog"("medicationId", "date")`,
  `CREATE INDEX "MedicationLog_date_idx" ON "MedicationLog"("date")`,
  `CREATE INDEX "MedicationLog_medicationId_idx" ON "MedicationLog"("medicationId")`,
];

let success = 0;
for (const sql of migrations) {
  const label = sql.substring(0, 70).replace(/\n/g, " ") + "...";
  try {
    await client.execute(sql);
    console.log(`  OK: ${label}`);
    success++;
  } catch (err) {
    console.error(`  ERREUR: ${label}`);
    console.error(`    ${err.message}`);
    process.exit(1);
  }
}

// Verification finale
console.log("\nVerification des donnees...");
for (const table of tables) {
  const count = await client.execute(`SELECT COUNT(*) as cnt FROM "${table}"`);
  console.log(`  ${table}: ${count.rows[0].cnt} ligne(s)`);
}
const logCount = await client.execute(`SELECT COUNT(*) as cnt FROM "MedicationLog"`);
console.log(`  MedicationLog: ${logCount.rows[0].cnt} ligne(s)`);

console.log(`\nTermine: ${success} operations reussies.`);
console.log("Le schema est maintenant complet (userId NOT NULL + index + FK).");
console.log("\nN'oubliez pas de remettre DATABASE_URL='file:./dev.db' dans .env pour le dev local.");
