-- Schema SQL pour Turso
-- À exécuter avec : turso db shell care-assistant < prisma/schema.sql

CREATE TABLE IF NOT EXISTS Symptom (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  intensity INTEGER NOT NULL,
  notes TEXT,
  occurredAt DATETIME NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS Symptom_occurredAt_idx ON Symptom(occurredAt);
CREATE INDEX IF NOT EXISTS Symptom_name_idx ON Symptom(name);
