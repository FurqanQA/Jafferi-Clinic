import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { AllergyInfo } from './prescription-types';

/**
 * Get patient allergies
 */
export async function getPatientAllergies(patientId: string): Promise<AllergyInfo[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('patient_allergies')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('patient_id', patientId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch patient allergies', { error, patientId });
      throw new DatabaseError('Failed to fetch patient allergies', { error });
    }

    return (data || []) as AllergyInfo[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching patient allergies', { error, patientId });
    throw new DatabaseError('Failed to fetch patient allergies', { error });
  }
}

/**
 * Add patient allergy
 */
export async function addPatientAllergy(allergy: {
  patient_id: string;
  allergen: string;
  allergy_type: 'drug' | 'food' | 'environmental' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  reaction: string;
  onset_date?: string;
}): Promise<AllergyInfo> {
  const clinicId = await getUserClinicId();
  const { getCurrentUser } = await import('../core/auth');
  const user = await getCurrentUser();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('patient_allergies')
      .insert({
        clinic_id: clinicId,
        ...allergy,
        is_active: true,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to add patient allergy', { error, allergy });
      throw new DatabaseError('Failed to add patient allergy', { error });
    }

    logger.info('Patient allergy added successfully', { allergyId: data.id });
    return data as AllergyInfo;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error adding patient allergy', { error, allergy });
    throw new DatabaseError('Failed to add patient allergy', { error });
  }
}

/**
 * Update patient allergy
 */
export async function updatePatientAllergy(
  allergyId: string,
  updates: Partial<AllergyInfo>
): Promise<AllergyInfo> {
  const clinicId = await getUserClinicId();
  const { getCurrentUser } = await import('../core/auth');
  const user = await getCurrentUser();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('patient_allergies')
      .update({
        ...updates,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', allergyId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update patient allergy', { error, allergyId });
      throw new DatabaseError('Failed to update patient allergy', { error });
    }

    logger.info('Patient allergy updated successfully', { allergyId });
    return data as AllergyInfo;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error updating patient allergy', { error, allergyId });
    throw new DatabaseError('Failed to update patient allergy', { error });
  }
}

/**
 * Deactivate patient allergy
 */
