import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, "..", "prisma", "dev.db");
const sqlPath = resolve(__dirname, "..", "prisma", "init-local.sql");

console.log(`Initialisation de la base locale : ${dbPath}`);

const db = new Database(dbPath);
const sql = readFileSync(sqlPath, "utf-8");

db.exec(sql);
db.close();

console.log("Base de données locale initialisée avec succès !");
console.log("Vous pouvez lancer l'application avec : npm run dev");
