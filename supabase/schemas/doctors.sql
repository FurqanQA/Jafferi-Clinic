-- ============================================================================
-- Jafferi Clinic - Doctors Schema
-- ============================================================================
-- Stores doctor-specific information and credentials.
-- Extended profile for users with doctor role.
-- ============================================================================

-- Doctors Table
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    clinic_id UUID NOT NULL,
    medical_license_number VARCHAR(100) NOT NULL,
    license_expiry_date DATE,
    specialization VARCHAR(100),
    qualification VARCHAR(255),
    experience_years INTEGER,
    consultation_fee DECIMAL(10,2),
    consultation_duration INTEGER,
    bio TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    availability_schedule JSONB,
    languages TEXT[],
    education JSONB,
    certifications JSONB,
    rating DECIMAL(3,2),
    total_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_doctors_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_doctors_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    -- Unique Constraint
    CONSTRAINT uk_doctors_user_id 
        UNIQUE (user_id)
);

-- Comments
COMMENT ON TABLE doctors IS 'Stores doctor-specific information and credentials. Each doctor is exactly one user.';
COMMENT ON COLUMN doctors.id IS 'Unique identifier for the doctor';
COMMENT ON COLUMN doctors.user_id IS 'Foreign key to profiles table - doctor is a user';
COMMENT ON COLUMN doctors.clinic_id IS 'Foreign key to clinics table - doctor belongs to this clinic';
COMMENT ON COLUMN doctors.medical_license_number IS 'Medical license number';
COMMENT ON COLUMN doctors.license_expiry_date IS 'License expiration date';
COMMENT ON COLUMN doctors.specialization IS 'Medical specialization';
COMMENT ON COLUMN doctors.qualification IS 'Medical qualification/degree';
COMMENT ON COLUMN doctors.experience_years IS 'Years of experience';
COMMENT ON COLUMN doctors.consultation_fee IS 'Standard consultation fee';
COMMENT ON COLUMN doctors.consultation_duration IS 'Standard consultation duration in minutes';
COMMENT ON COLUMN doctors.bio IS 'Doctor biography';
COMMENT ON COLUMN doctors.is_available IS 'Current availability status';
COMMENT ON COLUMN doctors.availability_schedule IS 'Weekly availability schedule (JSON)';
COMMENT ON COLUMN doctors.languages IS 'Languages spoken (array)';
COMMENT ON COLUMN doctors.education IS 'Education history (JSON)';
COMMENT ON COLUMN doctors.certifications IS 'Professional certifications (JSON)';
COMMENT ON COLUMN doctors.rating IS 'Average patient rating';
COMMENT ON COLUMN doctors.total_reviews IS 'Total number of reviews';
COMMENT ON COLUMN doctors.created_at IS 'Timestamp when the doctor record was created';
COMMENT ON COLUMN doctors.updated_at IS 'Timestamp when the doctor record was last updated';
COMMENT ON COLUMN doctors.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_clinic_id ON doctors(clinic_id);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);
CREATE INDEX idx_doctors_is_available ON doctors(is_available);
CREATE INDEX idx_doctors_deleted_at ON doctors(deleted_at);
CREATE INDEX idx_doctors_clinic_specialization ON doctors(clinic_id, specialization);
CREATE INDEX idx_doctors_clinic_is_available ON doctors(clinic_id, is_available);

-- Triggers for updated_at
CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON doctors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
