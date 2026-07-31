import { Diagnosis } from './medical-record-types';

/**
 * Format diagnosis for display
 * Returns a formatted string representation of diagnosis
 */
export function formatDiagnosis(diagnosis: Diagnosis): string {
  const parts: string[] = [];

  if (diagnosis.primary_diagnosis) {
    parts.push(`Primary: ${diagnosis.primary_diagnosis}`);
  }

  if (diagnosis.icd_10_code) {
    parts.push(`ICD-10: ${diagnosis.icd_10_code}`);
  }

  if (diagnosis.snomed_code) {
    parts.push(`SNOMED: ${diagnosis.snomed_code}`);
  }

  if (diagnosis.status) {
    parts.push(`Status: ${diagnosis.status}`);
  }

  if (diagnosis.secondary_diagnoses && diagnosis.secondary_diagnoses.length > 0) {
    parts.push(`Secondary: ${diagnosis.secondary_diagnoses.join(', ')}`);
  }

  if (diagnosis.differential_diagnosis && diagnosis.differential_diagnosis.length > 0) {
    parts.push(`Differential: ${diagnosis.differential_diagnosis.join(', ')}`);
  }

  if (diagnosis.clinical_impression) {
    parts.push(`Clinical Impression: ${diagnosis.clinical_impression}`);
  }

  return parts.join('\n');
}

/**
 * Validate diagnosis data
 * Checks if diagnosis has required fields
 */
export function validateDiagnosis(diagnosis: Diagnosis): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!diagnosis.primary_diagnosis && !diagnosis.clinical_impression) {
    errors.push('Either primary diagnosis or clinical impression is required');
  }

  if (diagnosis.icd_10_code && !/^[A-Z]\d{2}(\.\d{1,4})?$/.test(diagnosis.icd_10_code)) {
    errors.push('Invalid ICD-10 code format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Merge diagnosis data
 * Combines two diagnosis objects, preferring non-empty values
 */
export function mergeDiagnosis(base: Diagnosis, override: Partial<Diagnosis>): Diagnosis {
  return {
    primary_diagnosis: override.primary_diagnosis || base.primary_diagnosis,
    secondary_diagnoses: override.secondary_diagnoses || base.secondary_diagnoses,
    differential_diagnosis: override.differential_diagnosis || base.differential_diagnosis,
    clinical_impression: override.clinical_impression || base.clinical_impression,
    icd_10_code: override.icd_10_code || base.icd_10_code,
    snomed_code: override.snomed_code || base.snomed_code,
    status: override.status || base.status,
  };
}

/**
 * Placeholder for AI diagnosis suggestions
 * This function is prepared for future AI integration
 */
export async function generateAIDiagnosisSuggestions(
  clinicalData: {
    chiefComplaint?: string;
    symptoms?: string[];
    vitals?: Record<string, unknown>;
    history?: string;
  }
): Promise<string[]> {
  // TODO: Integrate with AI service for diagnosis suggestions
  // This is a placeholder for future AI integration
  return [
    '[AI Generated] Diagnosis suggestion 1',
    '[AI Generated] Diagnosis suggestion 2',
    '[AI Generated] Diagnosis suggestion 3',
  ];
}

/**
 * Placeholder for AI ICD code suggestions
 * This function is prepared for future AI integration
 */
export async function generateAICDCodeSuggestions(
  diagnosisText: string
): Promise<string[]> {
  // TODO: Integrate with AI service for ICD code suggestions
  // This is a placeholder for future AI integration
  return [
    '[AI Generated] ICD-10 code suggestion 1',
    '[AI Generated] ICD-10 code suggestion 2',
  ];
}

/**
 * Placeholder for AI clinical decision support
 * This function is prepared for future AI integration
 */
export async function generateAIClinicalDecisionSupport(
  diagnosis: Diagnosis,
  patientData: Record<string, unknown>
): Promise<string> {
  // TODO: Integrate with AI service for clinical decision support
  // This is a placeholder for future AI integration
  return '[AI Generated] Clinical decision support recommendations';
}

/**
 * Check for medication interactions
 * This function is prepared for future integration with pharmacy systems
 */
export async function checkMedicationInteractions(
  medications: string[]
): Promise<string[]> {
  // TODO: Integrate with pharmacy/medication API for interaction checking
  // This is a placeholder for future integration
  return [];
}

/**
 * Get diagnosis severity based on status
 */
export function getDiagnosisSeverity(status: string): 'low' | 'medium' | 'high' {
  switch (status) {
    case 'acute':
    case 'critical':
      return 'high';
    case 'chronic':
      return 'medium';
    case 'resolved':
      return 'low';
    default:
      return 'medium';
  }
}
