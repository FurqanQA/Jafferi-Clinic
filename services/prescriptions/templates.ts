import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateManageTemplatePermission } from './prescription-permissions';
import { validateCreateTemplate, validateUpdateTemplate } from './prescription-validation';
import { PrescriptionTemplate, CreateTemplateInput, UpdateTemplateInput, Medicine } from './prescription-types';

/**
 * Predefined prescription templates for common conditions
 */
const PREDEFINED_TEMPLATES: Record<string, {
  name: string;
  description: string;
  category: string;
  medicines: Medicine[];
  instructions?: string;
  notes?: string;
}> = {
  hypertension: {
    name: 'Hypertension Treatment',
    description: 'Standard antihypertensive medication regimen',
    category: 'Cardiovascular',
    medicines: [
      {
        medicine_name: 'Amlodipine',
        generic_name: 'Amlodipine Besylate',
        brand_name: 'Norvasc',
        strength: '5mg',
        dosage_form: 'tablet',
        route: 'oral',
        dose: '5mg',
        frequency: 'daily',
        duration: '30 days',
        quantity: 30,
        instructions: 'Take once daily with or without food',
        morning: true,
      },
    ],
    instructions: 'Monitor blood pressure regularly',
    notes: 'Adjust dose based on BP response',
  },
  diabetes: {
    name: 'Type 2 Diabetes Management',
    description: 'Standard oral hypoglycemic regimen',
    category: 'Endocrine',
    medicines: [
      {
        medicine_name: 'Metformin',
        generic_name: 'Metformin Hydrochloride',
        brand_name: 'Glucophage',
        strength: '500mg',
        dosage_form: 'tablet',
        route: 'oral',
        dose: '500mg',
        frequency: 'twice_daily',
        duration: '30 days',
        quantity: 60,
        instructions: 'Take with meals to reduce GI side effects',
        after_food: true,
        morning: true,
        evening: true,
      },
    ],
    instructions: 'Monitor blood glucose levels regularly',
    notes: 'May need dose adjustment based on HbA1c',
  },
  fever: {
    name: 'Fever Management',
    description: 'Antipyretic and analgesic regimen',
    category: 'General',
    medicines: [
      {
        medicine_name: 'Paracetamol',
        generic_name: 'Acetaminophen',
        brand_name: 'Tylenol',
        strength: '500mg',
        dosage_form: 'tablet',
        route: 'oral',
        dose: '500mg',
        frequency: 'as_needed',
        duration: '7 days',
        quantity: 14,
        instructions: 'Take every 4-6 hours as needed for fever',
        as_needed: true,
      },
    ],
    instructions: 'Do not exceed 4g per day',
    notes: 'Seek medical attention if fever persists beyond 3 days',
  },
  common_cold: {
    name: 'Common Cold',
    description: 'Symptomatic relief for common cold',
    category: 'Respiratory',
    medicines: [
      {
        medicine_name: 'Cetirizine',
        generic_name: 'Cetirizine Hydrochloride',
        brand_name: 'Zyrtec',
        strength: '10mg',
        dosage_form: 'tablet',
        route: 'oral',
        dose: '10mg',
        frequency: 'daily',
        duration: '7 days',
        quantity: 7,
        instructions: 'Take once daily at bedtime',
        night: true,
      },
    ],
    instructions: 'Rest and stay hydrated',
    notes: 'Avoid in patients with severe renal impairment',
  },
  asthma: {
    name: 'Asthma Maintenance',
    description: 'Inhaled corticosteroid and bronchodilator',
    category: 'Respiratory',
    medicines: [
      {
        medicine_name: 'Fluticasone Propionate',
        generic_name: 'Fluticasone Propionate',
        brand_name: 'Flovent',
        strength: '125mcg',
        dosage_form: 'inhaler',
        route: 'inhalation',
        dose: '2 puffs',
        frequency: 'twice_daily',
        duration: '30 days',
        quantity: 1,
        instructions: 'Inhale 2 puffs twice daily',
        morning: true,
        evening: true,
      },
    ],
    instructions: 'Use spacer device if available',
    notes: 'Rinse mouth after use to prevent oral thrush',
  },
  dental_pain: {
    name: 'Dental Pain',
    description: 'Analgesic for dental pain management',
    category: 'Dental',
    medicines: [
      {
        medicine_name: 'Ibuprofen',
        generic_name: 'Ibuprofen',
        brand_name: 'Advil',
        strength: '400mg',
        dosage_form: 'tablet',
        route: 'oral',
        dose: '400mg',
        frequency: 'as_needed',
        duration: '5 days',
        quantity: 10,
        instructions: 'Take with food to reduce stomach upset',
        after_food: true,
        as_needed: true,
      },
    ],
    instructions: 'Take after meals',
    notes: 'Avoid in patients with active peptic ulcer',
  },
  routine_checkup: {
    name: 'Routine Checkup',
    description: 'Multivitamin supplement',
    category: 'General',
    medicines: [
      {
        medicine_name: 'Multivitamin',
        generic_name: 'Multivitamin with Minerals',
        brand_name: 'Centrum',
        strength: 'Tablet',
        dosage_form: 'tablet',
        route: 'oral',
        dose: '1 tablet',
        frequency: 'daily',
        duration: '30 days',
        quantity: 30,
        instructions: 'Take once daily with breakfast',
        morning: true,
        with_food: true,
      },
    ],
    instructions: 'Take with breakfast',
    notes: 'Maintain balanced diet',
  },
};

