/**
 * Migration production - Étape 6
 * Ajoute la table MedicationIntake (prises ponctuelles de médicaments).
 *
 * Prérequis :
 *   - DATABASE_URL  = URL libsql://... de la base (turso db show <nom> --url)
 *   - DATABASE_AUTH_TOKEN = jeton d'accès (turso db tokens create <nom>)
 *
 * Usage :
 *   1. Remplir DATABASE_URL et DATABASE_AUTH_TOKEN Turso prod dans .env
 *   2. node scripts/migrate-prod-step6.mjs
 *   3. Remettre DATABASE_URL=file:./prisma/dev.db pour le dev local
 */
import { createClient } from "@libsql/client";
import "dotenv/config";

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url || url.startsWith("file:")) {
  console.error("ERREUR: DATABASE_URL doit pointer sur votre base Turso de production.");
  console.error("Valeur actuelle:", url ?? "(vide)");
  console.error("Obtenir l'URL : turso db show <nom-de-la-base> --url");
  process.exit(1);
}

const client = createClient({ url, authToken });

const migrations = [
  `CREATE TABLE "MedicationIntake" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "dosage" INTEGER NOT NULL,
    "notes" TEXT,
    "takenAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "MedicationIntake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX "MedicationIntake_takenAt_idx" ON "MedicationIntake"("takenAt")`,
  `CREATE INDEX "MedicationIntake_userId_idx" ON "MedicationIntake"("userId")`,
];

console.log(`Connexion à Turso: ${url}\n`);

const existing = await client.execute(
  `SELECT name FROM sqlite_master WHERE type='table' AND name='MedicationIntake'`
);
if (existing.rows.length > 0) {
  console.log('La table "MedicationIntake" existe déjà. Rien à faire.');
  process.exit(0);
}

let n = 0;
for (const sql of migrations) {
  const label = sql.split("\n")[0].substring(0, 72);
  try {
    await client.execute(sql);
    console.log(`  OK: ${label}...`);
    n++;
  } catch (err) {
    console.error(`  ERREUR: ${label}...`);
    console.error(`    ${err.message}`);
    process.exit(1);
  }
}

console.log(`\nTerminé : ${n} opération(s). La table MedicationIntake est créée.`);
console.log("N'oubliez pas de remettre DATABASE_URL locale dans .env pour le dev.");
