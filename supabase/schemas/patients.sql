-- ============================================================================
-- Jafferi Clinic - Patients Schema
-- ============================================================================
-- Stores patient information and medical history.
-- Each patient belongs to exactly one clinic.
-- ============================================================================

-- Patients Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    patient_number VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender_enum,
    blood_type VARCHAR(10),
    email VARCHAR(255),
    phone VARCHAR(50),
    secondary_phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(100),
    insurance_provider VARCHAR(255),
    insurance_policy_number VARCHAR(100),
    medical_history JSONB,
    allergies TEXT[],
    chronic_conditions TEXT[],
    current_medications TEXT[],
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    first_visit_date DATE,
    last_visit_date DATE,
    total_visits INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    deleted_at TIMESTAMPTZ,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_patients_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_patients_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    -- Unique Constraint
    CONSTRAINT uk_patients_clinic_patient_number 
        UNIQUE (clinic_id, patient_number)
);

-- Comments
COMMENT ON TABLE patients IS 'Stores patient information and medical history. Each patient belongs to exactly one clinic.';
COMMENT ON COLUMN patients.id IS 'Unique identifier for the patient';
COMMENT ON COLUMN patients.clinic_id IS 'Foreign key to clinics table - patient belongs to this clinic';
COMMENT ON COLUMN patients.patient_number IS 'Unique clinic patient ID';
COMMENT ON COLUMN patients.first_name IS 'Patient first name';
COMMENT ON COLUMN patients.last_name IS 'Patient last name';
COMMENT ON COLUMN patients.date_of_birth IS 'Date of birth';
COMMENT ON COLUMN patients.gender IS 'Gender (male, female, other, prefer_not_to_say)';
COMMENT ON COLUMN patients.blood_type IS 'Blood type';
COMMENT ON COLUMN patients.email IS 'Email address';
COMMENT ON COLUMN patients.phone IS 'Primary phone number';
COMMENT ON COLUMN patients.secondary_phone IS 'Secondary phone number';
COMMENT ON COLUMN patients.address IS 'Physical address';
COMMENT ON COLUMN patients.city IS 'City';
COMMENT ON COLUMN patients.state IS 'State/Province';
COMMENT ON COLUMN patients.country IS 'Country';
COMMENT ON COLUMN patients.postal_code IS 'Postal/ZIP code';
COMMENT ON COLUMN patients.emergency_contact_name IS 'Emergency contact name';
COMMENT ON COLUMN patients.emergency_contact_phone IS 'Emergency contact phone';
COMMENT ON COLUMN patients.emergency_contact_relationship IS 'Relationship to emergency contact';
COMMENT ON COLUMN patients.insurance_provider IS 'Insurance company';
COMMENT ON COLUMN patients.insurance_policy_number IS 'Insurance policy number';
COMMENT ON COLUMN patients.medical_history IS 'Medical history summary (JSON)';
COMMENT ON COLUMN patients.allergies IS 'Known allergies (array)';
COMMENT ON COLUMN patients.chronic_conditions IS 'Chronic conditions (array)';
COMMENT ON COLUMN patients.current_medications IS 'Current medications (array)';
COMMENT ON COLUMN patients.notes IS 'General notes';
COMMENT ON COLUMN patients.is_active IS 'Patient active status';
COMMENT ON COLUMN patients.first_visit_date IS 'First visit date';
COMMENT ON COLUMN patients.last_visit_date IS 'Last visit date';
COMMENT ON COLUMN patients.total_visits IS 'Total visit count';
COMMENT ON COLUMN patients.created_at IS 'Timestamp when the patient record was created';
COMMENT ON COLUMN patients.updated_at IS 'Timestamp when the patient record was last updated';
COMMENT ON COLUMN patients.created_by IS 'Foreign key to profiles table - user who created the record';
COMMENT ON COLUMN patients.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_first_name ON patients(first_name);
CREATE INDEX idx_patients_last_name ON patients(last_name);
CREATE INDEX idx_patients_date_of_birth ON patients(date_of_birth);
CREATE INDEX idx_patients_is_active ON patients(is_active);
CREATE INDEX idx_patients_deleted_at ON patients(deleted_at);
CREATE INDEX idx_patients_created_by ON patients(created_by);
CREATE INDEX idx_patients_clinic_is_active ON patients(clinic_id, is_active);
CREATE INDEX idx_patients_clinic_last_first_name ON patients(clinic_id, last_name, first_name);

-- Triggers for updated_at
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
