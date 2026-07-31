import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateTemplateId, validateCreateTemplate, validateUpdateTemplate } from './medical-record-validation';
import { validateManageTemplatePermission } from './medical-record-permissions';
import { MedicalRecordTemplate, CreateTemplateInput, UpdateTemplateInput } from './medical-record-types';

/**
 * Create a medical record template
 */
export async function createTemplate(input: CreateTemplateInput): Promise<MedicalRecordTemplate> {
  // Validate permissions
  await validateManageTemplatePermission();

  // Validate input
  const validatedInput = validateCreateTemplate(input) as CreateTemplateInput;

  // Get clinic ID and user
  const clinicId = await getUserClinicId();
  const user = await getCurrentUser();

  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('medical_record_templates')
      .insert({
        clinic_id: clinicId,
        name: validatedInput.name,
        description: validatedInput.description,
        visit_type: validatedInput.visit_type,
        department_id: validatedInput.department_id,
        template_data: validatedInput.template_data,
        created_by: user.id,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create medical record template', { error, clinicId });
      throw new DatabaseError('Failed to create medical record template', { error });
    }

    logger.info('Medical record template created successfully', { templateId: data.id, clinicId });
    return data as MedicalRecordTemplate;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating medical record template', { error, clinicId });
    throw new DatabaseError('Failed to create medical record template', { error });
  }
}

/**
 * Update a medical record template
 */
export async function updateTemplate(
  templateId: string,
  input: UpdateTemplateInput
): Promise<MedicalRecordTemplate> {
  // Validate permissions
  await validateManageTemplatePermission();

  // Validate template ID
  const validatedTemplateId = validateTemplateId(templateId);

  // Validate clinic access
  await validateTemplateClinicAccess(validatedTemplateId);

  // Validate input
  const validatedInput = validateUpdateTemplate(input) as UpdateTemplateInput;

  // Get user
  const user = await getCurrentUser();

  const supabase = getSupabaseClient();

  try {
    const updateData: Record<string, unknown> = {
      ...validatedInput,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('medical_record_templates')
      .update(updateData)
      .eq('id', validatedTemplateId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update medical record template', { error, templateId: validatedTemplateId });
      throw new DatabaseError('Failed to update medical record template', { error });
    }

    if (!data) {
      throw new NotFoundError('Medical record template not found');
    }

    logger.info('Medical record template updated successfully', { templateId: validatedTemplateId });
    return data as MedicalRecordTemplate;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating medical record template', { error, templateId: validatedTemplateId });
    throw new DatabaseError('Failed to update medical record template', { error });
  }
}

/**
 * Get a medical record template by ID
 */
export async function getTemplate(templateId: string): Promise<MedicalRecordTemplate> {
  // Validate permissions
  await validateManageTemplatePermission();

  // Validate template ID
  const validatedTemplateId = validateTemplateId(templateId);

  // Validate clinic access
  await validateTemplateClinicAccess(validatedTemplateId);

  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('medical_record_templates')
      .select('*')
      .eq('id', validatedTemplateId)
      .single();

    if (error) {
      logger.error('Failed to fetch medical record template', { error, templateId: validatedTemplateId });
      throw new DatabaseError('Failed to fetch medical record template', { error });
    }

    if (!data) {
      throw new NotFoundError('Medical record template not found');
    }

    return data as MedicalRecordTemplate;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching medical record template', { error, templateId: validatedTemplateId });
    throw new DatabaseError('Failed to fetch medical record template', { error });
  }
}

/**
 * Get all medical record templates for the clinic
 */
export async function getTemplates(params?: {
  visit_type?: string;
  department_id?: string;
  is_active?: boolean;
}): Promise<MedicalRecordTemplate[]> {
  // Validate permissions
  await validateManageTemplatePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('medical_record_templates')
      .select('*')
      .eq('clinic_id', clinicId);

    if (params?.visit_type) {
      query = query.eq('visit_type', params.visit_type);
    }

    if (params?.department_id) {
      query = query.eq('department_id', params.department_id);
    }

    if (params?.is_active !== undefined) {
      query = query.eq('is_active', params.is_active);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch medical record templates', { error, clinicId });
      throw new DatabaseError('Failed to fetch medical record templates', { error });
    }

    return (data || []) as MedicalRecordTemplate[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching medical record templates', { error, clinicId });
    throw new DatabaseError('Failed to fetch medical record templates', { error });
  }
}

/**
 * Delete a medical record template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  // Validate permissions
  await validateManageTemplatePermission();

  // Validate template ID
  const validatedTemplateId = validateTemplateId(templateId);

  // Validate clinic access
  await validateTemplateClinicAccess(validatedTemplateId);

  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('medical_record_templates')
      .delete()
      .eq('id', validatedTemplateId);

    if (error) {
      logger.error('Failed to delete medical record template', { error, templateId: validatedTemplateId });
      throw new DatabaseError('Failed to delete medical record template', { error });
    }

    logger.info('Medical record template deleted successfully', { templateId: validatedTemplateId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting medical record template', { error, templateId: validatedTemplateId });
    throw new DatabaseError('Failed to delete medical record template', { error });
  }
}

/**
 * Validate template clinic access
 */
export async function validateTemplateClinicAccess(templateId: string): Promise<void> {
  const { getUserClinicId } = await import('../core/auth');
  const { getSupabaseClient } = await import('../core/client');
  
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('medical_record_templates')
    .select('clinic_id')
    .eq('id', templateId)
    .single();
  
  if (error || !data) {
    throw new Error('Medical record template not found');
  }
  
  if (data.clinic_id !== clinicId) {
    throw new Error('Access denied: Template belongs to another clinic');
  }
}
