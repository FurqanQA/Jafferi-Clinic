import { getSupabaseClient } from './client';
import { ConflictError } from './errors';
import { getUserClinicId } from './auth';

/**
 * Configuration for checking duplicate fields
 */
export interface DuplicateFieldConfig {
  table: string;
  fields: Array<{
    name: string;
    value: string | undefined;
    errorMessage: string;
  }>;
  excludeId?: string;
}

/**
 * Check for duplicate values in a table
 * @param config - Configuration for duplicate checking
 * @throws ConflictError if duplicate found
 */
export async function checkDuplicates(config: DuplicateFieldConfig): Promise<void> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  for (const field of config.fields) {
    if (!field.value) continue;

    let query = supabase
      .from(config.table)
      .select('id')
      .eq('clinic_id', clinicId)
      .eq(field.name, field.value)
      .eq('deleted_at', null);

    // Exclude current record when updating
    if (config.excludeId) {
      query = query.neq('id', config.excludeId);
    }

    const { data: existing } = await query.single();

    if (existing) {
      throw new ConflictError(field.errorMessage);
    }
  }
}

/**
 * Check for duplicate email
 */
export async function checkDuplicateEmail(
  table: string,
  email: string | undefined,
  excludeId?: string
): Promise<void> {
  if (!email) return;
  await checkDuplicates({
    table,
    fields: [{ name: 'email', value: email, errorMessage: `A record with this email already exists` }],
    excludeId,
  });
}

/**
 * Check for duplicate phone
 */
export async function checkDuplicatePhone(
  table: string,
  phone: string | undefined,
  excludeId?: string
): Promise<void> {
  if (!phone) return;
  await checkDuplicates({
    table,
    fields: [{ name: 'phone', value: phone, errorMessage: `A record with this phone number already exists` }],
    excludeId,
  });
}

/**
 * Check for duplicate license number
 */
export async function checkDuplicateLicenseNumber(
  table: string,
  licenseNumber: string | undefined,
  excludeId?: string
): Promise<void> {
  if (!licenseNumber) return;
  await checkDuplicates({
    table,
    fields: [{ name: 'license_number', value: licenseNumber, errorMessage: `A record with this license number already exists` }],
    excludeId,
  });
}
