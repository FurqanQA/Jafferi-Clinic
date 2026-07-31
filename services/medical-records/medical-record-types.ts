/**
 * Medical Record Status
 */
export const MedicalRecordStatus = {
  draft: 'draft',
  in_progress: 'in_progress',
  signed: 'signed',
  completed: 'completed',
  archived: 'archived',
  deleted: 'deleted',
} as const;

export type MedicalRecordStatus = typeof MedicalRecordStatus[keyof typeof MedicalRecordStatus];

/**
 * Valid status transitions for medical records
 */
export const VALID_MEDICAL_RECORD_STATUS_TRANSITIONS: Record<MedicalRecordStatus, MedicalRecordStatus[]> = {
  draft: ['in_progress', 'deleted'],
  in_progress: ['draft', 'signed', 'deleted'],
  signed: ['completed', 'archived'],
  completed: ['archived'],
  archived: [],
  deleted: [],
};

/**
 * Visit Type
 */
export const VisitType = {
  new_patient: 'new_patient',
  follow_up: 'follow_up',
  emergency: 'emergency',
  routine: 'routine',
  consultation: 'consultation',
  procedure: 'procedure',
} as const;

export type VisitType = typeof VisitType[keyof typeof VisitType];

/**
 * Severity Level
 */
export const SeverityLevel = {
  mild: 'mild',
  moderate: 'moderate',
  severe: 'severe',
  critical: 'critical',
} as const;

export type SeverityLevel = typeof SeverityLevel[keyof typeof SeverityLevel];

/**
 * Diagnosis Status
 */
export const DiagnosisStatus = {
  acute: 'acute',
  chronic: 'chronic',
  resolved: 'resolved',
  confirmed: 'confirmed',
  provisional: 'provisional',
} as const;

export type DiagnosisStatus = typeof DiagnosisStatus[keyof typeof DiagnosisStatus];

/**
 * BMI Category
 */
export const BMICategory = {
  underweight: 'underweight',
  normal: 'normal',
  overweight: 'overweight',
  obese: 'obese',
  severely_obese: 'severely_obese',
} as const;

export type BMICategory = typeof BMICategory[keyof typeof BMICategory];

/**
 * Pain Scale (0-10)
 */
export const PainScale = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
} as const;

export type PainScale = typeof PainScale[keyof typeof PainScale];

/**
 * Attachment Type
 */
export const AttachmentType = {
  image: 'image',
  pdf: 'pdf',
  lab_report: 'lab_report',
  mri: 'mri',
  ct_scan: 'ct_scan',
  ultrasound: 'ultrasound',
  prescription: 'prescription',
  referral_letter: 'referral_letter',
  document: 'document',
} as const;

export type AttachmentType = typeof AttachmentType[keyof typeof AttachmentType];

/**
 * Timeline Event Type
 */
export const TimelineEventType = {
  appointment: 'appointment',
  medical_record: 'medical_record',
  diagnosis: 'diagnosis',
  prescription: 'prescription',
  invoice: 'invoice',
  lab_report: 'lab_report',
  future_event: 'future_event',
} as const;

export type TimelineEventType = typeof TimelineEventType[keyof typeof TimelineEventType];

/**
 * Chief Complaint
 */
export interface ChiefComplaint {
  primary_complaint: string;
  duration?: string;
  severity?: SeverityLevel;
  location?: string;
  onset?: string;
  aggravating_factors?: string;
  relieving_factors?: string;
  associated_symptoms?: string;
}

/**
 * Medical History
 */
export interface MedicalHistory {
  history_of_present_illness?: string;
  past_medical_history?: string;
  past_surgical_history?: string;
  family_history?: string;
  social_history?: string;
  smoking_history?: string;
  alcohol_use?: string;
  drug_use?: string;
  occupation?: string;
  exercise?: string;
  diet?: string;
  known_allergies?: string[];
  current_medications?: string[];
}

/**
 * Vitals
 */
export interface Vitals {
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  bmi_category?: BMICategory;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  temperature_celsius?: number;
  oxygen_saturation?: number;
  blood_sugar?: number;
  pain_scale?: PainScale;
  waist_circumference?: number;
  head_circumference?: number;
}

/**
 * Physical Examination
 */
export interface PhysicalExamination {
  general_examination?: string;
  head?: string;
  eyes?: string;
  ent?: string;
  chest?: string;
  cardiovascular?: string;
  respiratory?: string;
  abdomen?: string;
  skin?: string;
  neurological?: string;
  musculoskeletal?: string;
  psychiatric?: string;
  additional_notes?: string;
}

/**
 * SOAP Notes
 */
export interface SOAPNotes {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

/**
 * Diagnosis
 */
export interface Diagnosis {
  primary_diagnosis?: string;
  secondary_diagnoses?: string[];
  differential_diagnosis?: string[];
  clinical_impression?: string;
  icd_10_code?: string;
  snomed_code?: string; // Placeholder for SNOMED integration
  status?: DiagnosisStatus;
}

/**
 * Treatment Plan
 */
export interface TreatmentPlan {
  medicines?: string[];
  procedures?: string[];
  laboratory_tests?: string[];
  radiology?: string[];
  lifestyle_advice?: string;
  diet_advice?: string;
  exercise_advice?: string;
  patient_instructions?: string;
}

/**
 * Follow-up
 */
export interface FollowUp {
  follow_up_required: boolean;
  follow_up_date?: string;
  follow_up_interval?: string;
  follow_up_reason?: string;
  next_department?: string;
  next_doctor?: string;
}

/**
 * Attachment
 */
export interface Attachment {
  id: string;
  medical_record_id: string;
  type: AttachmentType;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
  uploaded_at: string;
  description?: string;
}

/**
 * Medical Record
 */
export interface MedicalRecord {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  medical_record_number: string;
  status: MedicalRecordStatus;
  
