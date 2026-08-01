import { getSupabaseClient } from '../core/client';
import { DatabaseError, NotFoundError } from '../core/errors';
import { getUserClinicId, getCurrentUser } from '../core/auth';
import { logger } from '../shared/logger';
import { validateManageTemplatePermission } from './notification-permissions';
import { validateNotificationTemplate } from './notification-validation';
import {
  NotificationTemplate,
  NotificationModule,
  NotificationType,
  NotificationChannel,
} from './notification-types';

// ============================================================================
// Notification Templates
// ============================================================================

/**
 * Generate template number
 */
export function generateTemplateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TPL${timestamp}${random}`;
}

/**
 * Create notification template
 */
export async function createNotificationTemplate(
  template: Omit<NotificationTemplate, 'id' | 'clinic_id' | 'template_number' | 'is_system' | 'created_by' | 'updated_by' | 'created_at' | 'updated_at' | 'version_number'>
): Promise<NotificationTemplate> {
  await validateManageTemplatePermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    validateNotificationTemplate(template);

    const templateNumber = generateTemplateNumber();

    const { data, error } = await supabase
      .from('notification_templates')
      .insert({
        clinic_id: clinicId,
        template_number: templateNumber,
        name: template.name,
        description: template.description,
        module: template.module,
        type: template.type,
        channels: template.channels,
        subject_template: template.subject_template,
        body_template: template.body_template,
        html_template: template.html_template,
        variables: template.variables,
        is_system: false,
        created_by: user.id,
        updated_by: user.id,
        version_number: 1,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create notification template', { error, template });
      throw new DatabaseError('Failed to create notification template', { error });
    }

    logger.info('Notification template created successfully', { templateNumber });
    return data as NotificationTemplate;
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error creating notification template', { error, template });
    throw new DatabaseError('Failed to create notification template', { error });
  }
}

/**
 * Get notification template by ID
 */
export async function getNotificationTemplate(templateId: string): Promise<NotificationTemplate> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', templateId)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch notification template', { error, templateId });
      throw new DatabaseError('Failed to fetch notification template', { error });
    }

    if (!data) {
      throw new NotFoundError('Notification template not found');
    }

    return data as NotificationTemplate;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching notification template', { error, templateId });
    throw new DatabaseError('Failed to fetch notification template', { error });
  }
}

/**
 * Get notification template by number
 */
export async function getNotificationTemplateByNumber(templateNumber: string): Promise<NotificationTemplate> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('template_number', templateNumber)
      .eq('clinic_id', clinicId)
      .single();

    if (error) {
      logger.error('Failed to fetch notification template by number', { error, templateNumber });
      throw new DatabaseError('Failed to fetch notification template by number', { error });
    }

    if (!data) {
      throw new NotFoundError('Notification template not found');
    }

    return data as NotificationTemplate;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error fetching notification template by number', { error, templateNumber });
    throw new DatabaseError('Failed to fetch notification template by number', { error });
  }
}

/**
 * Get notification templates by module
 */
export async function getTemplatesByModule(module: NotificationModule): Promise<NotificationTemplate[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('module', module)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch templates by module', { error, module });
      throw new DatabaseError('Failed to fetch templates by module', { error });
    }

    return (data || []) as NotificationTemplate[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching templates by module', { error, module });
    throw new DatabaseError('Failed to fetch templates by module', { error });
  }
}

/**
 * Get notification templates by type
 */
export async function getTemplatesByType(type: NotificationType): Promise<NotificationTemplate[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('type', type)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch templates by type', { error, type });
      throw new DatabaseError('Failed to fetch templates by type', { error });
    }

    return (data || []) as NotificationTemplate[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching templates by type', { error, type });
    throw new DatabaseError('Failed to fetch templates by type', { error });
  }
}

/**
 * Get notification templates by channel
 */
export async function getTemplatesByChannel(channel: NotificationChannel): Promise<NotificationTemplate[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('clinic_id', clinicId)
      .contains('channels', [channel])
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch templates by channel', { error, channel });
      throw new DatabaseError('Failed to fetch templates by channel', { error });
    }

    return (data || []) as NotificationTemplate[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching templates by channel', { error, channel });
    throw new DatabaseError('Failed to fetch templates by channel', { error });
  }
}

/**
 * Get all notification templates
 */
export async function getAllTemplates(): Promise<NotificationTemplate[]> {
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch all notification templates', { error });
      throw new DatabaseError('Failed to fetch all notification templates', { error });
    }

    return (data || []) as NotificationTemplate[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching all notification templates', { error });
    throw new DatabaseError('Failed to fetch all notification templates', { error });
  }
}

/**
 * Update notification template
 */
export async function updateNotificationTemplate(
  templateId: string,
  updates: Partial<Omit<NotificationTemplate, 'id' | 'clinic_id' | 'template_number' | 'is_system' | 'created_by' | 'created_at' | 'version_number'>>
): Promise<NotificationTemplate> {
  await validateManageTemplatePermission();

  const user = await getCurrentUser();
  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch existing template
    const { data: existingTemplate } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', templateId)
      .eq('clinic_id', clinicId)
      .single();

    if (!existingTemplate) {
      throw new NotFoundError('Notification template not found');
    }

    // Prevent modification of system templates
    if (existingTemplate.is_system) {
      throw new Error('System templates cannot be modified');
    }

    const { data, error } = await supabase
      .from('notification_templates')
      .update({
        ...updates,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        version_number: existingTemplate.version_number + 1,
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update notification template', { error, templateId });
      throw new DatabaseError('Failed to update notification template', { error });
    }

    logger.info('Notification template updated successfully', { templateId });
    return data as NotificationTemplate;
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error updating notification template', { error, templateId });
    throw new DatabaseError('Failed to update notification template', { error });
  }
}

/**
 * Delete notification template
 */
export async function deleteNotificationTemplate(templateId: string): Promise<void> {
  await validateManageTemplatePermission();

  const clinicId = await getUserClinicId();
  const supabase = getSupabaseClient();

  try {
    // Fetch existing template
    const { data: existingTemplate } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('id', templateId)
      .eq('clinic_id', clinicId)
      .single();

    if (!existingTemplate) {
      throw new NotFoundError('Notification template not found');
    }

    // Prevent deletion of system templates
    if (existingTemplate.is_system) {
      throw new Error('System templates cannot be deleted');
    }

    const { error } = await supabase
      .from('notification_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      logger.error('Failed to delete notification template', { error, templateId });
      throw new DatabaseError('Failed to delete notification template', { error });
    }

    logger.info('Notification template deleted successfully', { templateId });
  } catch (error) {
    if (error instanceof DatabaseError || error instanceof NotFoundError) {
      throw error;
    }
    logger.error('Unexpected error deleting notification template', { error, templateId });
    throw new DatabaseError('Failed to delete notification template', { error });
  }
}

/**
 * Get system templates (for initialization)
 */
export async function getSystemTemplates(): Promise<NotificationTemplate[]> {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('is_system', true)
      .order('name', { ascending: true });

    if (error) {
      logger.error('Failed to fetch system templates', { error });
      throw new DatabaseError('Failed to fetch system templates', { error });
    }

    return (data || []) as NotificationTemplate[];
  } catch (error) {
    if (error instanceof DatabaseError) {
      throw error;
    }
    logger.error('Unexpected error fetching system templates', { error });
    throw new DatabaseError('Failed to fetch system templates', { error });
  }
}

/**
 * Initialize system templates (placeholder for seeding)
 */
export async function initializeSystemTemplates(): Promise<void> {
  // Placeholder for initializing system templates
  // This would be called during system setup or migration
  logger.info('System templates initialization requested');
}

// ============================================================================
// Predefined System Templates (for reference)
// ============================================================================

/**
 * System template definitions
 * These are the standard templates that should be available in every clinic
 */
export const SYSTEM_TEMPLATES = {
  APPOINTMENT_CREATED: {
    name: 'Appointment Created',
    description: 'Notification sent when a new appointment is created',
    module: 'appointments' as NotificationModule,
    type: 'information' as NotificationType,
    channels: ['in_app', 'email', 'sms'] as NotificationChannel[],
    subject_template: 'Appointment Confirmed - {{appointment_number}}',
    body_template: 'Your appointment has been confirmed for {{appointment_date}} at {{appointment_time}} with Dr. {{doctor_name}}.',
    html_template: '<h1>Appointment Confirmed</h1><p>Your appointment has been confirmed for {{appointment_date}} at {{appointment_time}} with Dr. {{doctor_name}}.</p>',
    variables: ['appointment_number', 'appointment_date', 'appointment_time', 'doctor_name'],
  },
  APPOINTMENT_REMINDER: {
    name: 'Appointment Reminder',
    description: 'Reminder sent before an appointment',
    module: 'appointments' as NotificationModule,
    type: 'reminder' as NotificationType,
    channels: ['in_app', 'email', 'sms'] as NotificationChannel[],
    subject_template: 'Appointment Reminder - {{appointment_number}}',
    body_template: 'This is a reminder for your appointment tomorrow at {{appointment_time}} with Dr. {{doctor_name}}.',
    html_template: '<h1>Appointment Reminder</h1><p>This is a reminder for your appointment tomorrow at {{appointment_time}} with Dr. {{doctor_name}}.</p>',
    variables: ['appointment_number', 'appointment_date', 'appointment_time', 'doctor_name'],
  },
  APPOINTMENT_CANCELLED: {
    name: 'Appointment Cancelled',
    description: 'Notification sent when an appointment is cancelled',
    module: 'appointments' as NotificationModule,
    type: 'warning' as NotificationType,
    channels: ['in_app', 'email'] as NotificationChannel[],
    subject_template: 'Appointment Cancelled - {{appointment_number}}',
    body_template: 'Your appointment scheduled for {{appointment_date}} has been cancelled.',
    html_template: '<h1>Appointment Cancelled</h1><p>Your appointment scheduled for {{appointment_date}} has been cancelled.</p>',
    variables: ['appointment_number', 'appointment_date'],
  },
  PATIENT_REGISTERED: {
    name: 'Patient Registered',
    description: 'Welcome notification for new patients',
    module: 'patients' as NotificationModule,
    type: 'success' as NotificationType,
    channels: ['in_app', 'email'] as NotificationChannel[],
    subject_template: 'Welcome to {{clinic_name}}',
    body_template: 'Welcome to {{clinic_name}}. Your patient account has been created successfully.',
    html_template: '<h1>Welcome to {{clinic_name}}</h1><p>Your patient account has been created successfully.</p>',
    variables: ['clinic_name', 'patient_name'],
  },
  INVOICE_GENERATED: {
    name: 'Invoice Generated',
    description: 'Notification when a new invoice is generated',
    module: 'billing' as NotificationModule,
    type: 'financial' as NotificationType,
    channels: ['in_app', 'email'] as NotificationChannel[],
    subject_template: 'Invoice Generated - {{invoice_number}}',
    body_template: 'A new invoice {{invoice_number}} has been generated with total amount {{amount}}.',
    html_template: '<h1>Invoice Generated</h1><p>A new invoice {{invoice_number}} has been generated with total amount {{amount}}.</p>',
    variables: ['invoice_number', 'amount', 'due_date'],
  },
  PAYMENT_RECEIVED: {
    name: 'Payment Received',
    description: 'Notification when a payment is received',
    module: 'payments' as NotificationModule,
    type: 'financial' as NotificationType,
    channels: ['in_app', 'email'] as NotificationChannel[],
    subject_template: 'Payment Received - {{payment_number}}',
    body_template: 'Payment of {{amount}} has been received for invoice {{invoice_number}}.',
    html_template: '<h1>Payment Received</h1><p>Payment of {{amount}} has been received for invoice {{invoice_number}}.</p>',
    variables: ['payment_number', 'amount', 'invoice_number'],
  },
  LABORATORY_RESULT_READY: {
    name: 'Laboratory Result Ready',
    description: 'Notification when lab results are ready',
    module: 'laboratory' as NotificationModule,
    type: 'medical' as NotificationType,
    channels: ['in_app', 'email', 'sms'] as NotificationChannel[],
    subject_template: 'Lab Results Ready - {{test_name}}',
    body_template: 'Your laboratory results for {{test_name}} are now available.',
    html_template: '<h1>Lab Results Ready</h1><p>Your laboratory results for {{test_name}} are now available.</p>',
    variables: ['test_name', 'patient_name'],
  },
  PASSWORD_RESET: {
    name: 'Password Reset',
    description: 'Password reset notification',
    module: 'authentication' as NotificationModule,
    type: 'security' as NotificationType,
    channels: ['email'] as NotificationChannel[],
    subject_template: 'Password Reset Request',
    body_template: 'Click the link to reset your password: {{reset_link}}',
    html_template: '<h1>Password Reset</h1><p>Click the link to reset your password: <a href="{{reset_link}}">Reset Password</a></p>',
    variables: ['reset_link'],
  },
};