export async function deactivatePatientAllergy(allergyId: string): Promise<void> {
  const clinicId = await getUserClinicId();
  const { getCurrentUser } = await import('../core/auth');
  const user = await getCurrentUser();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('patient_allergies')
      .update({
        is_active: false,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', allergyId)
      .eq('clinic_id', clinicId);

    if (error) {
      logger.error('Failed to deactivate patient allergy', { error, allergyId });
      throw new DatabaseError('Failed to deactivate patient allergy', { error });
    }

    logger.info('Patient allergy deactivated successfully', { allergyId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deactivating patient allergy', { error, allergyId });
    throw new DatabaseError('Failed to deactivate patient allergy', { error });
  }
}

/**
 * Validate medications against patient allergies
 */
export async function validateMedicationAllergies(
  medicines: string[],
  patientId: string
): Promise<{
  hasAllergies: boolean;
  warnings: Array<{
    medicine: string;
    allergen: string;
    severity: string;
    reaction: string;
  }>;
}> {
  const patientAllergies = await getPatientAllergies(patientId);
  const warnings: Array<{
    medicine: string;
    allergen: string;
    severity: string;
    reaction: string;
  }> = [];

  for (const medicine of medicines) {
    for (const allergy of patientAllergies) {
      if (isAllergyMatch(medicine, allergy.allergen)) {
        warnings.push({
          medicine,
          allergen: allergy.allergen,
          severity: allergy.severity,
          reaction: allergy.reaction,
        });
      }
    }
  }

  return {
    hasAllergies: warnings.length > 0,
    warnings,
  };
}

/**
 * Check if medicine matches allergy
 */
function isAllergyMatch(medicine: string, allergen: string): boolean {
  const medicineLower = medicine.toLowerCase();
  const allergenLower = allergen.toLowerCase();

  // Direct match
  if (medicineLower.includes(allergenLower) || allergenLower.includes(medicineLower)) {
    return true;
  }

  // Check for common drug class or ingredient matches
  const allergyMappings: Record<string, string[]> = {
    penicillin: ['amoxicillin', 'ampicillin', 'penicillin', 'amoxicillin-clavulanate', 'oxacillin', 'nafcillin'],
    cephalosporin: ['cephalexin', 'cefuroxime', 'ceftriaxone', 'cefdinir', 'cefazolin'],
    sulfa: ['sulfamethoxazole', 'sulfadiazine', 'sulfasalazine', 'sulfamethizole'],
    aspirin: ['aspirin', 'acetylsalicylic acid', 'salicylate'],
    nsaids: ['ibuprofen', 'naproxen', 'diclofenac', 'celecoxib', 'indomethacin', 'ketorolac'],
    codeine: ['codeine', 'hydrocodone', 'oxycodone', 'morphine'],
    sulfonylurea: ['glipizide', 'glyburide', 'glimepiride'],
    statins: ['atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin'],
  };

  for (const [key, variants] of Object.entries(allergyMappings)) {
    if (allergenLower.includes(key) && variants.some(v => medicineLower.includes(v))) {
      return true;
    }
  }

  return false;
}

/**
 * Check for contraindications
 */
export async function checkContraindications(
  medicines: string[],
  patientConditions: string[]
): Promise<Array<{
  medicine: string;
  condition: string;
  severity: 'moderate' | 'high' | 'critical';
  recommendation: string;
}>> {
  const contraindications: Array<{
    medicine: string;
    condition: string;
    severity: 'moderate' | 'high' | 'critical';
    recommendation: string;
  }> = [];

  // Placeholder logic - replace with actual contraindication database
  const contraindicationRules: Record<string, { conditions: string[]; severity: 'moderate' | 'high' | 'critical'; recommendation: string }> = {
    warfarin: {
      conditions: ['pregnancy', 'bleeding disorder', 'severe hypertension'],
      severity: 'critical',
      recommendation: 'Avoid use in pregnancy and bleeding disorders',
    },
    nsaids: {
      conditions: ['peptic ulcer', 'gi bleeding', 'renal failure', 'pregnancy'],
      severity: 'high',
      recommendation: 'Avoid in GI bleeding and renal impairment',
    },
    ace_inhibitors: {
      conditions: ['pregnancy', 'angioedema', 'bilateral renal artery stenosis'],
      severity: 'critical',
      recommendation: 'Contraindicated in pregnancy',
    },
    beta_blockers: {
      conditions: ['asthma', 'copd', 'heart block'],
      severity: 'moderate',
      recommendation: 'Use with caution in respiratory conditions',
    },
    metformin: {
      conditions: ['renal failure', 'metabolic acidosis'],
      severity: 'high',
      recommendation: 'Avoid in severe renal impairment',
    },
  };

  for (const medicine of medicines) {
    const medicineLower = medicine.toLowerCase();
    for (const [drugKey, rule] of Object.entries(contraindicationRules)) {
      if (medicineLower.includes(drugKey)) {
        for (const condition of patientConditions) {
          const conditionLower = condition.toLowerCase();
          for (const contraindicatedCondition of rule.conditions) {
            if (conditionLower.includes(contraindicatedCondition) ||
                contraindicatedCondition.includes(conditionLower)) {
              contraindications.push({
                medicine,
                condition,
                severity: rule.severity,
                recommendation: rule.recommendation,
              });
            }
          }
        }
      }
    }
  }

  return contraindications;
}

/**
 * Generate allergy warning message
 */
export function generateAllergyWarning(warnings: Array<{
  medicine: string;
  allergen: string;
  severity: string;
  reaction: string;
}>): string {
  if (warnings.length === 0) {
    return 'No allergy conflicts detected';
  }

  const lines: string[] = [];
  lines.push(`⚠️ ALLERGY WARNING: ${warnings.length} conflict(s) detected`);

  warnings.forEach(w => {
    const severityIcon = w.severity === 'life_threatening' || w.severity === 'severe' ? '🔴' : '🟡';
    lines.push(`${severityIcon} ${w.medicine} - Patient allergic to ${w.allergen}`);
    lines.push(`   Reaction: ${w.reaction}`);
    lines.push(`   Severity: ${w.severity}`);
  });

  return lines.join('\n');
}

/**
 * Generate contraindication warning message
 */
export function generateContraindicationWarning(contraindications: Array<{
  medicine: string;
  condition: string;
  severity: 'moderate' | 'high' | 'critical';
  recommendation: string;
}>): string {
  if (contraindications.length === 0) {
    return 'No contraindications detected';
  }

  const lines: string[] = [];
  lines.push(`⚠️ CONTRAINDICATION WARNING: ${contraindications.length} issue(s) detected`);

  contraindications.forEach(c => {
    const severityIcon = c.severity === 'critical' ? '🔴' : c.severity === 'high' ? '🟠' : '🟡';
    lines.push(`${severityIcon} ${c.medicine} - Contraindicated for ${c.condition}`);
    lines.push(`   Severity: ${c.severity}`);
    lines.push(`   Recommendation: ${c.recommendation}`);
  });

  return lines.join('\n');
}
