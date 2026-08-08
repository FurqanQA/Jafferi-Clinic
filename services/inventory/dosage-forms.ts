import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';

// ============================================================================
// Dosage Forms
// Management of dosage form types (tablet, capsule, syrup, injection, etc.)
// This is a reference table with predefined values
// ============================================================================

interface DosageForm {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

/**
 * Get all dosage forms
 */
export async function getDosageForms(): Promise<DosageForm[]> {
  try {
    // Return predefined dosage forms
    const forms: DosageForm[] = [
      { id: 'DF-001', code: 'TAB', name: 'Tablet', description: 'Solid oral dosage form', isActive: true },
      { id: 'DF-002', code: 'CAP', name: 'Capsule', description: 'Encapsulated oral dosage form', isActive: true },
      { id: 'DF-003', code: 'SYR', name: 'Syrup', description: 'Liquid oral dosage form', isActive: true },
      { id: 'DF-004', code: 'INJ', name: 'Injection', description: 'Parenteral dosage form', isActive: true },
    ];
    
    logger.info('Dosage forms retrieved', { count: forms.length });
    return forms;
  } catch (error) {
    logger.error('Failed to get dosage forms', { error });
    throw error;
  }
}

/**
 * Get dosage form by name
 */
export async function getDosageForm(name: string): Promise<DosageForm | null> {
  try {
    const forms = await getDosageForms();
    const form = forms.find(f => f.name === name) || null;
    
    logger.info('Dosage form retrieved', { name });
    return form;
  } catch (error) {
    logger.error('Failed to get dosage form', { error, name });
    throw error;
  }
}

/**
 * Validate dosage form
 */
export async function validateDosageForm(form: string): Promise<boolean> {
  try {
    const forms = await getDosageForms();
    return forms.some(f => f.name === form);
  } catch (error) {
    logger.error('Failed to validate dosage form', { error, form });
    return false;
  }
}