/**
 * Validate template ID
 */
function validateTemplateId(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error('Invalid template ID format');
  }
  return id;
}

/**
 * Validate template clinic access
 */
async function validateTemplateClinicAccess(templateId: string): Promise<void> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('prescription_templates')
    .select('clinic_id')
    .eq('id', templateId)
    .single();
  
  if (error || !data) {
    throw new Error('Prescription template not found');
  }
  
  if (data.clinic_id !== clinicId) {
    throw new Error('Access denied: Template belongs to another clinic');
  }
}

/**
 * Create a prescription template
 */
export async function createTemplate(input: CreateTemplateInput): Promise<PrescriptionTemplate> {
  await validateManageTemplatePermission();

  const validatedInput = validateCreateTemplate(input) as CreateTemplateInput;

  const clinicId = await getUserClinicId();
  const user = await getCurrentUser();

  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('prescription_templates')
      .insert({
        clinic_id: clinicId,
        name: validatedInput.name,
        description: validatedInput.description,
        category: validatedInput.category,
        medicines: validatedInput.medicines,
        instructions: validatedInput.instructions,
        notes: validatedInput.notes,
        created_by: user.id,
        updated_by: user.id,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create prescription template', { error, clinicId });
      throw new DatabaseError('Failed to create prescription template', { error });
    }

    logger.info('Prescription template created successfully', { templateId: data.id, clinicId });
    return data as PrescriptionTemplate;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating prescription template', { error, clinicId });
    throw new DatabaseError('Failed to create prescription template', { error });
  }
}

/**
 * Update a prescription template
 */
