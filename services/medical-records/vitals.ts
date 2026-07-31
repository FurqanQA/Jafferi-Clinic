import { Vitals, BMICategory } from './medical-record-types';
import { validateBMI, determineBMICategory, validateBloodPressure } from './medical-record-validation';

/**
 * Calculate BMI from height and weight
 * @param heightCm - Height in centimeters
 * @param weightKg - Weight in kilograms
 * @returns BMI value rounded to 1 decimal place
 */
export function calculateBMI(heightCm: number, weightKg: number): number {
  return validateBMI(heightCm, weightKg);
}

/**
 * Get BMI category from BMI value
 * @param bmi - BMI value
 * @returns BMI category
 */
export function getBMICategory(bmi: number): BMICategory {
  return determineBMICategory(bmi);
}

/**
 * Calculate complete vitals with BMI
 * Automatically calculates BMI and BMI category from height and weight
 */
export function calculateCompleteVitals(vitals: {
  height_cm?: number;
  weight_kg?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  temperature_celsius?: number;
  oxygen_saturation?: number;
  blood_sugar?: number;
  pain_scale?: number;
  waist_circumference?: number;
  head_circumference?: number;
}): Vitals {
  const result: Vitals = {
    height_cm: vitals.height_cm,
    weight_kg: vitals.weight_kg,
    blood_pressure_systolic: vitals.blood_pressure_systolic,
    blood_pressure_diastolic: vitals.blood_pressure_diastolic,
    heart_rate: vitals.heart_rate,
    respiratory_rate: vitals.respiratory_rate,
    temperature_celsius: vitals.temperature_celsius,
    oxygen_saturation: vitals.oxygen_saturation,
    blood_sugar: vitals.blood_sugar,
    pain_scale: vitals.pain_scale !== undefined ? vitals.pain_scale as any : undefined,
    waist_circumference: vitals.waist_circumference,
    head_circumference: vitals.head_circumference,
  };

  // Calculate BMI if height and weight are provided
  if (vitals.height_cm && vitals.weight_kg) {
    result.bmi = calculateBMI(vitals.height_cm, vitals.weight_kg);
    result.bmi_category = getBMICategory(result.bmi);
  }

  // Validate blood pressure if both values are provided
  if (vitals.blood_pressure_systolic && vitals.blood_pressure_diastolic) {
    validateBloodPressure(vitals.blood_pressure_systolic, vitals.blood_pressure_diastolic);
  }

  return result;
}

/**
 * Validate vitals data
 * Checks if all provided vitals are within acceptable ranges
 */
