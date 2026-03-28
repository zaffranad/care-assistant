/**
 * Migration production - Etape 4
 * Ajoute la table BowelMovement (selles / échelle de Bristol).
 *
 * Prérequis : `turso auth login` ne suffit pas pour ce script.
 * Il faut dans .env :
 *   - DATABASE_URL = URL libsql://... de la base (turso db show <nom> --url)
 *   - DATABASE_AUTH_TOKEN = jeton d'accès à la base (turso db tokens create <nom>)
 *
 * Usage:
 *   1. Remplir DATABASE_URL et DATABASE_AUTH_TOKEN Turso prod dans .env
 *   2. node scripts/migrate-prod-step4.mjs
 *   3. Remettre DATABASE_URL=file:./prisma/dev.db (ou équivalent) pour le dev local
 */
import { createClient } from "@libsql/client";
import "dotenv/config";

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url || url.startsWith("file:")) {
  console.error("ERREUR: DATABASE_URL doit pointer sur votre base Turso de production.");
  console.error("Valeur actuelle:", url ?? "(vide)");
  console.error(
    "Obtenir l'URL : turso db show <nom-de-la-base> --url"
  );
  process.exit(1);
}

const client = createClient({ url, authToken });

const migrations = [
  `CREATE TABLE "BowelMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bristolType" INTEGER NOT NULL,
    "notes" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "BowelMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE INDEX "BowelMovement_occurredAt_idx" ON "BowelMovement"("occurredAt")`,
  `CREATE INDEX "BowelMovement_userId_idx" ON "BowelMovement"("userId")`,
];

console.log(`Connexion à Turso: ${url}\n`);

const existing = await client.execute(
  `SELECT name FROM sqlite_master WHERE type='table' AND name='BowelMovement'`
);
if (existing.rows.length > 0) {
  console.log('La table "BowelMovement" existe déjà. Rien à faire.');
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

console.log(`\nTerminé : ${n} opération(s). La table BowelMovement est créée.`);
console.log("N'oubliez pas de remettre DATABASE_URL locale dans .env pour le dev.");
