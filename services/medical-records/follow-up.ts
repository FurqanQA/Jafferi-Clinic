import { FollowUp } from './medical-record-types';

/**
 * Format follow-up for display
 * Returns a formatted string representation of follow-up
 */
export function formatFollowUp(followUp: FollowUp): string {
  if (!followUp.follow_up_required) {
    return 'No follow-up required';
  }

  const parts: string[] = ['Follow-up required'];

  if (followUp.follow_up_date) {
    parts.push(`Date: ${followUp.follow_up_date}`);
  }

  if (followUp.follow_up_interval) {
    parts.push(`Interval: ${followUp.follow_up_interval}`);
  }

  if (followUp.follow_up_reason) {
    parts.push(`Reason: ${followUp.follow_up_reason}`);
  }

  if (followUp.next_department) {
    parts.push(`Department: ${followUp.next_department}`);
  }

  if (followUp.next_doctor) {
    parts.push(`Doctor: ${followUp.next_doctor}`);
  }

  return parts.join('\n');
}

/**
 * Validate follow-up data
 * Checks if follow-up has required fields when required
 */
export function validateFollowUp(followUp: FollowUp): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (followUp.follow_up_required && !followUp.follow_up_date) {
    errors.push('Follow-up date is required when follow-up is required');
  }

  if (followUp.follow_up_date) {
    const followUpDate = new Date(followUp.follow_up_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (followUpDate < today) {
      errors.push('Follow-up date cannot be in the past');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate follow-up date from interval
 * Returns a date string based on the interval from today
 */
export function calculateFollowUpDate(interval: string): string {
  const today = new Date();
  const followUpDate = new Date(today);

  const intervalMatch = interval.match(/^(\d+)\s*(day|week|month|year)s?$/i);
  if (!intervalMatch) {
    throw new Error('Invalid interval format. Use format like "7 days", "2 weeks", "1 month"');
  }

  const value = parseInt(intervalMatch[1], 10);
  const unit = intervalMatch[2].toLowerCase();

  switch (unit) {
    case 'day':
      followUpDate.setDate(today.getDate() + value);
      break;
    case 'week':
      followUpDate.setDate(today.getDate() + (value * 7));
      break;
    case 'month':
      followUpDate.setMonth(today.getMonth() + value);
      break;
    case 'year':
      followUpDate.setFullYear(today.getFullYear() + value);
      break;
  }

  return followUpDate.toISOString().split('T')[0];
}

/**
 * Merge follow-up data
 * Combines two follow-up objects, preferring non-empty values
 */
export function mergeFollowUp(base: FollowUp, override: Partial<FollowUp>): FollowUp {
  return {
    follow_up_required: override.follow_up_required !== undefined ? override.follow_up_required : base.follow_up_required,
    follow_up_date: override.follow_up_date || base.follow_up_date,
    follow_up_interval: override.follow_up_interval || base.follow_up_interval,
    follow_up_reason: override.follow_up_reason || base.follow_up_reason,
    next_department: override.next_department || base.next_department,
    next_doctor: override.next_doctor || base.next_doctor,
  };
}

/**
 * Placeholder for AI follow-up recommendation
 * This function is prepared for future AI integration
 */
export async function generateAIFollowUpRecommendation(
  diagnosis: string,
  treatmentPlan: string[],
  patientData: Record<string, unknown>
): Promise<{
  follow_up_required: boolean;
  follow_up_interval?: string;
  follow_up_reason?: string;
}> {
  // TODO: Integrate with AI service for follow-up recommendations
  // This is a placeholder for future AI integration
  return {
    follow_up_required: true,
    follow_up_interval: '2 weeks',
    follow_up_reason: '[AI Generated] Follow-up recommended based on diagnosis and treatment',
  };
}

/**
 * Check if follow-up is overdue
 */
export function isFollowUpOverdue(followUpDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const followUp = new Date(followUpDate);
  return followUp < today;
}

/**
 * Get follow-up urgency
 */
export function getFollowUpUrgency(followUpDate: string): 'urgent' | 'soon' | 'normal' | 'none' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const followUp = new Date(followUpDate);

  const daysDiff = Math.floor((followUp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) {
    return 'urgent';
  } else if (daysDiff <= 3) {
    return 'soon';
  } else if (daysDiff <= 14) {
    return 'normal';
  } else {
    return 'none';
  }
}
