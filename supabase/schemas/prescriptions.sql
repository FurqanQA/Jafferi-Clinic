-- ============================================================================
-- Jafferi Clinic - Prescriptions Schema
-- ============================================================================
-- Manages patient prescriptions.
-- Prescription records linking medical records to prescribed medications with dosage and instructions.
-- ============================================================================

-- Prescriptions Table
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    medical_record_id UUID,
    appointment_id UUID,
    prescription_number VARCHAR(50) NOT NULL,
    prescription_date DATE NOT NULL,
    diagnosis TEXT,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    dispensed BOOLEAN NOT NULL DEFAULT false,
    dispensed_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_prescriptions_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_prescriptions_patient_id 
        FOREIGN KEY (patient_id) 
        REFERENCES patients(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_prescriptions_doctor_id 
        FOREIGN KEY (doctor_id) 
        REFERENCES doctors(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_prescriptions_medical_record_id 
        FOREIGN KEY (medical_record_id) 
        REFERENCES medical_records(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_prescriptions_appointment_id 
        FOREIGN KEY (appointment_id) 
        REFERENCES appointments(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_prescriptions_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_prescriptions_updated_by 
        FOREIGN KEY (updated_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    -- Unique Constraint
    CONSTRAINT uk_prescriptions_clinic_prescription_number 
        UNIQUE (clinic_id, prescription_number)
);

-- Comments
COMMENT ON TABLE prescriptions IS 'Manages patient prescriptions. Each prescription belongs to exactly one clinic.';
COMMENT ON COLUMN prescriptions.id IS 'Unique identifier for the prescription';
COMMENT ON COLUMN prescriptions.clinic_id IS 'Foreign key to clinics table - prescription belongs to this clinic';
COMMENT ON COLUMN prescriptions.patient_id IS 'Foreign key to patients table - prescription for this patient';
COMMENT ON COLUMN prescriptions.doctor_id IS 'Foreign key to doctors table - prescribed by this doctor';
COMMENT ON COLUMN prescriptions.medical_record_id IS 'Foreign key to medical_records table - prescription from this record';
COMMENT ON COLUMN prescriptions.appointment_id IS 'Foreign key to appointments table - prescription from this appointment';
COMMENT ON COLUMN prescriptions.prescription_number IS 'Unique prescription ID';
COMMENT ON COLUMN prescriptions.prescription_date IS 'Prescription date';
COMMENT ON COLUMN prescriptions.diagnosis IS 'Diagnosis for prescription';
COMMENT ON COLUMN prescriptions.notes IS 'Additional notes';
COMMENT ON COLUMN prescriptions.is_active IS 'Prescription active status';
COMMENT ON COLUMN prescriptions.dispensed IS 'Whether dispensed';
COMMENT ON COLUMN prescriptions.dispensed_date IS 'Dispensing date';
COMMENT ON COLUMN prescriptions.created_at IS 'Timestamp when the prescription was created';
COMMENT ON COLUMN prescriptions.updated_at IS 'Timestamp when the prescription was last updated';
COMMENT ON COLUMN prescriptions.created_by IS 'Foreign key to profiles table - user who created';
COMMENT ON COLUMN prescriptions.updated_by IS 'Foreign key to profiles table - user who last updated';
COMMENT ON COLUMN prescriptions.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_prescriptions_clinic_id ON prescriptions(clinic_id);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_medical_record_id ON prescriptions(medical_record_id);
CREATE INDEX idx_prescriptions_appointment_id ON prescriptions(appointment_id);
CREATE INDEX idx_prescriptions_prescription_date ON prescriptions(prescription_date);
CREATE INDEX idx_prescriptions_is_active ON prescriptions(is_active);
CREATE INDEX idx_prescriptions_deleted_at ON prescriptions(deleted_at);
CREATE INDEX idx_prescriptions_clinic_patient_date ON prescriptions(clinic_id, patient_id, prescription_date);

-- Triggers for updated_at
CREATE TRIGGER update_prescriptions_updated_at
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
