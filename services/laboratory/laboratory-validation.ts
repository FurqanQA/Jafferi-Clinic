import { z } from 'zod';
import {
  LAB_ORDER_STATUS,
  LAB_PRIORITY,
  LAB_CATEGORY,
  SPECIMEN_TYPE,
  SPECIMEN_STATUS,
  RESULT_TYPE,
  RESULT_FLAG,
  REFERENCE_RANGE_TYPE,
  IMAGING_TYPE,
  VALID_STATUS_TRANSITIONS,
  LabOrderStatus,
  LabPriority,
  LabCategory,
  SpecimenType,
  SpecimenStatus,
  ResultType,
  ResultFlag,
  ReferenceRangeType,
  ImagingType,
} from './laboratory-types';

/**
 * Zod schema for creating a laboratory order
 */
export const createLabOrderSchema = z.object({
  patient_id: z.string().uuid('Invalid patient ID format'),
  doctor_id: z.string().uuid('Invalid doctor ID format'),
  appointment_id: z.string().uuid('Invalid appointment ID format'),
  medical_record_id: z.string().uuid('Invalid medical record ID format'),
  prescription_id: z.string().uuid('Invalid prescription ID format').optional(),
  order_date: z.string().datetime('Invalid order date format'),
  priority: z.nativeEnum(LAB_PRIORITY, {
    message: 'Invalid priority value',
  }),
  category: z.nativeEnum(LAB_CATEGORY, {
    message: 'Invalid category value',
  }),
  department: z.string().min(1, 'Department is required'),
  clinical_notes: z.string().optional(),
  diagnosis: z.string().optional(),
  reason_for_test: z.string().optional(),
  internal_notes: z.string().optional(),
  expected_completion_date: z.string().datetime('Invalid expected completion date format').optional(),
  specimen: z.object({
    specimen_type: z.nativeEnum(SPECIMEN_TYPE, {
      message: 'Invalid specimen type',
    }),
    collection_time: z.string().datetime('Invalid collection time format').optional(),
    collected_by: z.string().uuid('Invalid collected by ID format').optional(),
    container_type: z.string().optional(),
    specimen_status: z.nativeEnum(SPECIMEN_STATUS, {
      message: 'Invalid specimen status',
    }).optional(),
    storage_temperature: z.number().optional(),
    transport_status: z.string().optional(),
    barcode: z.string().optional(),
    notes: z.string().optional(),
  }),
  tests: z.array(z.object({
    test_id: z.string().uuid('Invalid test ID format'),
    test_name: z.string().min(1, 'Test name is required'),
    test_code: z.string().optional(),
    category: z.nativeEnum(LAB_CATEGORY, {
      message: 'Invalid test category',
    }),
    department: z.string().min(1, 'Department is required'),
    cpt_code: z.string().optional(),
    loinc_code: z.string().optional(),
    specimen_type: z.nativeEnum(SPECIMEN_TYPE, {
      message: 'Invalid specimen type',
    }),
    instructions: z.string().optional(),
    fasting_required: z.boolean().optional(),
    sample_volume: z.string().optional(),
  })).min(1, 'At least one test is required'),
  imaging: z.object({
    imaging_type: z.nativeEnum(IMAGING_TYPE, {
      message: 'Invalid imaging type',
    }),
    study_uid: z.string().optional(),
    series_uid: z.string().optional(),
    image_count: z.number().int().optional(),
    radiologist_notes: z.string().optional(),
    findings: z.string().optional(),
    impression: z.string().optional(),
    comparison: z.string().optional(),
    technique: z.string().optional(),
    performed_by: z.string().uuid('Invalid performed by ID format').optional(),
    performed_at: z.string().datetime('Invalid performed at format').optional(),
    reviewed_by: z.string().uuid('Invalid reviewed by ID format').optional(),
    reviewed_at: z.string().datetime('Invalid reviewed at format').optional(),
    approved_by: z.string().uuid('Invalid approved by ID format').optional(),
    approved_at: z.string().datetime('Invalid approved at format').optional(),
  }).optional(),
});

/**
 * Zod schema for updating a laboratory order
 */
