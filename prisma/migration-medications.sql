-- Migration : ajout des tables Medication et MedicationLog
-- À exécuter avec : turso db shell care-assistant < prisma/migration-medications.sql

CREATE TABLE IF NOT EXISTS Medication (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  dosage INTEGER NOT NULL,
  time TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS MedicationLog (
  id TEXT PRIMARY KEY NOT NULL,
  medicationId TEXT NOT NULL,
  takenAt DATETIME NOT NULL,
  scheduledAt DATETIME NOT NULL,
  deltaMinutes INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicationId) REFERENCES Medication(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS MedicationLog_medicationId_date_key ON MedicationLog(medicationId, date);
CREATE INDEX IF NOT EXISTS MedicationLog_date_idx ON MedicationLog(date);
CREATE INDEX IF NOT EXISTS MedicationLog_medicationId_idx ON MedicationLog(medicationId);
