import { Medicine, DosageCalculation, Frequency } from './prescription-types';

/**
 * Calculate daily dose based on dose and frequency
 */
export function calculateDailyDose(dose: string, frequency: Frequency): number {
  const doseValue = parseDoseValue(dose);
  
  const frequencyMultiplier = getFrequencyMultiplier(frequency);
  
  return doseValue * frequencyMultiplier;
}

/**
 * Calculate total quantity needed for the duration
 */
export function calculateTotalQuantity(
  dose: string,
  frequency: Frequency,
  duration: string
): number {
  const dailyDose = calculateDailyDose(dose, frequency);
  const durationDays = parseDuration(duration);
  
  return dailyDose * durationDays;
}

/**
 * Calculate treatment duration in days
 */
export function calculateDurationDays(duration: string): number {
  return parseDuration(duration);
}

/**
 * Parse dose value from dose string (e.g., "500mg" -> 500)
 */
function parseDoseValue(dose: string): number {
  const match = dose.match(/(\d+(\.\d+)?)/);
  if (!match) {
    throw new Error(`Invalid dose format: ${dose}`);
  }
  return parseFloat(match[1]);
}

/**
 * Get frequency multiplier for daily dose calculation
 */
function getFrequencyMultiplier(frequency: Frequency): number {
  switch (frequency) {
    case 'once':
      return 1;
    case 'daily':
      return 1;
    case 'twice_daily':
      return 2;
    case 'three_times_daily':
      return 3;
    case 'four_times_daily':
      return 4;
    case 'every_8_hours':
      return 3;
    case 'every_6_hours':
      return 4;
    case 'every_4_hours':
      return 6;
    case 'weekly':
      return 1 / 7;
    case 'biweekly':
      return 1 / 14;
    case 'monthly':
      return 1 / 30;
    case 'as_needed':
    case 'before_meals':
    case 'after_meals':
    case 'with_meals':
    case 'at_bedtime':
      return 1; // Default to once daily for PRN
    default:
      return 1;
  }
}

/**
 * Parse duration string to days (e.g., "7 days" -> 7, "2 weeks" -> 14)
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)\s*(day|week|month)s?$/i);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'day':
      return value;
    case 'week':
      return value * 7;
    case 'month':
      return value * 30;
    default:
      return value;
  }
}

/**
 * Complete dosage calculation
 */
export function calculateDosage(medicine: Medicine): DosageCalculation {
  const errors: string[] = [];
  
  try {
    const dailyDose = calculateDailyDose(medicine.dose, medicine.frequency);
    const totalQuantity = calculateTotalQuantity(medicine.dose, medicine.frequency, medicine.duration);
    const durationDays = calculateDurationDays(medicine.duration);

    // Validate max daily dose if specified
    if (medicine.max_daily_dose) {
      const maxDose = parseDoseValue(medicine.max_daily_dose);
      if (dailyDose > maxDose) {
        errors.push(`Daily dose (${dailyDose}) exceeds maximum daily dose (${maxDose})`);
      }
    }

    return {
      daily_dose: dailyDose,
      total_quantity: totalQuantity,
      duration_days: durationDays,
      is_valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    return {
      daily_dose: 0,
      total_quantity: 0,
      duration_days: 0,
      is_valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Validate dose value
 */
export function validateDose(dose: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!dose || dose.trim().length === 0) {
    errors.push('Dose is required');
    return { isValid: false, errors };
  }

  try {
    parseDoseValue(dose);
  } catch (error) {
    errors.push('Invalid dose format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate frequency
 */
export function validateFrequency(frequency: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  const validFrequencies = Object.values(Frequency);
  
  if (!frequency || frequency.trim().length === 0) {
    errors.push('Frequency is required');
    return { isValid: false, errors };
  }

  if (!validFrequencies.includes(frequency as Frequency)) {
    errors.push(`Invalid frequency. Valid values: ${validFrequencies.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate duration
 */
export function validateDuration(duration: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!duration || duration.trim().length === 0) {
    errors.push('Duration is required');
    return { isValid: false, errors };
  }

  try {
    parseDuration(duration);
  } catch (error) {
    errors.push('Invalid duration format. Use format like "7 days", "2 weeks", "1 month"');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate quantity
 */
export function validateQuantity(quantity: number): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (quantity === undefined || quantity === null) {
    errors.push('Quantity is required');
    return { isValid: false, errors };
  }

  if (!Number.isInteger(quantity)) {
    errors.push('Quantity must be an integer');
  }

  if (quantity <= 0) {
    errors.push('Quantity must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Placeholder for weight-based dose calculation
 * This function is prepared for future implementation
 */
export function calculateWeightBasedDose(
  dosePerKg: number,
  weight: number,
  frequency: Frequency
): DosageCalculation {
  // TODO: Implement weight-based dose calculation
  // This is a placeholder for future implementation
  return {
    daily_dose: 0,
    total_quantity: 0,
    duration_days: 0,
    is_valid: false,
    errors: ['Weight-based dose calculation not yet implemented'],
  };
}

/**
 * Placeholder for age-based dose calculation
 * This function is prepared for future implementation
 */
export function calculateAgeBasedDose(
  age: number,
  frequency: Frequency
): DosageCalculation {
  // TODO: Implement age-based dose calculation
  // This is a placeholder for future implementation
  return {
    daily_dose: 0,
    total_quantity: 0,
    duration_days: 0,
    is_valid: false,
    errors: ['Age-based dose calculation not yet implemented'],
  };
}

/**
 * Placeholder for renal dose adjustment
 * This function is prepared for future implementation
 */
export function calculateRenalAdjustedDose(
  creatinineClearance: number,
  normalDose: number
): DosageCalculation {
  // TODO: Implement renal dose adjustment
  // This is a placeholder for future implementation
  return {
    daily_dose: 0,
    total_quantity: 0,
    duration_days: 0,
    is_valid: false,
    errors: ['Renal dose adjustment not yet implemented'],
  };
}

/**
 * Placeholder for pediatric dose calculation
 * This function is prepared for future implementation
 */
export function calculatePediatricDose(
  age: number,
  weight: number,
  adultDose: number,
  frequency: Frequency
): DosageCalculation {
  // TODO: Implement pediatric dose calculation
  // This is a placeholder for future implementation
  return {
    daily_dose: 0,
    total_quantity: 0,
    duration_days: 0,
    is_valid: false,
    errors: ['Pediatric dose calculation not yet implemented'],
  };
}
