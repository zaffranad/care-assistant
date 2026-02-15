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
