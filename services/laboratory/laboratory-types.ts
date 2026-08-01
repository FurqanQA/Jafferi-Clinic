/**
 * Laboratory Order Status
 * Represents the workflow status of a laboratory order
 */
export const LAB_ORDER_STATUS = {
  ORDERED: 'ordered',
  SCHEDULED: 'scheduled',
  SAMPLE_COLLECTED: 'sample_collected',
  RECEIVED: 'received',
  IN_PROGRESS: 'in_progress',
  RESULT_READY: 'result_ready',
  REVIEWED: 'reviewed',
  APPROVED: 'approved',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  ARCHIVED: 'archived',
} as const;

export type LabOrderStatus = typeof LAB_ORDER_STATUS[keyof typeof LAB_ORDER_STATUS];

/**
 * Valid status transitions for laboratory orders
 */
export const VALID_STATUS_TRANSITIONS: Record<LabOrderStatus, LabOrderStatus[]> = {
  ordered: ['scheduled', 'sample_collected', 'cancelled', 'expired'],
  scheduled: ['sample_collected', 'cancelled', 'expired'],
  sample_collected: ['received', 'rejected', 'cancelled'],
  received: ['in_progress', 'rejected', 'cancelled'],
  in_progress: ['result_ready', 'rejected', 'cancelled'],
  result_ready: ['reviewed', 'cancelled'],
  reviewed: ['approved', 'cancelled'],
  approved: ['completed'],
  completed: ['archived'],
  cancelled: ['archived'],
  rejected: ['archived'],
  expired: ['archived'],
  archived: [],
};

/**
 * Laboratory Order Priority
 */
export const LAB_PRIORITY = {
  ROUTINE: 'routine',
  URGENT: 'urgent',
  EMERGENCY: 'emergency',
  STAT: 'stat',
} as const;

export type LabPriority = typeof LAB_PRIORITY[keyof typeof LAB_PRIORITY];

/**
 * Laboratory Categories
 */
export const LAB_CATEGORY = {
  BLOOD_TESTS: 'blood_tests',
  URINE_TESTS: 'urine_tests',
  STOOL_TESTS: 'stool_tests',
  CULTURE_TESTS: 'culture_tests',
  BIOCHEMISTRY: 'biochemistry',
  MICROBIOLOGY: 'microbiology',
  PATHOLOGY: 'pathology',
  IMMUNOLOGY: 'immunology',
  VIROLOGY: 'virology',
  HORMONE_TESTS: 'hormone_tests',
  CARDIOLOGY_TESTS: 'cardiology_tests',
  GENETIC_TESTS: 'genetic_tests',
  COVID_TESTS: 'covid_tests',
  CUSTOM_TESTS: 'custom_tests',
} as const;

export type LabCategory = typeof LAB_CATEGORY[keyof typeof LAB_CATEGORY];

/**
 * Diagnostic Imaging Types
 */
export const IMAGING_TYPE = {
  X_RAY: 'x_ray',
  CT_SCAN: 'ct_scan',
  MRI: 'mri',
  ULTRASOUND: 'ultrasound',
  ECG: 'ecg',
  ECHO: 'echo',
  MAMMOGRAPHY: 'mammography',
  DEXA_SCAN: 'dexa_scan',
  PET_SCAN: 'pet_scan',
  ENDOSCOPY: 'endoscopy',
  COLONOSCOPY: 'colonoscopy',
  BRONCHOSCOPY: 'bronchoscopy',
  DENTAL_X_RAY: 'dental_x_ray',
  CUSTOM_IMAGING: 'custom_imaging',
} as const;

export type ImagingType = typeof IMAGING_TYPE[keyof typeof IMAGING_TYPE];

/**
 * Specimen Types
 */
export const SPECIMEN_TYPE = {
  BLOOD: 'blood',
  SERUM: 'serum',
  PLASMA: 'plasma',
  URINE: 'urine',
  SALIVA: 'saliva',
  STOOL: 'stool',
  SPUTUM: 'sputum',
  TISSUE: 'tissue',
  SWAB: 'swab',
  CSF: 'csf',
  BIOPSY: 'biopsy',
  OTHER: 'other',
} as const;

export type SpecimenType = typeof SPECIMEN_TYPE[keyof typeof SPECIMEN_TYPE];

/**
 * Specimen Status
 */
