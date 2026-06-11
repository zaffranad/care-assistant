export interface SymptomFormData {
  name: string;
  intensity: number;
  notes?: string;
  occurredAt: string; // ISO string
}

export interface SymptomResponse {
  id: string;
  name: string;
  intensity: number;
  notes: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PredefinedSymptomResponse {
  id: string;
  name: string;
  createdAt: string;
}

export interface MedicationResponse {
  id: string;
  name: string;
  dosage: number;
  time: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationLogResponse {
  id: string;
  medicationId: string;
  medication?: MedicationResponse;
  takenAt: string;
  scheduledAt: string;
  deltaMinutes: number;
  date: string;
  createdAt: string;
}

export interface MedicationIntakeFormData {
  name: string;
  dosage: number; // mg
  notes?: string;
  takenAt: string; // ISO string
}

export interface MedicationIntakeResponse {
  id: string;
  name: string;
  dosage: number;
  notes: string | null;
  takenAt: string;
  createdAt: string;
}

// Suggestion d'autocomplétion pour la saisie d'une prise ponctuelle
export interface IntakeSuggestion {
  name: string;
  dosage: number; // dernier dosage connu en mg
}

export interface MissedMedicationEntry {
  medicationId: string;
  medication: MedicationResponse;
  date: string; // "YYYY-MM-DD"
  scheduledTime: string; // "HH:mm"
}

export interface BowelMovementFormData {
  bristolType: number;
  notes?: string;
  occurredAt: string; // ISO string
}

export interface BowelMovementResponse {
  id: string;
  bristolType: number;
  notes: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface SignificantEventFormData {
  text: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
}

export interface SignificantEventResponse {
  id: string;
  text: string;
  date: string;
  time: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExportData {
  version: 1;
  exportedAt: string;
  predefinedSymptoms: Omit<PredefinedSymptomResponse, "id">[];
  symptoms: Omit<SymptomResponse, "id" | "updatedAt">[];
  medications: (Omit<MedicationResponse, "id" | "updatedAt"> & {
    logs: Omit<MedicationLogResponse, "id" | "medicationId" | "medication">[];
  })[];
  bowelMovements?: Omit<BowelMovementResponse, "id">[];
  significantEvents?: Omit<SignificantEventResponse, "id" | "updatedAt">[];
  medicationIntakes?: Omit<MedicationIntakeResponse, "id">[];
}

export interface ExportMetrics {
  predefinedSymptoms: number;
  symptoms: number;
  medications: number;
  medicationLogs: number;
  bowelMovements: number;
  significantEvents: number;
  medicationIntakes: number;
}

export interface ImportResult {
  success: boolean;
  imported: ExportMetrics;
  message: string;
}
