import { getSupabaseClient } from '../core/client';
import { DatabaseError } from '../core/errors';
import { getUserClinicId } from '../core/auth';
import { logger } from '../shared/logger';
import { validateManageTemplatePermission } from './prescription-permissions';
import { MedicineCatalogEntry, DosageForm } from './prescription-types';

/**
 * Search medicines in the catalog
 */
export async function searchMedicines(params: {
  query?: string;
  category?: string;
  dosage_form?: DosageForm;
  manufacturer?: string;
  is_controlled?: boolean;
  limit?: number;
}): Promise<MedicineCatalogEntry[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();
  const { query, category, dosage_form, manufacturer, is_controlled, limit = 50 } = params;

  try {
    let dbQuery = supabase
      .from('medicine_catalog')
      .select('*')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .limit(limit);

    // Apply text search if query provided
    if (query) {
      dbQuery = dbQuery.or(`medicine_name.ilike.%${query}%,generic_name.ilike.%${query}%,brand_name.ilike.%${query}%`);
    }

    // Apply filters
    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }

    if (dosage_form) {
      dbQuery = dbQuery.eq('dosage_form', dosage_form);
    }

    if (manufacturer) {
      dbQuery = dbQuery.eq('manufacturer', manufacturer);
    }

    if (is_controlled !== undefined) {
      dbQuery = dbQuery.eq('is_controlled', is_controlled);
    }

    const { data, error } = await dbQuery.order('medicine_name', { ascending: true });

    if (error) {
      logger.error('Failed to search medicines', { error, params });
      throw new DatabaseError('Failed to search medicines', { error });
    }

    return (data || []) as MedicineCatalogEntry[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error searching medicines', { error, params });
    throw new DatabaseError('Failed to search medicines', { error });
  }
}

/**
 * Get medicine by ID
 */
export async function getMedicine(medicineId: string): Promise<MedicineCatalogEntry> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('medicine_catalog')
      .select('*')
      .eq('id', medicineId)
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .single();

    if (error) {
      logger.error('Failed to fetch medicine', { error, medicineId });
      throw new DatabaseError('Failed to fetch medicine', { error });
    }

    if (!data) {
      throw new Error('Medicine not found');
    }

    return data as MedicineCatalogEntry;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching medicine', { error, medicineId });
    throw new DatabaseError('Failed to fetch medicine', { error });
  }
}

/**
 * Get all medicine categories
 */
export async function getMedicineCategories(): Promise<string[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('medicine_catalog')
      .select('category')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .not('category', 'is', null);

    if (error) {
      logger.error('Failed to fetch medicine categories', { error });
      throw new DatabaseError('Failed to fetch medicine categories', { error });
    }

    const categories = new Set((data || []).map((m: any) => m.category));
    return Array.from(categories).sort();
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching medicine categories', { error });
    throw new DatabaseError('Failed to fetch medicine categories', { error });
  }
}

/**
 * Get all dosage forms
 */
export async function getDosageForms(): Promise<string[]> {
  return Object.values(DosageForm);
}

/**
 * Get all manufacturers
 */
export async function getManufacturers(): Promise<string[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('medicine_catalog')
      .select('manufacturer')
      .eq('clinic_id', clinicId)
      .is('deleted_at', null)
      .not('manufacturer', 'is', null);

    if (error) {
      logger.error('Failed to fetch manufacturers', { error });
      throw new DatabaseError('Failed to fetch manufacturers', { error });
    }

    const manufacturers = new Set((data || []).map((m: any) => m.manufacturer));
    return Array.from(manufacturers).sort();
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching manufacturers', { error });
    throw new DatabaseError('Failed to fetch manufacturers', { error });
  }
}

/**
 * Add medicine to catalog
 */
export async function addMedicine(medicine: {
  medicine_name: string;
  generic_name?: string;
  brand_name?: string;
  dosage_form: DosageForm;
  strength?: string;
  category?: string;
  manufacturer?: string;
  is_controlled?: boolean;
  requires_prescription?: boolean;
  description?: string;
  contraindications?: string[];
  side_effects?: string[];
  storage_conditions?: string;
}): Promise<MedicineCatalogEntry> {
  await validateManageTemplatePermission();

  const clinicId = await getUserClinicId();
  const { getCurrentUser } = await import('../core/auth');
  const user = await getCurrentUser();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('medicine_catalog')
      .insert({
        clinic_id: clinicId,
        ...medicine,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to add medicine to catalog', { error, medicine });
      throw new DatabaseError('Failed to add medicine to catalog', { error });
    }

    logger.info('Medicine added to catalog successfully', { medicineId: data.id });
    return data as MedicineCatalogEntry;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error adding medicine to catalog', { error, medicine });
    throw new DatabaseError('Failed to add medicine to catalog', { error });
  }
}

/**
 * Update medicine in catalog
 */
export async function updateMedicine(
  medicineId: string,
  updates: Partial<MedicineCatalogEntry>
): Promise<MedicineCatalogEntry> {
  await validateManageTemplatePermission();

  const clinicId = await getUserClinicId();
  const { getCurrentUser } = await import('../core/auth');
  const user = await getCurrentUser();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('medicine_catalog')
      .update({
        ...updates,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', medicineId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update medicine in catalog', { error, medicineId });
      throw new DatabaseError('Failed to update medicine in catalog', { error });
    }

    logger.info('Medicine updated in catalog successfully', { medicineId });
    return data as MedicineCatalogEntry;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error updating medicine in catalog', { error, medicineId });
    throw new DatabaseError('Failed to update medicine in catalog', { error });
  }
}

/**
 * Delete medicine from catalog
 */
export async function deleteMedicine(medicineId: string): Promise<void> {
  await validateManageTemplatePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('medicine_catalog')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', medicineId)
      .eq('clinic_id', clinicId);

    if (error) {
      logger.error('Failed to delete medicine from catalog', { error, medicineId });
      throw new DatabaseError('Failed to delete medicine from catalog', { error });
    }

    logger.info('Medicine deleted from catalog successfully', { medicineId });
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error deleting medicine from catalog', { error, medicineId });
    throw new DatabaseError('Failed to delete medicine from catalog', { error });
  }
}

/**
 * Placeholder for drug database API integration
 * This function is prepared for future integration with external drug databases
 */
export async function searchDrugDatabase(query: string): Promise<MedicineCatalogEntry[]> {
  // TODO: Integrate with external drug database API (e.g., FDA Drug Database, RxNorm)
  // This is a placeholder for future integration
  return [];
}

/**
 * Placeholder for inventory system integration
 * This function is prepared for future integration with inventory management
 */
export async function checkMedicineAvailability(medicineId: string): Promise<{
  available: boolean;
  stock: number;
  reserved: number;
}> {
  // TODO: Integrate with inventory system
  // This is a placeholder for future integration
  return {
    available: true,
    stock: 100,
    reserved: 0,
  };
}