export const updateLabOrderSchema = z.object({
  priority: z.nativeEnum(LAB_PRIORITY, {
    message: 'Invalid priority value',
  }).optional(),
  clinical_notes: z.string().optional(),
  diagnosis: z.string().optional(),
  reason_for_test: z.string().optional(),
  internal_notes: z.string().optional(),
  expected_completion_date: z.string().datetime('Invalid expected completion date format').optional(),
  specimen: z.object({
    specimen_type: z.nativeEnum(SPECIMEN_TYPE, {
      message: 'Invalid specimen type',
    }).optional(),
    collection_time: z.string().datetime('Invalid collection time format').optional(),
    collected_by: z.string().uuid('Invalid collected by ID format').optional(),
    container_type: z.string().optional(),
    specimen_status: z.nativeEnum(SPECIMEN_STATUS, {
      message: 'Invalid specimen status',
    }).optional(),
    storage_temperature: z.number().optional(),
    transport_status: z.string().optional(),
    barcode: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  tests: z.array(z.object({
    test_id: z.string().uuid('Invalid test ID format'),
    test_name: z.string().min(1, 'Test name is required'),
    test_code: z.string().optional(),
    category: z.nativeEnum(LAB_CATEGORY, {
      message: 'Invalid test category',
    }),
    department: z.string().min(1, 'Department is required'),
    cpt_code: z.string().optional(),
    loinc_code: z.string().optional(),
    specimen_type: z.nativeEnum(SPECIMEN_TYPE, {
      message: 'Invalid specimen type',
    }),
    instructions: z.string().optional(),
    fasting_required: z.boolean().optional(),
    sample_volume: z.string().optional(),
  })).optional(),
  results: z.array(z.object({
    test_id: z.string().uuid('Invalid test ID format'),
    test_name: z.string().min(1, 'Test name is required'),
    result_type: z.nativeEnum(RESULT_TYPE, {
      message: 'Invalid result type',
    }),
    result_value: z.union([z.string(), z.number(), z.boolean()]),
    unit: z.string().optional(),
    reference_range: z.string().optional(),
    reference_low: z.number().optional(),
    reference_high: z.number().optional(),
    result_flag: z.nativeEnum(RESULT_FLAG, {
      message: 'Invalid result flag',
    }).optional(),
    is_abnormal: z.boolean().optional(),
    is_critical: z.boolean().optional(),
    verified: z.boolean().optional(),
    calculated: z.boolean().optional(),
    manual: z.boolean().optional(),
    automatic: z.boolean().optional(),
    notes: z.string().optional(),
    performed_by: z.string().uuid('Invalid performed by ID format').optional(),
    performed_at: z.string().datetime('Invalid performed at format').optional(),
  })).optional(),
  imaging: z.object({
    imaging_type: z.nativeEnum(IMAGING_TYPE, {
      message: 'Invalid imaging type',
    }).optional(),
    study_uid: z.string().optional(),
    series_uid: z.string().optional(),
    image_count: z.number().int().optional(),
    radiologist_notes: z.string().optional(),
    findings: z.string().optional(),
    impression: z.string().optional(),
    comparison: z.string().optional(),
    technique: z.string().optional(),
    performed_by: z.string().uuid('Invalid performed by ID format').optional(),
    performed_at: z.string().datetime('Invalid performed at format').optional(),
    reviewed_by: z.string().uuid('Invalid reviewed by ID format').optional(),
    reviewed_at: z.string().datetime('Invalid reviewed at format').optional(),
    approved_by: z.string().uuid('Invalid approved by ID format').optional(),
    approved_at: z.string().datetime('Invalid approved at format').optional(),
  }).optional(),
});

/**
 * Zod schema for creating a laboratory catalog entry
 */
export const createLabCatalogSchema = z.object({
  test_name: z.string().min(1, 'Test name is required'),
  test_code: z.string().optional(),
  category: z.nativeEnum(LAB_CATEGORY, {
    message: 'Invalid category value',
  }),
  department: z.string().min(1, 'Department is required'),
  specimen_type: z.nativeEnum(SPECIMEN_TYPE, {
    message: 'Invalid specimen type',
  }),
  cpt_code: z.string().optional(),
  loinc_code: z.string().optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  fasting_required: z.boolean().optional(),
  sample_volume: z.string().optional(),
  turnaround_time: z.string().optional(),
  price: z.number().positive('Price must be positive').optional(),
});

/**
 * Zod schema for creating a laboratory panel
 */
export const createLabPanelSchema = z.object({
  panel_name: z.string().min(1, 'Panel name is required'),
  panel_code: z.string().optional(),
  category: z.nativeEnum(LAB_CATEGORY, {
    message: 'Invalid category value',
  }),
  description: z.string().optional(),
  tests: z.array(z.object({
    test_id: z.string().uuid('Invalid test ID format'),
    test_name: z.string().min(1, 'Test name is required'),
    test_code: z.string().optional(),
    category: z.nativeEnum(LAB_CATEGORY, {
      message: 'Invalid test category',
    }),
    department: z.string().min(1, 'Department is required'),
    cpt_code: z.string().optional(),
    loinc_code: z.string().optional(),
    specimen_type: z.nativeEnum(SPECIMEN_TYPE, {
      message: 'Invalid specimen type',
    }),
    instructions: z.string().optional(),
    fasting_required: z.boolean().optional(),
    sample_volume: z.string().optional(),
  })).min(1, 'At least one test is required'),
  price: z.number().positive('Price must be positive').optional(),
});

/**
 * Validate UUID format
 */
export function validateUUID(id: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    throw new Error('Invalid UUID format');
  }
  return id;
}

/**
 * Validate lab order ID
 */
export function validateLabOrderId(id: string): string {
  return validateUUID(id);
}

/**
 * Validate laboratory order status transition
 */
export function validateStatusTransition(currentStatus: LabOrderStatus, newStatus: LabOrderStatus): void {
  const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
  
  if (!validTransitions.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
      `Valid transitions are: ${validTransitions.join(', ')}`
    );
  }
}

/**
 * Validate order date is not in the past
 */
