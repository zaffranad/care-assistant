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
