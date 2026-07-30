-- ============================================================================
-- Jafferi Clinic - Appointment Triggers
-- ============================================================================
-- Triggers for appointment management, including number generation,
-- double booking prevention, duration calculation, status updates, and notifications.
-- ============================================================================

-- ============================================================================
-- Appointment Triggers
-- ============================================================================

-- Generate appointment number before insert
CREATE TRIGGER set_appointment_number_before_insert
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION set_appointment_number();

-- Prevent double booking before insert
CREATE TRIGGER prevent_double_booking_before_insert
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION prevent_double_booking();

-- Prevent double booking before update
CREATE TRIGGER prevent_double_booking_before_update
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    WHEN (OLD.doctor_id IS DISTINCT FROM NEW.doctor_id 
          OR OLD.scheduled_date IS DISTINCT FROM NEW.scheduled_date 
          OR OLD.scheduled_time IS DISTINCT FROM NEW.scheduled_time 
          OR OLD.duration_minutes IS DISTINCT FROM NEW.duration_minutes)
    EXECUTE FUNCTION prevent_double_booking();

-- Validate doctor availability before insert
CREATE TRIGGER validate_doctor_availability_before_insert
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION validate_doctor_availability();

-- Calculate appointment duration before insert
CREATE TRIGGER calculate_appointment_duration_before_insert
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION calculate_appointment_duration();

-- Calculate appointment duration before update
CREATE TRIGGER calculate_appointment_duration_before_update
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    WHEN (OLD.scheduled_time IS DISTINCT FROM NEW.scheduled_time 
          OR OLD.end_time IS DISTINCT FROM NEW.end_time 
          OR OLD.duration_minutes IS DISTINCT FROM NEW.duration_minutes)
    EXECUTE FUNCTION calculate_appointment_duration();

-- Update appointment status before insert
CREATE TRIGGER update_appointment_status_before_insert
    BEFORE INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointment_status();

-- Update appointment status before update
CREATE TRIGGER update_appointment_status_before_update
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    WHEN (OLD.scheduled_date IS DISTINCT FROM NEW.scheduled_date 
          OR OLD.scheduled_time IS DISTINCT FROM NEW.scheduled_time 
          OR OLD.status_id IS DISTINCT FROM NEW.status_id)
    EXECUTE FUNCTION update_appointment_status();

-- Update updated_at timestamp on appointment update
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log appointment insert activity
CREATE TRIGGER log_appointment_insert
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION log_appointment_activity(
        NEW.id,
        'APPOINTMENT_CREATED',
        NEW.created_by,
        jsonb_build_object(
            'patient_id', NEW.patient_id,
            'doctor_id', NEW.doctor_id,
            'scheduled_date', NEW.scheduled_date,
            'scheduled_time', NEW.scheduled_time
        )
    );

-- Log appointment update activity
CREATE TRIGGER log_appointment_update
    AFTER UPDATE ON appointments
    FOR EACH ROW
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION log_appointment_activity(
        NEW.id,
        'APPOINTMENT_UPDATED',
        NEW.updated_by,
        jsonb_build_object(
            'changes', jsonb_build_object(
                'scheduled_date', CASE WHEN OLD.scheduled_date IS DISTINCT FROM NEW.scheduled_date THEN NEW.scheduled_date END,
                'scheduled_time', CASE WHEN OLD.scheduled_time IS DISTINCT FROM NEW.scheduled_time THEN NEW.scheduled_time END,
                'status_id', CASE WHEN OLD.status_id IS DISTINCT FROM NEW.status_id THEN NEW.status_id END
            )
        )
    );

-- Log appointment delete activity
CREATE TRIGGER log_appointment_delete
    AFTER DELETE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION log_appointment_activity(
        OLD.id,
        'APPOINTMENT_DELETED',
        OLD.updated_by,
        jsonb_build_object('scheduled_date', OLD.scheduled_date)
    );

-- ============================================================================
-- Appointment Status Triggers
-- ============================================================================

-- Update updated_at timestamp on appointment_status update
CREATE TRIGGER update_appointment_status_updated_at
    BEFORE UPDATE ON appointment_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Medical Records Triggers
-- ============================================================================

-- Update updated_at timestamp on medical_records update
CREATE TRIGGER update_medical_records_updated_at
    BEFORE UPDATE ON medical_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log medical record insert activity
CREATE TRIGGER log_medical_record_insert
    AFTER INSERT ON medical_records
    FOR EACH ROW
    EXECUTE FUNCTION log_medical_record_activity(
        NEW.id,
        'MEDICAL_RECORD_CREATED',
        NEW.created_by,
        jsonb_build_object(
            'patient_id', NEW.patient_id,
            'doctor_id', NEW.doctor_id,
            'appointment_id', NEW.appointment_id
        )
    );

-- Log medical record update activity
CREATE TRIGGER log_medical_record_update
    AFTER UPDATE ON medical_records
    FOR EACH ROW
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION log_medical_record_activity(
        NEW.id,
        'MEDICAL_RECORD_UPDATED',
        NEW.updated_by,
        jsonb_build_object('action', 'medical_record_updated')
    );

-- ============================================================================
-- Prescriptions Triggers
-- ============================================================================

-- Update updated_at timestamp on prescriptions update
CREATE TRIGGER update_prescriptions_updated_at
    BEFORE UPDATE ON prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log prescription insert activity
CREATE TRIGGER log_prescription_insert
    AFTER INSERT ON prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION log_prescription_activity(
        NEW.id,
        'PRESCRIPTION_CREATED',
        NEW.created_by,
        jsonb_build_object(
            'patient_id', NEW.patient_id,
            'doctor_id', NEW.doctor_id,
            'appointment_id', NEW.appointment_id
        )
    );

-- Log prescription update activity
CREATE TRIGGER log_prescription_update
    AFTER UPDATE ON prescriptions
    FOR EACH ROW
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION log_prescription_activity(
        NEW.id,
        'PRESCRIPTION_UPDATED',
        NEW.updated_by,
        jsonb_build_object('action', 'prescription_updated')
    );

-- ============================================================================
-- Prescription Medicines Triggers
-- ============================================================================

-- Update updated_at timestamp on prescription_medicines update
CREATE TRIGGER update_prescription_medicines_updated_at
    BEFORE UPDATE ON prescription_medicines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