export const SPECIMEN_STATUS = {
  PENDING: 'pending',
  COLLECTED: 'collected',
  RECEIVED: 'received',
  PROCESSED: 'processed',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

export type SpecimenStatus = typeof SPECIMEN_STATUS[keyof typeof SPECIMEN_STATUS];

/**
 * Result Types
 */
export const RESULT_TYPE = {
  NUMERIC: 'numeric',
  DECIMAL: 'decimal',
  BOOLEAN: 'boolean',
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  TEXT: 'text',
} as const;

export type ResultType = typeof RESULT_TYPE[keyof typeof RESULT_TYPE];

/**
 * Result Flags
 */
export const RESULT_FLAG = {
  NORMAL: 'normal',
  ABNORMAL_HIGH: 'abnormal_high',
  ABNORMAL_LOW: 'abnormal_low',
  CRITICAL_HIGH: 'critical_high',
  CRITICAL_LOW: 'critical_low',
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
} as const;

export type ResultFlag = typeof RESULT_FLAG[keyof typeof RESULT_FLAG];

/**
 * Reference Range Types
 */
export const REFERENCE_RANGE_TYPE = {
  ADULT: 'adult',
  CHILD: 'child',
  NEONATE: 'neonate',
  PREGNANCY: 'pregnancy',
  CUSTOM: 'custom',
} as const;

export type ReferenceRangeType = typeof REFERENCE_RANGE_TYPE[keyof typeof REFERENCE_RANGE_TYPE];

/**
 * Laboratory Order Interface
 */
export interface LabOrder {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string;
  medical_record_id: string;
  prescription_id?: string;
  order_number: string;
  order_date: string;
  priority: LabPriority;
  status: LabOrderStatus;
  category: LabCategory;
  department: string;
  clinical_notes?: string;
  diagnosis?: string;
  reason_for_test?: string;
  internal_notes?: string;
  urgency: LabPriority;
  expected_completion_date?: string;
  collection_date?: string;
  completion_date?: string;
  specimen?: Specimen;
  tests: LabTest[];
  results?: LabResult[];
  attachments?: LabAttachment[];
  imaging?: DiagnosticImaging;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  approved_at?: string;
  version_number: number;
  is_active: boolean;
  deleted_at?: string;
}

/**
 * Specimen Interface
 */
export interface Specimen {
  specimen_type: SpecimenType;
  collection_time?: string;
  collected_by?: string;
  container_type?: string;
  specimen_status: SpecimenStatus;
  storage_temperature?: number;
  transport_status?: string;
  barcode?: string;
  notes?: string;
}

/**
 * Lab Test Interface
 */
export interface LabTest {
  test_id: string;
  test_name: string;
  test_code?: string;
  category: LabCategory;
  department: string;
  cpt_code?: string;
  loinc_code?: string;
  specimen_type: SpecimenType;
  instructions?: string;
  fasting_required?: boolean;
  sample_volume?: string;
}

/**
 * Lab Result Interface
 */
export interface LabResult {
  test_id: string;
  test_name: string;
  result_type: ResultType;
  result_value: string | number | boolean;
  unit?: string;
  reference_range?: string;
  reference_low?: number;
  reference_high?: number;
  result_flag?: ResultFlag;
  is_abnormal?: boolean;
  is_critical?: boolean;
  verified?: boolean;
  calculated?: boolean;
  manual?: boolean;
  automatic?: boolean;
  notes?: string;
  performed_by?: string;
  performed_at?: string;
}

/**
 * Reference Range Interface
 */
export interface ReferenceRange {
  test_id: string;
  range_type: ReferenceRangeType;
  gender?: 'male' | 'female';
  age_min?: number;
  age_max?: number;
  normal_low?: number;
  normal_high?: number;
  critical_low?: number;
  critical_high?: number;
  unit?: string;
  notes?: string;
}

/**
 * Diagnostic Imaging Interface
 */
export interface DiagnosticImaging {
  imaging_type: ImagingType;
  study_uid?: string;
  series_uid?: string;
  image_count?: number;
  radiologist_notes?: string;
  findings?: string;
  impression?: string;
  comparison?: string;
  technique?: string;
  performed_by?: string;
  performed_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approved_by?: string;
  approved_at?: string;
}

/**
 * Lab Attachment Interface
 */
export interface LabAttachment {
  id: string;
  lab_order_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  attachment_type: 'pdf' | 'image' | 'scanned_report' | 'radiology_report' | 'lab_report' | 'dicom';
  uploaded_by: string;
  uploaded_at: string;
  description?: string;
}

/**
 * Result Review Interface
 */
export interface ResultReview {
  reviewed_by: string;
  reviewed_at: string;
  approved_by?: string;
  approved_at?: string;
  review_notes?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  electronic_signature?: string;
}

/**
 * Critical Value Alert Interface
 */
export interface CriticalValueAlert {
  lab_order_id: string;
  test_id: string;
  test_name: string;
  result_value: string | number;
  critical_type: 'critical_high' | 'critical_low' | 'positive_infectious' | 'emergency_finding';
  alert_time: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  notification_sent?: boolean;
  notes?: string;
}

/**
 * Laboratory Catalog Entry Interface
 */
export interface LabCatalogEntry {
  id: string;
  clinic_id: string;
  test_name: string;
  test_code?: string;
  category: LabCategory;
  department: string;
  specimen_type: SpecimenType;
  cpt_code?: string;
  loinc_code?: string;
  description?: string;
  instructions?: string;
  fasting_required?: boolean;
  sample_volume?: string;
  turnaround_time?: string;
  price?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Laboratory Panel Interface
 */
export interface LabPanel {
  id: string;
  clinic_id: string;
  panel_name: string;
  panel_code?: string;
  category: LabCategory;
  description?: string;
  tests: LabTest[];
  price?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Laboratory Order Filters
 */
export interface LabOrderFilters {
  status?: LabOrderStatus;
  priority?: LabPriority;
  category?: LabCategory;
  doctor_id?: string;
  patient_id?: string;
  medical_record_id?: string;
  appointment_id?: string;
  prescription_id?: string;
  specimen_type?: SpecimenType;
  department?: string;
  date_from?: string;
  date_to?: string;
  collection_date_from?: string;
  collection_date_to?: string;
  completion_date_from?: string;
  completion_date_to?: string;
  today?: boolean;
  this_week?: boolean;
  this_month?: boolean;
}

/**
 * Laboratory Search Parameters
 */
export interface LabSearchParams {
  query?: string;
  filters?: LabOrderFilters;
  sortBy?: LabSortBy;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Laboratory Sort By Options
 */
export type LabSortBy =
  | 'order_date'
  | 'order_number'
  | 'priority'
  | 'status'
  | 'completion_date'
  | 'patient_name'
  | 'doctor_name'
  | 'category';

/**
 * Create Lab Order Input
 */
export interface CreateLabOrderInput {
  patient_id: string;
  doctor_id: string;
  appointment_id: string;
  medical_record_id: string;
  prescription_id?: string;
  order_date: string;
  priority: LabPriority;
  category: LabCategory;
  department: string;
  clinical_notes?: string;
  diagnosis?: string;
  reason_for_test?: string;
  internal_notes?: string;
  expected_completion_date?: string;
  specimen: Specimen;
  tests: LabTest[];
  imaging?: DiagnosticImaging;
}

/**
 * Update Lab Order Input
 */
export interface UpdateLabOrderInput {
  priority?: LabPriority;
  clinical_notes?: string;
  diagnosis?: string;
  reason_for_test?: string;
  internal_notes?: string;
  expected_completion_date?: string;
  specimen?: Partial<Specimen>;
  tests?: LabTest[];
  results?: LabResult[];
  imaging?: Partial<DiagnosticImaging>;
}

/**
 * Lab Order Export Data
 */
export interface LabOrderExportData {
  order_number: string;
  patient_name: string;
  doctor_name: string;
  order_date: string;
  category: string;
  status: string;
  priority: string;
  test_count: number;
  completion_date?: string;
  created_at: string;
}

/**
 * Printable Lab Report
 */
export interface PrintableLabReport {
  order_number: string;
  order_date: string;
  collection_date?: string;
  completion_date?: string;
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  doctor_name: string;
  doctor_license: string;
  doctor_signature?: string;
  patient_name: string;
  patient_age?: string;
  patient_gender?: string;
  category: string;
  department: string;
  specimen?: Specimen;
  tests: LabTest[];
  results: LabResult[];
  reference_ranges: ReferenceRange[];
  reviewed_by?: string;
  approved_by?: string;
  approval_date?: string;
  qr_code?: string;
}

/**
 * FHIR Observation Placeholder
 */
export interface FHIRObservation {
  resourceType: 'Observation';
  id?: string;
  status: string;
  code: {
    coding: Array<{ system?: string; code: string; display: string }>;
    text?: string;
  };
  subject: { reference: string };
  effectiveDateTime?: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
  referenceRange?: Array<{
    low?: { value: number; unit: string; system?: string; code?: string };
    high?: { value: number; unit: string; system?: string; code?: string };
    text?: string;
  }>;
  interpretation?: Array<{ coding: Array<{ system?: string; code: string; display: string }> }>;
}

/**
 * FHIR DiagnosticReport Placeholder
 */
export interface FHIRDiagnosticReport {
  resourceType: 'DiagnosticReport';
  id?: string;
  status: string;
  code: {
    coding: Array<{ system?: string; code: string; display: string }>;
    text?: string;
  };
  subject: { reference: string };
  encounter?: { reference: string };
  effectiveDateTime?: string;
  issued?: string;
  performer?: Array<{ reference: string; display?: string }>;
  resultsInterpreter?: Array<{ reference: string; display?: string }>;
  conclusion?: string;
  conclusionCode?: Array<{ coding: Array<{ system?: string; code: string; display: string }> }>;
  presentedForm?: Array<{ contentType: string; url: string; title?: string }>;
}

/**
 * FHIR ServiceRequest Placeholder
 */
export interface FHIRServiceRequest {
  resourceType: 'ServiceRequest';
  id?: string;
  status: string;
  intent: string;
  code: {
    coding: Array<{ system?: string; code: string; display: string }>;
    text?: string;
  };
  subject: { reference: string };
  encounter?: { reference: string };
  authoredOn?: string;
  requester?: { reference: string; display?: string };
  specimen?: Array<{ reference: string; display?: string }>;
  note?: Array<{ authorReference?: { reference: string }; text?: string; time?: string }>;
}

/**
 * HL7 ORU-R01 Placeholder
 */
export interface HL7ORUMessage {
  messageType: 'ORU^R01';
  messageTimestamp: string;
  sendingApplication: string;
  sendingFacility: string;
  receivingApplication: string;
  receivingFacility: string;
  patient: {
    id: string;
    name: string;
    dateOfBirth: string;
    sex: string;
  };
  order: {
    placerOrderNumber: string;
    fillerOrderNumber: string;
    universalServiceId: string;
    orderDateTime: string;
  };
  observation: Array<{
    sequenceNumber: string;
    universalServiceId: string;
    observationDateTime: string;
    observationValue?: string;
    units?: string;
    abnormalFlags?: string;
    resultStatus: string;
  }>;
}

/**
 * AI Result Interpretation Placeholder
 */
export interface AIResultInterpretation {
  lab_order_id: string;
  test_id: string;
  interpretation: string;
  confidence: number;
  suggestions: string[];
  requires_review: boolean;
  generated_at: string;
}

/**
 * AI Radiology Analysis Placeholder
 */
export interface AIRadiologyAnalysis {
  imaging_id: string;
  findings: string[];
  impression: string;
  confidence: number;
  recommendations: string[];
  requires_review: boolean;
  generated_at: string;
}

/**
 * AI Abnormal Result Detection Placeholder
 */
export interface AIAbnormalDetection {
  lab_order_id: string;
  test_id: string;
  detected_anomalies: Array<{
    type: string;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    description: string;
    confidence: number;
  }>;
  pattern_analysis?: string;
  requires_immediate_attention: boolean;
  generated_at: string;
}

/**
 * AI Trend Analysis Placeholder
 */
export interface AITrendAnalysis {
  patient_id: string;
  test_id: string;
  trend: 'improving' | 'stable' | 'worsening' | 'fluctuating';
  trend_description: string;
  historical_data: Array<{
    date: string;
    value: number;
    reference_range: string;
  }>;
  predictions?: Array<{
    date: string;
    predicted_value: number;
    confidence: number;
  }>;
  recommendations: string[];
  generated_at: string;
}

/**
 * AI Clinical Recommendations Placeholder
 */
export interface AIClinicalRecommendations {
  lab_order_id: string;
  recommendations: Array<{
    type: 'follow_up' | 'medication' | 'lifestyle' | 'referral' | 'additional_testing';
    priority: 'low' | 'moderate' | 'high' | 'urgent';
    description: string;
    rationale: string;
  }>;
  generated_at: string;
}

/**
 * AI Risk Prediction Placeholder
 */
export interface AIRiskPrediction {
  patient_id: string;
  risk_category: 'low' | 'moderate' | 'high' | 'critical';
  risk_factors: Array<{
    factor: string;
    contribution: number;
    description: string;
  }>;
  predicted_outcomes: Array<{
    condition: string;
    probability: number;
    timeframe: string;
  }>;
  preventive_measures: string[];
  generated_at: string;
}

/**
 * AI Critical Alert Suggestions Placeholder
 */
export interface AICriticalAlertSuggestions {
  lab_order_id: string;
  test_id: string;
  critical_value: string | number;
  alert_level: 'low' | 'moderate' | 'high' | 'critical';
  suggested_actions: Array<{
    action: string;
    urgency: string;
    description: string;
  }>;
  notification_recipients: Array<{
    role: string;
    contact_method: string;
  }>;
  generated_at: string;
}
