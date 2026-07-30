-- ============================================================================
-- Jafferi Clinic - Appointments Schema
-- ============================================================================
-- Manages patient appointments with doctors.
-- Scheduling system for patient appointments including status, duration, notes, and payment information.
-- ============================================================================

-- Appointments Table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    doctor_id UUID NOT NULL,
    appointment_number VARCHAR(50) NOT NULL,
    status_id UUID NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    end_time TIME,
    duration_minutes INTEGER NOT NULL,
    appointment_type appointment_type_enum NOT NULL,
    reason TEXT,
    symptoms TEXT,
    notes TEXT,
    is_virtual BOOLEAN NOT NULL DEFAULT false,
    virtual_meeting_link TEXT,
    fee DECIMAL(10,2),
    is_paid BOOLEAN NOT NULL DEFAULT false,
    payment_method payment_method_enum,
    reminder_sent BOOLEAN NOT NULL DEFAULT false,
    reminder_sent_at TIMESTAMPTZ,
    check_in_time TIMESTAMPTZ,
    start_time TIMESTAMPTZ,
    end_time_actual TIMESTAMPTZ,
    no_show BOOLEAN NOT NULL DEFAULT false,
    cancellation_reason TEXT,
    cancelled_by UUID,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_appointments_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_appointments_patient_id 
        FOREIGN KEY (patient_id) 
        REFERENCES patients(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_appointments_doctor_id 
        FOREIGN KEY (doctor_id) 
        REFERENCES doctors(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_appointments_status_id 
        FOREIGN KEY (status_id) 
        REFERENCES appointment_status(id) 
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_appointments_cancelled_by 
        FOREIGN KEY (cancelled_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_appointments_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_appointments_updated_by 
        FOREIGN KEY (updated_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    -- Unique Constraint
    CONSTRAINT uk_appointments_clinic_appointment_number 
        UNIQUE (clinic_id, appointment_number),
    
    -- Check Constraints
    CONSTRAINT chk_appointments_duration_positive 
        CHECK (duration_minutes > 0),
    
    CONSTRAINT chk_appointments_fee_positive 
        CHECK (fee IS NULL OR fee >= 0)
);

-- Comments
COMMENT ON TABLE appointments IS 'Manages patient appointments with doctors. Each appointment belongs to exactly one clinic.';
COMMENT ON COLUMN appointments.id IS 'Unique identifier for the appointment';
COMMENT ON COLUMN appointments.clinic_id IS 'Foreign key to clinics table - appointment belongs to this clinic';
COMMENT ON COLUMN appointments.patient_id IS 'Foreign key to patients table - appointment for this patient';
COMMENT ON COLUMN appointments.doctor_id IS 'Foreign key to doctors table - appointment with this doctor';
COMMENT ON COLUMN appointments.appointment_number IS 'Unique appointment ID';
COMMENT ON COLUMN appointments.status_id IS 'Foreign key to appointment_status table - appointment status';
COMMENT ON COLUMN appointments.scheduled_date IS 'Scheduled date';
COMMENT ON COLUMN appointments.scheduled_time IS 'Scheduled time';
COMMENT ON COLUMN appointments.end_time IS 'Expected end time';
COMMENT ON COLUMN appointments.duration_minutes IS 'Appointment duration in minutes';
COMMENT ON COLUMN appointments.appointment_type IS 'Type (consultation, follow-up, emergency, procedure)';
COMMENT ON COLUMN appointments.reason IS 'Appointment reason';
COMMENT ON COLUMN appointments.symptoms IS 'Patient symptoms';
COMMENT ON COLUMN appointments.notes IS 'Doctor notes';
COMMENT ON COLUMN appointments.is_virtual IS 'Virtual/telemedicine appointment flag';
COMMENT ON COLUMN appointments.virtual_meeting_link IS 'Meeting link for virtual appointments';
COMMENT ON COLUMN appointments.fee IS 'Appointment fee';
COMMENT ON COLUMN appointments.is_paid IS 'Payment status';
COMMENT ON COLUMN appointments.payment_method IS 'Payment method (cash, card, insurance, transfer)';
COMMENT ON COLUMN appointments.reminder_sent IS 'Reminder notification sent flag';
COMMENT ON COLUMN appointments.reminder_sent_at IS 'Reminder sent timestamp';
COMMENT ON COLUMN appointments.check_in_time IS 'Patient check-in time';
COMMENT ON COLUMN appointments.start_time IS 'Actual start time';
COMMENT ON COLUMN appointments.end_time_actual IS 'Actual end time';
COMMENT ON COLUMN appointments.no_show IS 'Patient no-show flag';
COMMENT ON COLUMN appointments.cancellation_reason IS 'Reason for cancellation';
COMMENT ON COLUMN appointments.cancelled_by IS 'Foreign key to profiles table - user who cancelled';
COMMENT ON COLUMN appointments.cancelled_at IS 'Cancellation timestamp';
COMMENT ON COLUMN appointments.created_at IS 'Timestamp when the appointment was created';
COMMENT ON COLUMN appointments.updated_at IS 'Timestamp when the appointment was last updated';
COMMENT ON COLUMN appointments.created_by IS 'Foreign key to profiles table - user who created';
COMMENT ON COLUMN appointments.updated_by IS 'Foreign key to profiles table - user who last updated';
COMMENT ON COLUMN appointments.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_status_id ON appointments(status_id);
CREATE INDEX idx_appointments_scheduled_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_scheduled_time ON appointments(scheduled_time);
CREATE INDEX idx_appointments_is_virtual ON appointments(is_virtual);
CREATE INDEX idx_appointments_is_paid ON appointments(is_paid);
CREATE INDEX idx_appointments_deleted_at ON appointments(deleted_at);
CREATE INDEX idx_appointments_clinic_doctor_date ON appointments(clinic_id, doctor_id, scheduled_date);
CREATE INDEX idx_appointments_clinic_patient_date ON appointments(clinic_id, patient_id, scheduled_date);
CREATE INDEX idx_appointments_date_status ON appointments(scheduled_date, status_id);

-- Triggers for updated_at
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
