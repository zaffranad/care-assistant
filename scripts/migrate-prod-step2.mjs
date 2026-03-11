/**
 * Migration production - Etape 2
 * Rattache les donnees existantes au premier utilisateur trouve,
 * puis verifie qu'il ne reste aucune ligne orpheline.
 *
 * Usage:
 *   1. S'etre connecte au moins une fois avec Google sur l'app deployee
 *   2. Mettre DATABASE_URL et DATABASE_AUTH_TOKEN de Turso prod dans .env
 *   3. node scripts/migrate-prod-step2.mjs
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

// Recuperer le premier (et seul) utilisateur
const usersResult = await client.execute('SELECT "id", "email" FROM "User"');

if (usersResult.rows.length === 0) {
  console.error("ERREUR: Aucun utilisateur trouve dans la table User.");
  console.error("Connectez-vous d'abord a l'app avec votre compte Google.");
  process.exit(1);
}

const user = usersResult.rows[0];
console.log(`Utilisateur trouve: ${user.email} (id: ${user.id})\n`);

// Rattacher les donnees orphelines
const tables = ["Symptom", "Medication", "PredefinedSymptom"];

for (const table of tables) {
  const countBefore = await client.execute(
    `SELECT COUNT(*) as cnt FROM "${table}" WHERE "userId" IS NULL`
  );
  const orphans = countBefore.rows[0].cnt;

  if (orphans > 0) {
    await client.execute({
      sql: `UPDATE "${table}" SET "userId" = ? WHERE "userId" IS NULL`,
      args: [user.id],
    });
    console.log(`  ${table}: ${orphans} ligne(s) rattachee(s) a ${user.email}`);
  } else {
    console.log(`  ${table}: aucune ligne orpheline`);
  }
}

// Verification finale
console.log("\nVerification...");
let allGood = true;
for (const table of tables) {
  const check = await client.execute(
    `SELECT COUNT(*) as cnt FROM "${table}" WHERE "userId" IS NULL`
  );
  const remaining = check.rows[0].cnt;
  if (remaining > 0) {
    console.error(`  ERREUR: ${table} a encore ${remaining} ligne(s) sans userId`);
    allGood = false;
  } else {
    console.log(`  ${table}: OK (0 orphelins)`);
  }
}

if (allGood) {
  console.log("\nToutes les donnees sont rattachees.");
  console.log("\nProchaine etape:");
  console.log("  npx prisma db push");
  console.log("  (avec DATABASE_URL et DATABASE_AUTH_TOKEN de Turso dans .env)");
} else {
  console.error("\nDes lignes orphelines subsistent. Corrigez avant de continuer.");
  process.exit(1);
}
