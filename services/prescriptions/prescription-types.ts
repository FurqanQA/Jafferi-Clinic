/**
 * Prescription Status Enum
 */
export const PrescriptionStatus = {
  draft: 'draft',
  prepared: 'prepared',
  reviewed: 'reviewed',
  signed: 'signed',
  dispensed: 'dispensed',
  completed: 'completed',
  cancelled: 'cancelled',
  expired: 'expired',
  archived: 'archived',
} as const;

export type PrescriptionStatus = typeof PrescriptionStatus[keyof typeof PrescriptionStatus];

/**
 * Valid status transitions
 */
export const VALID_STATUS_TRANSITIONS: Record<PrescriptionStatus, PrescriptionStatus[]> = {
  draft: ['prepared', 'cancelled'],
  prepared: ['reviewed', 'cancelled'],
  reviewed: ['signed', 'cancelled'],
  signed: ['dispensed', 'cancelled'],
  dispensed: ['completed', 'cancelled'],
  completed: ['archived'],
  cancelled: ['archived'],
  expired: ['archived'],
  archived: [],
};

/**
 * Prescription Priority Enum
 */
export const PrescriptionPriority = {
  routine: 'routine',
  urgent: 'urgent',
  emergency: 'emergency',
} as const;

export type PrescriptionPriority = typeof PrescriptionPriority[keyof typeof PrescriptionPriority];

/**
 * Dosage Form Enum
 */
export const DosageForm = {
  tablet: 'tablet',
  capsule: 'capsule',
  syrup: 'syrup',
  injection: 'injection',
  cream: 'cream',
  ointment: 'ointment',
  drops: 'drops',
  inhaler: 'inhaler',
  patch: 'patch',
  suppository: 'suppository',
  powder: 'powder',
  solution: 'solution',
  suspension: 'suspension',
  gel: 'gel',
  spray: 'spray',
  lozenge: 'lozenge',
} as const;

export type DosageForm = typeof DosageForm[keyof typeof DosageForm];

/**
 * Route of Administration Enum
 */
export const Route = {
  oral: 'oral',
  intravenous: 'intravenous',
  intramuscular: 'intramuscular',
  subcutaneous: 'subcutaneous',
  topical: 'topical',
  inhalation: 'inhalation',
  nasal: 'nasal',
  ophthalmic: 'ophthalmic',
  otic: 'otic',
  rectal: 'rectal',
  vaginal: 'vaginal',
  sublingual: 'sublingual',
  buccal: 'buccal',
  transdermal: 'transdermal',
} as const;

export type Route = typeof Route[keyof typeof Route];

/**
 * Frequency Enum
 */
export const Frequency = {
  once: 'once',
  daily: 'daily',
  twice_daily: 'twice_daily',
  three_times_daily: 'three_times_daily',
  four_times_daily: 'four_times_daily',
  every_8_hours: 'every_8_hours',
  every_6_hours: 'every_6_hours',
  every_4_hours: 'every_4_hours',
  weekly: 'weekly',
  biweekly: 'biweekly',
  monthly: 'monthly',
  as_needed: 'as_needed',
  before_meals: 'before_meals',
  after_meals: 'after_meals',
  with_meals: 'with_meals',
  at_bedtime: 'at_bedtime',
} as const;

export type Frequency = typeof Frequency[keyof typeof Frequency];

/**
 * Interaction Severity Enum
 */
export const InteractionSeverity = {
  low: 'low',
  moderate: 'moderate',
  high: 'high',
  critical: 'critical',
} as const;

export type InteractionSeverity = typeof InteractionSeverity[keyof typeof InteractionSeverity];

/**
 * Interaction Type Enum
 */
export const InteractionType = {
  drug_drug: 'drug_drug',
  drug_allergy: 'drug_allergy',
  drug_food: 'drug_food',
  drug_disease: 'drug_disease',
} as const;

export type InteractionType = typeof InteractionType[keyof typeof InteractionType];

/**
 * Medicine Information
 */