  // Visit Information
  visit_date: string;
  visit_time?: string;
  visit_type: VisitType;
  department_id?: string;
  chief_complaint?: ChiefComplaint;
  reason_for_visit?: string;
  duration?: number;
  
  // Medical Information
  history?: MedicalHistory;
  vitals?: Vitals;
  physical_examination?: PhysicalExamination;
  soap_notes?: SOAPNotes;
  diagnosis?: Diagnosis;
  treatment_plan?: TreatmentPlan;
  follow_up?: FollowUp;
  
  // Audit Trail
  created_by: string;
  updated_by?: string;
  signed_by?: string;
  created_at: string;
  updated_at?: string;
  signed_at?: string;
  version_number: number;
  
  // Soft delete
  deleted_at?: string;
  is_active: boolean;
}

/**
 * Create Medical Record Input
 */
export interface CreateMedicalRecordInput {
  patient_id: string;
  doctor_id: string;
  appointment_id?: string;
  visit_date: string;
  visit_time?: string;
  visit_type: VisitType;
  department_id?: string;
  chief_complaint?: ChiefComplaint;
  reason_for_visit?: string;
  duration?: number;
  history?: MedicalHistory;
  vitals?: Vitals;
  physical_examination?: PhysicalExamination;
  soap_notes?: SOAPNotes;
  diagnosis?: Diagnosis;
  treatment_plan?: TreatmentPlan;
  follow_up?: FollowUp;
}

/**
 * Update Medical Record Input
 */
export interface UpdateMedicalRecordInput {
  visit_date?: string;
  visit_time?: string;
  visit_type?: VisitType;
  department_id?: string;
  chief_complaint?: Partial<ChiefComplaint>;
  reason_for_visit?: string;
  duration?: number;
  history?: Partial<MedicalHistory>;
  vitals?: Partial<Vitals>;
  physical_examination?: Partial<PhysicalExamination>;
  soap_notes?: Partial<SOAPNotes>;
  diagnosis?: Partial<Diagnosis>;
  treatment_plan?: Partial<TreatmentPlan>;
  follow_up?: Partial<FollowUp>;
}

/**
 * Medical Record Filters
 */
export interface MedicalRecordFilters {
  status?: MedicalRecordStatus;
  visit_type?: VisitType;
  doctor_id?: string;
  patient_id?: string;
  department_id?: string;
  appointment_id?: string;
  date_from?: string;
  date_to?: string;
  today?: boolean;
  this_week?: boolean;
  this_month?: boolean;
  diagnosis?: string;
}

/**
 * Medical Record Sort By
 */
export type MedicalRecordSortBy =
  | 'visit_date'
  | 'created_at'
  | 'updated_at'
  | 'patient_name'
  | 'doctor_name'
  | 'status';

/**
 * Medical Record Search Params
 */
export interface MedicalRecordSearchParams {
  query?: string;
  filters?: MedicalRecordFilters;
  sortBy?: MedicalRecordSortBy;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Medical Record Search Result
 */
export interface MedicalRecordSearchResult {
  data: MedicalRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Medical Record Export Data
 */
export interface MedicalRecordExportData {
  medical_record_number: string;
  patient_name: string;
  doctor_name: string;
  visit_date: string;
  visit_type: string;
  chief_complaint: string;
  diagnosis: string;
  status: string;
  created_at: string;
}

/**
 * Timeline Event
 */
export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string;
  title: string;
  description?: string;
  related_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Timeline Filters
 */
export interface TimelineFilters {
  event_type?: TimelineEventType;
  date_from?: string;
  date_to?: string;
  include_future?: boolean;
}

/**
 * Medical Record Template
 */
export interface MedicalRecordTemplate {
  id: string;
  clinic_id: string;
  name: string;
  description?: string;
  visit_type?: VisitType;
  department_id?: string;
  template_data: Partial<CreateMedicalRecordInput>;
  created_by: string;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
}

/**
 * Create Template Input
 */
export interface CreateTemplateInput {
  name: string;
  description?: string;
  visit_type?: VisitType;
  department_id?: string;
  template_data: Partial<CreateMedicalRecordInput>;
}

/**
 * Update Template Input
 */
export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  visit_type?: VisitType;
  department_id?: string;
  template_data?: Partial<CreateMedicalRecordInput>;
  is_active?: boolean;
}

/**
 * AI Analysis Placeholder
 */
export interface AIAnalysis {
  soap_notes_suggestion?: string; // AI SOAP Notes
  diagnosis_suggestions?: string[]; // AI Diagnosis Suggestions
  clinical_summary?: string; // AI Clinical Summary
  follow_up_recommendation?: string; // AI Follow-up Recommendation
  risk_alerts?: string[]; // AI Risk Alerts
  medication_interactions?: string[]; // AI Medication Interaction Check
  icd_suggestions?: string[]; // AI ICD Code Suggestions
  visit_summary?: string; // AI Visit Summary
  clinical_decision_support?: string; // AI Clinical Decision Support
}

/**
 * External Integration Placeholder
 */
export interface ExternalIntegration {
  fhir_resource_id?: string; // FHIR integration
  hl7_message_id?: string; // HL7 integration
  lab_external_id?: string; // Laboratory API
  radiology_external_id?: string; // Radiology API
  insurance_claim_id?: string; // Insurance API
  medical_device_data?: Record<string, unknown>; // Medical Device API
}
