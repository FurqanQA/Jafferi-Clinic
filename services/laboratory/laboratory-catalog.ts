import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateManageTemplatePermission } from './laboratory-permissions';
import { createLabCatalogSchema } from './laboratory-validation';
import { LabCatalogEntry, LabCategory, SpecimenType } from './laboratory-types';

/**
 * Search laboratory tests by query
 */
export async function searchLabTests(query: string): Promise<LabCatalogEntry[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_catalog')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .or(`test_name.ilike.%${query}%,test_code.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_active', true)
      .order('test_name', { ascending: true });

    if (error) {
      logger.error('Failed to search laboratory tests', { error, query });
      throw new DatabaseError('Failed to search laboratory tests', { error });
    }

    return (data || []) as LabCatalogEntry[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error searching laboratory tests', { error, query });
    throw new DatabaseError('Failed to search laboratory tests', { error });
  }
}

/**
 * Get laboratory test by ID
 */
export async function getLabTestById(testId: string): Promise<LabCatalogEntry> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_catalog')
      .select('*')
      .eq('id', testId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Failed to fetch laboratory test', { error, testId });
      throw new DatabaseError('Failed to fetch laboratory test', { error });
    }

    if (!data) {
      throw new NotFoundError('Laboratory test not found');
    }

    return data as LabCatalogEntry;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching laboratory test', { error, testId });
    throw new DatabaseError('Failed to fetch laboratory test', { error });
  }
}

/**
 * Get laboratory tests by category
 */
export async function getLabTestsByCategory(category: LabCategory): Promise<LabCatalogEntry[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_catalog')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('category', category)
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('test_name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch laboratory tests by category', { error, category });
      throw new DatabaseError('Failed to fetch laboratory tests by category', { error });
    }

    return (data || []) as LabCatalogEntry[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching laboratory tests by category', { error, category });
    throw new DatabaseError('Failed to fetch laboratory tests by category', { error });
  }
}

/**
 * Get laboratory tests by department
 */
export async function getLabTestsByDepartment(department: string): Promise<LabCatalogEntry[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_catalog')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('department', department)
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('test_name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch laboratory tests by department', { error, department });
      throw new DatabaseError('Failed to fetch laboratory tests by department', { error });
    }

    return (data || []) as LabCatalogEntry[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching laboratory tests by department', { error, department });
    throw new DatabaseError('Failed to fetch laboratory tests by department', { error });
  }
}

/**
 * Get all laboratory categories
 */
export async function getLabCategories(): Promise<LabCategory[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_catalog')
      .select('category')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .eq('is_active', true);

    if (error) {
      logger.error('Failed to fetch laboratory categories', { error });
      throw new DatabaseError('Failed to fetch laboratory categories', { error });
    }

    // Get unique categories
    const categories = [...new Set((data || []).map((item: any) => item.category))];
    return categories as LabCategory[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching laboratory categories', { error });
    throw new DatabaseError('Failed to fetch laboratory categories', { error });
  }
}

/**
 * Get all laboratory departments
 */
export async function getLabDepartments(): Promise<string[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_catalog')
      .select('department')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .eq('is_active', true);

    if (error) {
      logger.error('Failed to fetch laboratory departments', { error });
      throw new DatabaseError('Failed to fetch laboratory departments', { error });
    }

    // Get unique departments
    const departments = [...new Set((data || []).map((item: any) => item.department))];
    return departments;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching laboratory departments', { error });
    throw new DatabaseError('Failed to fetch laboratory departments', { error });
  }
}

/**
 * Get laboratory tests by specimen type
 */
export async function getLabTestsBySpecimenType(specimenType: SpecimenType): Promise<LabCatalogEntry[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_catalog')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('specimen_type', specimenType)
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('test_name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch laboratory tests by specimen type', { error, specimenType });
      throw new DatabaseError('Failed to fetch laboratory tests by specimen type', { error });
    }

    return (data || []) as LabCatalogEntry[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching laboratory tests by specimen type', { error, specimenType });
    throw new DatabaseError('Failed to fetch laboratory tests by specimen type', { error });
  }
}

/**
 * Add a new laboratory test to catalog
 */
export async function addLabTest(input: any): Promise<LabCatalogEntry> {
  await validateManageTemplatePermission();

  const validatedInput = createLabCatalogSchema.parse(input);
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_catalog')
      .insert({
        clinic_id: clinicId,
        ...validatedInput,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to add laboratory test', { error, input });
      throw new DatabaseError('Failed to add laboratory test', { error });
    }

    logger.info('Laboratory test added successfully', { testId: data.id });
    return data as LabCatalogEntry;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error adding laboratory test', { error, input });
    throw new DatabaseError('Failed to add laboratory test', { error });
  }
}

/**
 * Update a laboratory test in catalog
 */
export async function updateLabTest(testId: string, input: any): Promise<LabCatalogEntry> {
  await validateManageTemplatePermission();

  const validatedInput = createLabCatalogSchema.partial().parse(input);
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('lab_catalog')
      .update({
        ...validatedInput,
        updated_at: new Date().toISOString(),
      })
      .eq('id', testId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update laboratory test', { error, testId });
      throw new DatabaseError('Failed to update laboratory test', { error });
    }

    if (!data) {
      throw new NotFoundError('Laboratory test not found');
    }

    logger.info('Laboratory test updated successfully', { testId });
    return data as LabCatalogEntry;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating laboratory test', { error, testId });
    throw new DatabaseError('Failed to update laboratory test', { error });
  }
}

/**
 * Delete a laboratory test from catalog (soft delete)
 */
export async function deleteLabTest(testId: string): Promise<void> {
  await validateManageTemplatePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('lab_catalog')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', testId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null);

    if (error) {
      logger.error('Failed to delete laboratory test', { error, testId });
      throw new DatabaseError('Failed to delete laboratory test', { error });
    }

    logger.info('Laboratory test deleted successfully', { testId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting laboratory test', { error, testId });
    throw new DatabaseError('Failed to delete laboratory test', { error });
  }
}

/**
 * Placeholder for integration with external drug database APIs (FDA, RxNorm)
 */
export async function syncWithExternalLabDatabase(): Promise<void> {
  // TODO: Implement integration with external laboratory database APIs
  logger.info('External laboratory database sync placeholder');
}

/**
 * Placeholder for integration with inventory system
 */
export async function syncWithInventorySystem(): Promise<void> {
  // TODO: Implement integration with inventory system for reagents and supplies
  logger.info('Inventory system sync placeholder');
}
