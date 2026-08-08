import { logger } from '../shared/logger';
import { cache, cacheHelpers } from '../shared/cache';
import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { validatePlatformWritePermission, validatePlatformDeletePermission, PlatformResource } from './platform-permissions';

// ============================================================================
// Staff Manager
// Staff management operations for clinics
// ============================================================================

/**
 * Staff interface
 */
export interface Staff {
  id: string;
  tenantId: string;
  clinicId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: 'doctor' | 'nurse' | 'receptionist' | 'administrator' | 'technician' | 'other';
  department: string | null;
  status: 'active' | 'inactive' | 'suspended';
  hireDate: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  settings: StaffSettings;
}

/**
 * Staff Settings
 */
export interface StaffSettings {
  receiveNotifications: boolean;
  receiveMarketingEmails: boolean;
  twoFactorEnabled: boolean;
  preferredLanguage: string;
  timezone: string;
  workingHours: WorkingHours;
}

/**
 * Working Hours
 */
export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

/**
 * Day Schedule
 */
export interface DaySchedule {
  start: string;
  end: string;
  off: boolean;
}

/**
 * Create a new staff member
 */
export async function createStaff(data: {
  tenantId: string;
  clinicId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'doctor' | 'nurse' | 'receptionist' | 'administrator' | 'technician' | 'other';
  department?: string;
  hireDate: string;
  settings?: Partial<StaffSettings>;
}): Promise<Staff> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    // Check if user is already staff for this clinic
    const { data: existing } = await supabase
      .from('staff')
      .select('id')
      .eq('clinic_id', data.clinicId)
      .eq('user_id', data.userId)
      .single();

    if (existing) {
      throw new DatabaseError('User is already staff for this clinic', { userId: data.userId });
    }

    // Create staff
    const staffId = `staff-${Date.now()}`;
    const now = new Date().toISOString();

    const defaultSettings: StaffSettings = {
      receiveNotifications: data.settings?.receiveNotifications ?? true,
      receiveMarketingEmails: data.settings?.receiveMarketingEmails ?? false,
      twoFactorEnabled: data.settings?.twoFactorEnabled ?? false,
      preferredLanguage: data.settings?.preferredLanguage || 'en',
      timezone: data.settings?.timezone || 'UTC',
      workingHours: data.settings?.workingHours || {
        monday: { start: '09:00', end: '17:00', off: false },
        tuesday: { start: '09:00', end: '17:00', off: false },
        wednesday: { start: '09:00', end: '17:00', off: false },
        thursday: { start: '09:00', end: '17:00', off: false },
        friday: { start: '09:00', end: '17:00', off: false },
        saturday: { start: '09:00', end: '13:00', off: false },
        sunday: { start: '00:00', end: '00:00', off: true },
      },
    };

    const { data: staff, error } = await supabase
      .from('staff')
      .insert({
        id: staffId,
        tenant_id: data.tenantId,
        clinic_id: data.clinicId,
        user_id: data.userId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone || null,
        role: data.role,
        department: data.department || null,
        status: 'active',
        hire_date: data.hireDate,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        settings: defaultSettings,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create staff', { error, data });
      throw new DatabaseError('Failed to create staff', { error });
    }

    logger.info('Staff created successfully', { staffId, clinicId: data.clinicId, userId: data.userId });

    // Invalidate cache
    cache.delete(`staff:${staffId}`);
    cache.delete(`staff:user:${data.userId}:${data.clinicId}`);

    return staff as Staff;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error creating staff', { error, data });
    throw new DatabaseError('Failed to create staff', { error });
  }
}

/**
 * Update staff
 */
export async function updateStaff(staffId: string, data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  role?: 'doctor' | 'nurse' | 'receptionist' | 'administrator' | 'technician' | 'other';
  department?: string | null;
  status?: 'active' | 'inactive' | 'suspended';
  settings?: Partial<StaffSettings>;
}): Promise<Staff> {
  try {
    await validatePlatformWritePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    // Get current staff to check clinic and user
    const { data: current } = await supabase
      .from('staff')
      .select('clinic_id, user_id')
      .eq('id', staffId)
      .single();

    if (!current) {
      throw new NotFoundError('Staff not found');
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.firstName !== undefined) updateData.first_name = data.firstName;
    if (data.lastName !== undefined) updateData.last_name = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.settings !== undefined) {
      updateData.settings = data.settings;
    }

    const { data: staff, error } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', staffId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update staff', { error, staffId });
      throw new DatabaseError('Failed to update staff', { error });
    }

    if (!staff) {
      throw new NotFoundError('Staff not found');
    }

    logger.info('Staff updated successfully', { staffId });

    // Invalidate cache
    cache.delete(`staff:${staffId}`);
    cache.delete(`staff:user:${current.user_id}:${current.clinic_id}`);

    return staff as Staff;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating staff', { error, staffId });
    throw new DatabaseError('Failed to update staff', { error });
  }
}

/**
 * Delete staff
 */
