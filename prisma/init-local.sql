-- Initialisation de la base SQLite locale pour le développement

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

CREATE TABLE IF NOT EXISTS PredefinedSymptom (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

-- Données de départ
INSERT OR IGNORE INTO PredefinedSymptom (id, name, createdAt) VALUES
  ('preset_migraine', 'Migraine', CURRENT_TIMESTAMP),
  ('preset_diarrhee', 'Diarrhée', CURRENT_TIMESTAMP);