export async function updateTemplate(
  templateId: string,
  input: UpdateTemplateInput
): Promise<PrescriptionTemplate> {
  await validateManageTemplatePermission();

  const validatedTemplateId = validateTemplateId(templateId);
  await validateTemplateClinicAccess(validatedTemplateId);

  const validatedInput = validateUpdateTemplate(input) as UpdateTemplateInput;

  const user = await getCurrentUser();

  const supabase = getSupabaseClient();

  try {
    const updateData: Record<string, unknown> = {
      ...validatedInput,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('prescription_templates')
      .update(updateData)
      .eq('id', validatedTemplateId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update prescription template', { error, templateId: validatedTemplateId });
      throw new DatabaseError('Failed to update prescription template', { error });
    }

    if (!data) {
      throw new Error('Prescription template not found');
    }

    logger.info('Prescription template updated successfully', { templateId: validatedTemplateId });
    return data as PrescriptionTemplate;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error updating prescription template', { error, templateId: validatedTemplateId });
    throw new DatabaseError('Failed to update prescription template', { error });
  }
}

/**
 * Get a prescription template by ID
 */
export async function getTemplate(templateId: string): Promise<PrescriptionTemplate> {
  await validateManageTemplatePermission();

  const validatedTemplateId = validateTemplateId(templateId);
  await validateTemplateClinicAccess(validatedTemplateId);

  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('prescription_templates')
      .select('*')
      .eq('id', validatedTemplateId)
      .single();

    if (error) {
      logger.error('Failed to fetch prescription template', { error, templateId: validatedTemplateId });
      throw new DatabaseError('Failed to fetch prescription template', { error });
    }

    if (!data) {
      throw new Error('Prescription template not found');
    }

    return data as PrescriptionTemplate;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching prescription template', { error, templateId: validatedTemplateId });
    throw new DatabaseError('Failed to fetch prescription template', { error });
  }
}

/**
 * Get all prescription templates for the clinic
 */
export async function getTemplates(params?: {
  category?: string;
  is_active?: boolean;
}): Promise<PrescriptionTemplate[]> {
  await validateManageTemplatePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('prescription_templates')
      .select('*')
      .eq('clinic_id', clinicId);

    if (params?.category) {
      query = query.eq('category', params.category);
    }

    if (params?.is_active !== undefined) {
      query = query.eq('is_active', params.is_active);
    }

    const { data, error } = await query.order('name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch prescription templates', { error, clinicId });
      throw new DatabaseError('Failed to fetch prescription templates', { error });
    }

    return (data || []) as PrescriptionTemplate[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching prescription templates', { error, clinicId });
    throw new DatabaseError('Failed to fetch prescription templates', { error });
  }
}

/**
 * Get predefined templates
 */
export function getPredefinedTemplates(): Array<{
  key: string;
  name: string;
  description: string;
  category: string;
  medicines: Medicine[];
  instructions?: string;
  notes?: string;
}> {
  return Object.entries(PREDEFINED_TEMPLATES).map(([key, template]) => ({
    key,
    ...template,
  }));
}

/**
 * Get a predefined template by key
 */
export function getPredefinedTemplate(key: string): {
  name: string;
  description: string;
  category: string;
  medicines: Medicine[];
  instructions?: string;
  notes?: string;
} | null {
  return PREDEFINED_TEMPLATES[key] || null;
}

/**
 * Create a template from predefined template
 */
export async function createFromPredefinedTemplate(
  key: string,
  customizations?: Partial<CreateTemplateInput>
): Promise<PrescriptionTemplate> {
  const predefined = getPredefinedTemplate(key);
  
  if (!predefined) {
    throw new Error(`Predefined template '${key}' not found`);
  }

  const input: CreateTemplateInput = {
    name: predefined.name,
    description: predefined.description,
    category: predefined.category,
    medicines: predefined.medicines,
    instructions: predefined.instructions,
    notes: predefined.notes,
    ...customizations,
  };

  return createTemplate(input);
}

/**
 * Delete a prescription template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  await validateManageTemplatePermission();

  const validatedTemplateId = validateTemplateId(templateId);
  await validateTemplateClinicAccess(validatedTemplateId);

  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('prescription_templates')
      .delete()
      .eq('id', validatedTemplateId);

    if (error) {
      logger.error('Failed to delete prescription template', { error, templateId: validatedTemplateId });
      throw new DatabaseError('Failed to delete prescription template', { error });
    }

    logger.info('Prescription template deleted successfully', { templateId: validatedTemplateId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting prescription template', { error, templateId: validatedTemplateId });
    throw new DatabaseError('Failed to delete prescription template', { error });
  }
}