export async function deleteStaff(staffId: string): Promise<void> {
  try {
    await validatePlatformDeletePermission(PlatformResource.TENANTS);

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', staffId);

    if (error) {
      logger.error('Failed to delete staff', { error, staffId });
      throw new DatabaseError('Failed to delete staff', { error });
    }

    logger.info('Staff deleted successfully', { staffId });

    // Invalidate cache
    cache.delete(`staff:${staffId}`);
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting staff', { error, staffId });
    throw new DatabaseError('Failed to delete staff', { error });
  }
}

/**
 * Get staff by ID
 */
export async function getStaff(staffId: string): Promise<Staff> {
  try {
    // Check cache first
    const cached = cache.get<Staff>(`staff:${staffId}`);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', staffId)
      .single();

    if (error) {
      logger.error('Failed to fetch staff', { error, staffId });
      throw new DatabaseError('Failed to fetch staff', { error });
    }

    if (!staff) {
      throw new NotFoundError('Staff not found');
    }

    // Cache result
    cache.set(`staff:${staffId}`, staff, cacheHelpers.ttl.MEDIUM);

    return staff as Staff;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching staff', { error, staffId });
    throw new DatabaseError('Failed to fetch staff', { error });
  }
}

/**
 * Get staff by user ID within clinic
 */
export async function getStaffByUserId(clinicId: string, userId: string): Promise<Staff> {
  try {
    // Check cache first
    const cacheKey = `staff:user:${userId}:${clinicId}`;
    const cached = cache.get<Staff>(cacheKey);
    if (cached) {
      return cached;
    }

    const supabase = getSupabaseClient();

    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.error('Failed to fetch staff by user ID', { error, userId, clinicId });
      throw new DatabaseError('Failed to fetch staff', { error });
    }

    if (!staff) {
      throw new NotFoundError('Staff not found');
    }

    // Cache result
    cache.set(cacheKey, staff, cacheHelpers.ttl.MEDIUM);
    cache.set(`staff:${staff.id}`, staff, cacheHelpers.ttl.MEDIUM);

    return staff as Staff;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching staff by user ID', { error, userId, clinicId });
    throw new DatabaseError('Failed to fetch staff', { error });
  }
}

/**
 * List staff for a clinic
 */
export async function listStaff(clinicId: string, options: {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'inactive' | 'suspended';
  role?: 'doctor' | 'nurse' | 'receptionist' | 'administrator' | 'technician' | 'other';
  department?: string;
  search?: string;
}): Promise<{ staff: Staff[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, status, role, department, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('staff')
      .select('*', { count: 'exact' })
      .eq('clinic_id', clinicId);

    if (status) {
      query = query.eq('status', status);
    }

    if (role) {
      query = query.eq('role', role);
    }

    if (department) {
      query = query.eq('department', department);
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: staff, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list staff', { error, clinicId });
      throw new DatabaseError('Failed to list staff', { error });
    }

    return {
      staff: (staff || []) as Staff[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing staff', { error, clinicId });
    throw new DatabaseError('Failed to list staff', { error });
  }
}

/**
 * List staff for a tenant
 */
export async function listStaffByTenant(tenantId: string, options: {
  page?: number;
  pageSize?: number;
  status?: 'active' | 'inactive' | 'suspended';
  role?: 'doctor' | 'nurse' | 'receptionist' | 'administrator' | 'technician' | 'other';
  search?: string;
}): Promise<{ staff: Staff[]; total: number; page: number; pageSize: number }> {
  try {
    const { page = 1, pageSize = 20, status, role, search } = options;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('staff')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (status) {
      query = query.eq('status', status);
    }

    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: staff, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to list staff by tenant', { error, tenantId });
      throw new DatabaseError('Failed to list staff', { error });
    }

    return {
      staff: (staff || []) as Staff[],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error listing staff by tenant', { error, tenantId });
    throw new DatabaseError('Failed to list staff', { error });
  }
}

/**
 * Activate staff
 */
export async function activateStaff(staffId: string): Promise<Staff> {
  return updateStaff(staffId, { status: 'active' });
}

/**
 * Deactivate staff
 */
export async function deactivateStaff(staffId: string): Promise<Staff> {
  return updateStaff(staffId, { status: 'inactive' });
}

/**
 * Suspend staff
 */
export async function suspendStaff(staffId: string): Promise<Staff> {
  return updateStaff(staffId, { status: 'suspended' });
}

/**
 * Get staff statistics
 */
export async function getStaffStatistics(clinicId: string): Promise<{
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  byRole: Record<string, number>;
}> {
  try {
    const supabase = getSupabaseClient();

    const [{ data: allStaff }, { count: active }, { count: inactive }, { count: suspended }] = await Promise.all([
      supabase.from('staff').select('role').eq('clinic_id', clinicId),
      supabase.from('staff').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId).eq('status', 'active'),
      supabase.from('staff').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId).eq('status', 'inactive'),
      supabase.from('staff').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId).eq('status', 'suspended'),
    ]);

    const byRole: Record<string, number> = {};
    for (const staff of allStaff || []) {
      byRole[staff.role] = (byRole[staff.role] || 0) + 1;
    }

    return {
      total: allStaff?.length || 0,
      active: active || 0,
      inactive: inactive || 0,
      suspended: suspended || 0,
      byRole,
    };
  } catch (error) {
    logger.error('Failed to get staff statistics', { error, clinicId });
    throw new DatabaseError('Failed to get staff statistics', { error });
  }
}
