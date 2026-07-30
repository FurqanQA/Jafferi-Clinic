-- ============================================================================
-- Jafferi Clinic - Medical Records Schema
-- ============================================================================
-- Stores patient medical records and visit history.
-- Detailed medical records from patient visits including diagnosis, symptoms, examination findings, and treatment plans.
-- ============================================================================

-- Medical Records Table
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    appointment_id UUID,
    visit_number INTEGER,
    visit_date DATE NOT NULL,
    visit_type visit_type_enum NOT NULL,
    chief_complaint TEXT,
    present_illness TEXT,
    past_medical_history TEXT,
    family_history TEXT,
    social_history TEXT,
    allergies TEXT,
    medications TEXT,
    vital_signs JSONB,
    examination_findings TEXT,
    diagnosis TEXT,
    secondary_diagnosis TEXT,
    icd_code VARCHAR(20),
    treatment_plan TEXT,
    procedures_performed TEXT,
    follow_up_instructions TEXT,
    notes TEXT,
    is_confidential BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_medical_records_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_medical_records_patient_id 
        FOREIGN KEY (patient_id) 
        REFERENCES patients(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_medical_records_doctor_id 
        FOREIGN KEY (doctor_id) 
        REFERENCES doctors(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_medical_records_appointment_id 
        FOREIGN KEY (appointment_id) 
        REFERENCES appointments(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_medical_records_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_medical_records_updated_by 
        FOREIGN KEY (updated_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Comments
COMMENT ON TABLE medical_records IS 'Stores patient medical records and visit history. Each record belongs to exactly one clinic.';
COMMENT ON COLUMN medical_records.id IS 'Unique identifier for the medical record';
COMMENT ON COLUMN medical_records.clinic_id IS 'Foreign key to clinics table - record belongs to this clinic';
COMMENT ON COLUMN medical_records.patient_id IS 'Foreign key to patients table - record for this patient';
COMMENT ON COLUMN medical_records.doctor_id IS 'Foreign key to doctors table - record created by this doctor';
COMMENT ON COLUMN medical_records.appointment_id IS 'Foreign key to appointments table - record from this appointment (optional)';
COMMENT ON COLUMN medical_records.visit_number IS 'Visit sequence number for patient';
COMMENT ON COLUMN medical_records.visit_date IS 'Visit date';
COMMENT ON COLUMN medical_records.visit_type IS 'Visit type (initial, follow-up, emergency, routine)';
COMMENT ON COLUMN medical_records.chief_complaint IS 'Patient main complaint';
COMMENT ON COLUMN medical_records.present_illness IS 'History of present illness';
COMMENT ON COLUMN medical_records.past_medical_history IS 'Past medical history';
COMMENT ON COLUMN medical_records.family_history IS 'Family medical history';
COMMENT ON COLUMN medical_records.social_history IS 'Social history';
COMMENT ON COLUMN medical_records.allergies IS 'Allergies noted';
COMMENT ON COLUMN medical_records.medications IS 'Current medications';
COMMENT ON COLUMN medical_records.vital_signs IS 'Vital signs (temperature, BP, pulse, etc.) as JSON';
COMMENT ON COLUMN medical_records.examination_findings IS 'Physical examination findings';
COMMENT ON COLUMN medical_records.diagnosis IS 'Primary diagnosis';
COMMENT ON COLUMN medical_records.secondary_diagnosis IS 'Secondary diagnoses';
COMMENT ON COLUMN medical_records.icd_code IS 'ICD diagnosis code';
COMMENT ON COLUMN medical_records.treatment_plan IS 'Treatment plan';
COMMENT ON COLUMN medical_records.procedures_performed IS 'Medical procedures performed';
COMMENT ON COLUMN medical_records.follow_up_instructions IS 'Follow-up instructions';
COMMENT ON COLUMN medical_records.notes IS 'Additional notes';
COMMENT ON COLUMN medical_records.is_confidential IS 'Confidential record flag';
COMMENT ON COLUMN medical_records.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN medical_records.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN medical_records.created_by IS 'Foreign key to profiles table - user who created';
COMMENT ON COLUMN medical_records.updated_by IS 'Foreign key to profiles table - user who last updated';
COMMENT ON COLUMN medical_records.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_medical_records_clinic_id ON medical_records(clinic_id);
CREATE INDEX idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX idx_medical_records_appointment_id ON medical_records(appointment_id);
CREATE INDEX idx_medical_records_visit_date ON medical_records(visit_date);
CREATE INDEX idx_medical_records_diagnosis ON medical_records(diagnosis);
CREATE INDEX idx_medical_records_icd_code ON medical_records(icd_code);
CREATE INDEX idx_medical_records_deleted_at ON medical_records(deleted_at);
CREATE INDEX idx_medical_records_clinic_patient_visit_date ON medical_records(clinic_id, patient_id, visit_date);
CREATE INDEX idx_medical_records_patient_visit_date ON medical_records(patient_id, visit_date);

-- Triggers for updated_at
CREATE TRIGGER update_medical_records_updated_at
    BEFORE UPDATE ON medical_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