export interface Medicine {
  medicine_name: string;
  generic_name?: string;
  brand_name?: string;
  strength?: string;
  dosage_form: DosageForm;
  route: Route;
  dose: string;
  frequency: Frequency;
  duration: string;
  quantity: number;
  instructions?: string;
  morning?: boolean;
  afternoon?: boolean;
  evening?: boolean;
  night?: boolean;
  before_food?: boolean;
  after_food?: boolean;
  with_food?: boolean;
  as_needed?: boolean;
  max_daily_dose?: string;
}

/**
 * Prescription Main Entity
 */
export interface Prescription {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string;
  medical_record_id: string;
  prescription_number: string;
  prescription_date: string;
  issue_date: string;
  expiry_date: string;
  status: PrescriptionStatus;
  priority: PrescriptionPriority;
  medicines: Medicine[];
  notes?: string;
  instructions?: string;
  internal_notes?: string;
  follow_up_required: boolean;
  refill_allowed: boolean;
  refill_count: number;
  refill_remaining: number;
  digital_signature?: string;
  created_by: string;
  updated_by: string;
  signed_by?: string;
  completed_by?: string;
  created_at: string;
  updated_at: string;
  signed_at?: string;
  completed_at?: string;
  version_number: number;
  is_active: boolean;
  deleted_at?: string;
}

/**
 * Create Prescription Input
 */
export interface CreatePrescriptionInput {
  patient_id: string;
  doctor_id: string;
  appointment_id: string;
  medical_record_id: string;
  prescription_date: string;
  issue_date: string;
  expiry_date: string;
  priority?: PrescriptionPriority;
  medicines: Medicine[];
  notes?: string;
  instructions?: string;
  internal_notes?: string;
  follow_up_required?: boolean;
  refill_allowed?: boolean;
  refill_count?: number;
}

/**
 * Update Prescription Input
 */
export interface UpdatePrescriptionInput {
  prescription_date?: string;
  issue_date?: string;
  expiry_date?: string;
  priority?: PrescriptionPriority;
  medicines?: Medicine[];
  notes?: string;
  instructions?: string;
  internal_notes?: string;
  follow_up_required?: boolean;
  refill_allowed?: boolean;
  refill_count?: number;
}

/**
 * Prescription Filters
 */
export interface PrescriptionFilters {
  status?: PrescriptionStatus;
  priority?: PrescriptionPriority;
  doctor_id?: string;
  patient_id?: string;
  medical_record_id?: string;
  appointment_id?: string;
  medicine_name?: string;
  date_from?: string;
  date_to?: string;
  expiry_from?: string;
  expiry_to?: string;
  today?: boolean;
  this_week?: boolean;
  this_month?: boolean;
  refill_allowed?: boolean;
  follow_up_required?: boolean;
}

/**
 * Prescription Sort By Options
 */
export type PrescriptionSortBy =
  | 'prescription_date'
  | 'issue_date'
  | 'expiry_date'
  | 'prescription_number'
  | 'created_at'
  | 'updated_at'
  | 'patient_name'
  | 'doctor_name';

/**
 * Prescription Search Params
 */
