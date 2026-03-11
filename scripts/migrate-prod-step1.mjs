/**
 * Migration production - Etape 1
 * Cree les tables Auth.js et ajoute userId (nullable) sur les tables metier.
 *
 * Usage:
 *   1. Mettre DATABASE_URL et DATABASE_AUTH_TOKEN de Turso prod dans .env
 *   2. node scripts/migrate-prod-step1.mjs
 *   3. Remettre DATABASE_URL="file:./dev.db" dans .env apres
 */
import { createClient } from "@libsql/client";
import "dotenv/config";

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url || url.startsWith("file:")) {
  console.error("ERREUR: DATABASE_URL doit pointer sur votre base Turso de production.");
  console.error("Valeur actuelle:", url);
  console.error("Mettez la valeur libsql://... de Turso dans .env avant de relancer.");
  process.exit(1);
}

const client = createClient({ url, authToken });

const statements = [
  // --- Tables Auth.js ---
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,

  `CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId")`,

  `CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken")`,

  `CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token")`,

  // --- Ajouter userId nullable sur les tables metier ---
  `ALTER TABLE "Symptom" ADD COLUMN "userId" TEXT`,
  `ALTER TABLE "Medication" ADD COLUMN "userId" TEXT`,
  `ALTER TABLE "PredefinedSymptom" ADD COLUMN "userId" TEXT`,
];

console.log(`Connexion a Turso: ${url}`);
console.log("Execution de la migration etape 1...\n");

let success = 0;
let skipped = 0;

for (const sql of statements) {
  const label = sql.substring(0, 60).replace(/\n/g, " ") + "...";
  try {
    await client.execute(sql);
    console.log(`  OK: ${label}`);
    success++;
  } catch (err) {
    if (err.message?.includes("duplicate column") || err.message?.includes("already exists")) {
      console.log(`  SKIP (deja fait): ${label}`);
      skipped++;
    } else {
      console.error(`  ERREUR: ${label}`);
      console.error(`    ${err.message}`);
      process.exit(1);
    }
  }
}

console.log(`\nTermine: ${success} operations reussies, ${skipped} deja appliquees.`);
console.log("\nProchaine etape:");
console.log("  1. Deployer l'app et se connecter avec Google");
console.log("  2. Puis lancer: node scripts/migrate-prod-step2.mjs");