export function validateVitals(vitals: Vitals): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Height validation
  if (vitals.height_cm !== undefined) {
    if (vitals.height_cm < 30 || vitals.height_cm > 250) {
      errors.push('Height must be between 30 and 250 cm');
    }
  }

  // Weight validation
  if (vitals.weight_kg !== undefined) {
    if (vitals.weight_kg < 1 || vitals.weight_kg > 300) {
      errors.push('Weight must be between 1 and 300 kg');
    }
  }

  // BMI validation
  if (vitals.bmi !== undefined) {
    if (vitals.bmi < 10 || vitals.bmi > 60) {
      errors.push('BMI must be between 10 and 60');
    }
  }

  // Blood pressure validation
  if (vitals.blood_pressure_systolic !== undefined) {
    if (vitals.blood_pressure_systolic < 50 || vitals.blood_pressure_systolic > 250) {
      errors.push('Systolic blood pressure must be between 50 and 250 mmHg');
    }
  }

  if (vitals.blood_pressure_diastolic !== undefined) {
    if (vitals.blood_pressure_diastolic < 30 || vitals.blood_pressure_diastolic > 150) {
      errors.push('Diastolic blood pressure must be between 30 and 150 mmHg');
    }
  }

  // Blood pressure relationship validation
  if (vitals.blood_pressure_systolic && vitals.blood_pressure_diastolic) {
    if (vitals.blood_pressure_systolic <= vitals.blood_pressure_diastolic) {
      errors.push('Systolic blood pressure must be greater than diastolic');
    }
  }

  // Heart rate validation
  if (vitals.heart_rate !== undefined) {
    if (vitals.heart_rate < 30 || vitals.heart_rate > 220) {
      errors.push('Heart rate must be between 30 and 220 bpm');
    }
  }

  // Respiratory rate validation
  if (vitals.respiratory_rate !== undefined) {
    if (vitals.respiratory_rate < 5 || vitals.respiratory_rate > 60) {
      errors.push('Respiratory rate must be between 5 and 60 breaths/min');
    }
  }

  // Temperature validation
  if (vitals.temperature_celsius !== undefined) {
    if (vitals.temperature_celsius < 30 || vitals.temperature_celsius > 45) {
      errors.push('Temperature must be between 30 and 45 °C');
    }
  }

  // Oxygen saturation validation
  if (vitals.oxygen_saturation !== undefined) {
    if (vitals.oxygen_saturation < 50 || vitals.oxygen_saturation > 100) {
      errors.push('Oxygen saturation must be between 50 and 100%');
    }
  }

  // Blood sugar validation
  if (vitals.blood_sugar !== undefined) {
    if (vitals.blood_sugar < 20 || vitals.blood_sugar > 600) {
      errors.push('Blood sugar must be between 20 and 600 mg/dL');
    }
  }

  // Pain scale validation
  if (vitals.pain_scale !== undefined) {
    if (!Number.isInteger(vitals.pain_scale) || vitals.pain_scale < 0 || vitals.pain_scale > 10) {
      errors.push('Pain scale must be an integer between 0 and 10');
    }
  }

  // Waist circumference validation
  if (vitals.waist_circumference !== undefined) {
    if (vitals.waist_circumference < 40 || vitals.waist_circumference > 200) {
      errors.push('Waist circumference must be between 40 and 200 cm');
    }
  }

  // Head circumference validation
  if (vitals.head_circumference !== undefined) {
    if (vitals.head_circumference < 20 || vitals.head_circumference > 60) {
      errors.push('Head circumference must be between 20 and 60 cm');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format vitals for display
 * Returns a formatted string representation of vitals
 */
export function formatVitals(vitals: Vitals): string {
  const lines: string[] = [];

  if (vitals.height_cm) {
    lines.push(`Height: ${vitals.height_cm} cm`);
  }

  if (vitals.weight_kg) {
    lines.push(`Weight: ${vitals.weight_kg} kg`);
  }

  if (vitals.bmi) {
    lines.push(`BMI: ${vitals.bmi} (${vitals.bmi_category})`);
  }

  if (vitals.blood_pressure_systolic && vitals.blood_pressure_diastolic) {
    lines.push(`BP: ${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic} mmHg`);
  }

  if (vitals.heart_rate) {
    lines.push(`HR: ${vitals.heart_rate} bpm`);
  }

  if (vitals.respiratory_rate) {
    lines.push(`RR: ${vitals.respiratory_rate} breaths/min`);
  }

  if (vitals.temperature_celsius) {
    lines.push(`Temp: ${vitals.temperature_celsius} °C`);
  }

  if (vitals.oxygen_saturation) {
    lines.push(`SpO2: ${vitals.oxygen_saturation}%`);
  }

  if (vitals.blood_sugar) {
    lines.push(`Blood Sugar: ${vitals.blood_sugar} mg/dL`);
  }

  if (vitals.pain_scale !== undefined) {
    lines.push(`Pain Scale: ${vitals.pain_scale}/10`);
  }

  if (vitals.waist_circumference) {
    lines.push(`Waist: ${vitals.waist_circumference} cm`);
  }

  if (vitals.head_circumference) {
    lines.push(`Head: ${vitals.head_circumference} cm`);
  }

  return lines.join('\n');
}

/**
 * Get vital signs that are outside normal ranges
 * Returns an array of abnormal vital signs with their values
 */
export function getAbnormalVitals(vitals: Vitals): Array<{
  vital: string;
  value: number;
  normalRange: string;
}> {
  const abnormal: Array<{ vital: string; value: number; normalRange: string }> = [];

  if (vitals.blood_pressure_systolic && vitals.blood_pressure_diastolic) {
    if (vitals.blood_pressure_systolic > 140 || vitals.blood_pressure_diastolic > 90) {
      abnormal.push({
        vital: 'Blood Pressure',
        value: vitals.blood_pressure_systolic,
        normalRange: '< 140/90 mmHg',
      });
    }
  }

  if (vitals.heart_rate) {
    if (vitals.heart_rate < 60 || vitals.heart_rate > 100) {
      abnormal.push({
        vital: 'Heart Rate',
        value: vitals.heart_rate,
        normalRange: '60-100 bpm',
      });
    }
  }

  if (vitals.respiratory_rate) {
    if (vitals.respiratory_rate < 12 || vitals.respiratory_rate > 20) {
      abnormal.push({
        vital: 'Respiratory Rate',
        value: vitals.respiratory_rate,
        normalRange: '12-20 breaths/min',
      });
    }
  }

  if (vitals.temperature_celsius) {
    if (vitals.temperature_celsius > 37.5) {
      abnormal.push({
        vital: 'Temperature',
        value: vitals.temperature_celsius,
        normalRange: '< 37.5 °C',
      });
    }
  }

  if (vitals.oxygen_saturation) {
    if (vitals.oxygen_saturation < 95) {
      abnormal.push({
        vital: 'Oxygen Saturation',
        value: vitals.oxygen_saturation,
        normalRange: '≥ 95%',
      });
    }
  }

  return abnormal;
}
