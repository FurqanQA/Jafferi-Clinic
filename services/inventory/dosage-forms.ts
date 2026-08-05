import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { DosageForm } from './inventory-types';
import { validateClinicIsolation, validateStockOperation } from './inventory-permissions';

// ============================================================================
// Dosage Forms
// Management of dosage form types (tablet, capsule, syrup, injection, etc.)
// This is a reference table with predefined values
// ============================================================================

/**
 * Get all dosage forms
 */
export async function getDosageForms(): Promise<DosageForm[]> {
  await validateStockOperation('read');

  try {
    // Return all enum values as dosage forms
    const forms: DosageForm[] = Object.values(DosageForm);
    
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
  await validateStockOperation('read');

  try {
    const forms = await getDosageForms();
    const form = forms.find(f => f === name as DosageForm) || null;
    
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
    return forms.includes(form as DosageForm);
  } catch (error) {
    logger.error('Failed to validate dosage form', { error, form });
    return false;
  }
}