export interface PrescriptionSearchParams {
  query?: string;
  filters?: PrescriptionFilters;
  sortBy?: PrescriptionSortBy;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Prescription Search Result
 */
export interface PrescriptionSearchResult {
  data: Prescription[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Medicine Catalog Entry
 */
export interface MedicineCatalogEntry {
  id: string;
  medicine_name: string;
  generic_name?: string;
  brand_name?: string;
  dosage_form: DosageForm;
  strength?: string;
  category?: string;
  manufacturer?: string;
  is_controlled: boolean;
  requires_prescription: boolean;
  description?: string;
  contraindications?: string[];
  side_effects?: string[];
  storage_conditions?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Drug Interaction
 */
export interface DrugInteraction {
  id: string;
  medicine_1: string;
  medicine_2: string;
  interaction_type: InteractionType;
  severity: InteractionSeverity;
  description: string;
  recommendation?: string;
}

/**
 * Allergy Information
 */
export interface AllergyInfo {
  id: string;
  patient_id: string;
  allergen: string;
  allergy_type: 'drug' | 'food' | 'environmental' | 'other';
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  reaction: string;
  onset_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Refill Information
 */
export interface RefillInfo {
  id: string;
  prescription_id: string;
  refill_number: number;
  refill_date: string;
  dispensed_by: string;
  notes?: string;
  created_at: string;
}

/**
 * Prescription Template
 */
export interface PrescriptionTemplate {
  id: string;
  clinic_id: string;
  name: string;
  description?: string;
  category?: string;
  medicines: Medicine[];
  instructions?: string;
  notes?: string;
  created_by: string;
  updated_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create Template Input
 */
export interface CreateTemplateInput {
  name: string;
  description?: string;
  category?: string;
  medicines: Medicine[];
  instructions?: string;
  notes?: string;
}

/**
 * Update Template Input
 */
export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  category?: string;
  medicines?: Medicine[];
  instructions?: string;
  notes?: string;
  is_active?: boolean;
}

/**
 * Dosage Calculation Result
 */
export interface DosageCalculation {
  daily_dose: number;
  total_quantity: number;
  duration_days: number;
  is_valid: boolean;
  errors?: string[];
}

/**
 * Medication Schedule
 */
export interface MedicationSchedule {
  medicine_name: string;
  schedule: Array<{
    time: string;
    dose: string;
    instructions?: string;
  }>;
  duration: string;
  start_date: string;
  end_date: string;
}

/**
 * Printable Prescription Data
 */
export interface PrintablePrescription {
  prescription_number: string;
  prescription_date: string;
  issue_date: string;
  expiry_date: string;
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string;
  doctor_name: string;
  doctor_license: string;
  doctor_signature?: string;
  patient_name: string;
  patient_age?: string;
  patient_gender?: string;
  patient_weight?: string;
  medicines: Array<{
    medicine_name: string;
    generic_name?: string;
    strength?: string;
    dosage_form: string;
    route: string;
    dose: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions?: string;
  }>;
  instructions?: string;
  notes?: string;
  follow_up_required: boolean;
  qr_code?: string;
}

/**
 * Prescription Export Data
 */
export interface PrescriptionExportData {
  prescription_number: string;
  patient_name: string;
  doctor_name: string;
  prescription_date: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  priority: string;
  medicine_count: number;
  refill_allowed: boolean;
  created_at: string;
}

/**
 * FHIR MedicationRequest Placeholder
 */
export interface FHIRMedicationRequest {
  resourceType: 'MedicationRequest';
  id?: string;
  status?: string;
  intent?: string;
  medicationReference?: {
    reference: string;
    display: string;
  };
  subject?: {
    reference: string;
    display: string;
  };
  requester?: {
    reference: string;
    display: string;
  };
  dosageInstruction?: Array<{
    text?: string;
    timing?: {
      repeat?: {
        frequency?: number;
        period?: number;
        periodUnit?: string;
      };
    };
    route?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    };
  }>;
}

/**
 * HL7 Pharmacy Message Placeholder
 */
export interface HL7PharmacyMessage {
  messageType: string;
  timestamp: string;
  messageControlId: string;
  processingId: string;
  versionId: string;
  segments: Array<{
    segmentId: string;
    fields: string[];
  }>;
}

/**
 * AI Prescription Suggestions Placeholder
 */
export interface AIPrescriptionSuggestion {
  suggested_medicines: Array<{
    medicine_name: string;
    reason: string;
    confidence: number;
  }>;
  alternative_treatments: string[];
  warnings: string[];
}

/**
 * AI Dose Recommendation Placeholder
 */
export interface AIDoseRecommendation {
  medicine_name: string;
  recommended_dose: string;
  recommended_frequency: string;
  recommended_duration: string;
  rationale: string;
  considerations: string[];
}