export function validateOrderDateNotPast(orderDate: string): void {
  const orderDateTime = new Date(orderDate);
  const now = new Date();
  
  if (orderDateTime < now) {
    throw new Error('Order date cannot be in the past');
  }
}

/**
 * Validate expected completion date is after order date
 */
export function validateCompletionDateAfterOrderDate(orderDate: string, completionDate?: string): void {
  if (!completionDate) return;
  
  const orderDateTime = new Date(orderDate);
  const completionDateTime = new Date(completionDate);
  
  if (completionDateTime <= orderDateTime) {
    throw new Error('Expected completion date must be after order date');
  }
}

/**
 * Validate specimen type matches test requirements
 */
export function validateSpecimenType(specimenType: SpecimenType, requiredTypes: SpecimenType[]): void {
  if (!requiredTypes.includes(specimenType)) {
    throw new Error(
      `Specimen type ${specimenType} does not match required types: ${requiredTypes.join(', ')}`
    );
  }
}

/**
 * Validate result against reference range
 */
export function validateResultAgainstReferenceRange(
  resultValue: number,
  referenceLow?: number,
  referenceHigh?: number
): { isValid: boolean; flag?: ResultFlag } {
  if (referenceLow !== undefined && resultValue < referenceLow) {
    return { isValid: false, flag: 'abnormal_low' };
  }
  
  if (referenceHigh !== undefined && resultValue > referenceHigh) {
    return { isValid: false, flag: 'abnormal_high' };
  }
  
  return { isValid: true };
}

/**
 * Validate critical value
 */
export function validateCriticalValue(
  resultValue: number,
  criticalLow?: number,
  criticalHigh?: number
): { isCritical: boolean; flag?: ResultFlag } {
  if (criticalLow !== undefined && resultValue < criticalLow) {
    return { isCritical: true, flag: 'critical_low' };
  }
  
  if (criticalHigh !== undefined && resultValue > criticalHigh) {
    return { isCritical: true, flag: 'critical_high' };
  }
  
  return { isCritical: false };
}

/**
 * Validate lab order can be cancelled
 */
export function validateCanCancelLabOrder(status: LabOrderStatus): void {
  const cancellableStatuses: LabOrderStatus[] = [
    'ordered',
    'scheduled',
    'sample_collected',
    'received',
    'in_progress',
    'result_ready',
    'reviewed',
  ];
  
  if (!cancellableStatuses.includes(status)) {
    throw new Error(`Cannot cancel lab order with status: ${status}`);
  }
}

/**
 * Validate lab order can be archived
 */
export function validateCanArchiveLabOrder(status: LabOrderStatus): void {
  const archivableStatuses: LabOrderStatus[] = [
    'completed',
    'cancelled',
    'rejected',
    'expired',
  ];
  
  if (!archivableStatuses.includes(status)) {
    throw new Error(`Cannot archive lab order with status: ${status}`);
  }
}

/**
 * Validate lab order can be reviewed
 */
export function validateCanReviewLabOrder(status: LabOrderStatus): void {
  if (status !== 'result_ready') {
    throw new Error(`Cannot review lab order with status: ${status}`);
  }
}

/**
 * Validate lab order can be approved
 */
export function validateCanApproveLabOrder(status: LabOrderStatus): void {
  if (status !== 'reviewed') {
    throw new Error(`Cannot approve lab order with status: ${status}`);
  }
}

/**
 * Validate lab order can have sample collected
 */
export function validateCanCollectSample(status: LabOrderStatus): void {
  const collectableStatuses: LabOrderStatus[] = ['ordered', 'scheduled'];
  
  if (!collectableStatuses.includes(status)) {
    throw new Error(`Cannot collect sample for lab order with status: ${status}`);
  }
}

/**
 * Validate lab order can start processing
 */
export function validateCanStartProcessing(status: LabOrderStatus): void {
  if (status !== 'received') {
    throw new Error(`Cannot start processing lab order with status: ${status}`);
  }
}

/**
 * Validate lab order can be completed
 */
export function validateCanCompleteLabOrder(status: LabOrderStatus): void {
  if (status !== 'approved') {
    throw new Error(`Cannot complete lab order with status: ${status}`);
  }
}

/**
 * Validate fasting requirement
 */
export function validateFastingRequirement(fastingRequired: boolean, lastMealTime?: string): void {
  if (fastingRequired && lastMealTime) {
    const lastMeal = new Date(lastMealTime);
    const now = new Date();
    const hoursSinceMeal = (now.getTime() - lastMeal.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceMeal < 8) {
      throw new Error('Patient must fast for at least 8 hours before this test');
    }
  }
}

/**
 * Validate specimen integrity
 */
export function validateSpecimenIntegrity(specimenStatus: SpecimenStatus, collectionTime?: string): void {
  if (specimenStatus === 'collected' && collectionTime) {
    const collection = new Date(collectionTime);
    const now = new Date();
    const hoursSinceCollection = (now.getTime() - collection.getTime()) / (1000 * 60 * 60);
    
    // Most specimens expire after 24 hours
    if (hoursSinceCollection > 24) {
      throw new Error('Specimen has expired and cannot be processed');
    }
  }
}
