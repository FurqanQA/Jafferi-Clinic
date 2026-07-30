-- ============================================================================
-- Jafferi Clinic - Prescription Medicines Schema
-- ============================================================================
-- Stores individual medicines within a prescription.
-- Detailed medication information for each prescribed item including dosage, frequency, and duration.
-- ============================================================================

-- Prescription Medicines Table
CREATE TABLE prescription_medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL,
    clinic_id UUID NOT NULL,
    medicine_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100),
    route VARCHAR(50),
    duration VARCHAR(50),
    quantity INTEGER,
    instructions TEXT,
    refills_allowed INTEGER DEFAULT 0,
    refills_used INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_prescription_medicines_prescription_id 
        FOREIGN KEY (prescription_id) 
        REFERENCES prescriptions(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_prescription_medicines_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    -- Check Constraints
    CONSTRAINT chk_prescription_medicines_quantity_positive 
        CHECK (quantity IS NULL OR quantity > 0),
    
    CONSTRAINT chk_prescription_medicines_refills_non_negative 
        CHECK (refills_allowed >= 0 AND refills_used >= 0),
    
    CONSTRAINT chk_prescription_medicines_refills_used_not_exceed_allowed 
        CHECK (refills_used <= refills_allowed)
);

-- Comments
COMMENT ON TABLE prescription_medicines IS 'Stores individual medicines within a prescription. Each medicine belongs to exactly one clinic.';
COMMENT ON COLUMN prescription_medicines.id IS 'Unique identifier for the prescription medicine';
COMMENT ON COLUMN prescription_medicines.prescription_id IS 'Foreign key to prescriptions table - medicine belongs to this prescription';
COMMENT ON COLUMN prescription_medicines.clinic_id IS 'Foreign key to clinics table - medicine belongs to this clinic';
COMMENT ON COLUMN prescription_medicines.medicine_name IS 'Medicine name';
COMMENT ON COLUMN prescription_medicines.generic_name IS 'Generic drug name';
COMMENT ON COLUMN prescription_medicines.dosage IS 'Dosage (e.g., 500mg)';
COMMENT ON COLUMN prescription_medicines.frequency IS 'Frequency (e.g., twice daily)';
COMMENT ON COLUMN prescription_medicines.route IS 'Administration route (oral, injection, etc.)';
COMMENT ON COLUMN prescription_medicines.duration IS 'Duration (e.g., 7 days)';
COMMENT ON COLUMN prescription_medicines.quantity IS 'Total quantity';
COMMENT ON COLUMN prescription_medicines.instructions IS 'Special instructions';
COMMENT ON COLUMN prescription_medicines.refills_allowed IS 'Number of refills allowed';
COMMENT ON COLUMN prescription_medicines.refills_used IS 'Number of refills used';
COMMENT ON COLUMN prescription_medicines.is_active IS 'Medicine active status';
COMMENT ON COLUMN prescription_medicines.created_at IS 'Timestamp when the medicine record was created';
COMMENT ON COLUMN prescription_medicines.updated_at IS 'Timestamp when the medicine record was last updated';
COMMENT ON COLUMN prescription_medicines.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_prescription_medicines_prescription_id ON prescription_medicines(prescription_id);
CREATE INDEX idx_prescription_medicines_clinic_id ON prescription_medicines(clinic_id);
CREATE INDEX idx_prescription_medicines_medicine_name ON prescription_medicines(medicine_name);
CREATE INDEX idx_prescription_medicines_generic_name ON prescription_medicines(generic_name);
CREATE INDEX idx_prescription_medicines_is_active ON prescription_medicines(is_active);
CREATE INDEX idx_prescription_medicines_deleted_at ON prescription_medicines(deleted_at);

-- Triggers for updated_at
CREATE TRIGGER update_prescription_medicines_updated_at
    BEFORE UPDATE ON prescription_medicines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
