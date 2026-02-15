-- Migration : ajout de la table PredefinedSymptom
-- À exécuter avec : turso db shell care-assistant < prisma/migration-predefined-symptoms.sql

CREATE TABLE IF NOT EXISTS PredefinedSymptom (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL UNIQUE,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insérer les symptômes prédéfinis par défaut
INSERT OR IGNORE INTO PredefinedSymptom (id, name, createdAt) VALUES
  ('preset_migraine', 'Migraine', CURRENT_TIMESTAMP),
  ('preset_diarrhee', 'Diarrhée', CURRENT_TIMESTAMP);
