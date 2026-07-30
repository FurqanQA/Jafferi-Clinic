-- ============================================================================
-- Jafferi Clinic - Activity Log Functions
-- ============================================================================
-- Functions for logging various activities and events in the system.
-- These functions provide a comprehensive audit trail for compliance and security.
-- ============================================================================

-- ============================================================================
-- Generic Activity Logging
-- ============================================================================

-- Log generic INSERT activity
CREATE OR REPLACE FUNCTION log_insert(
    p_clinic_id UUID,
    p_user_id UUID,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_log_id UUID;
BEGIN
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        p_clinic_id,
        p_user_id,
        'INSERT',
        p_entity_type,
        p_entity_id,
        p_details,
        NOW()
    ) RETURNING id INTO new_log_id;
    
    RETURN new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log generic UPDATE activity
CREATE OR REPLACE FUNCTION log_update(
    p_clinic_id UUID,
    p_user_id UUID,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_log_id UUID;
BEGIN
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        p_clinic_id,
        p_user_id,
        'UPDATE',
        p_entity_type,
        p_entity_id,
        p_details,
        NOW()
    ) RETURNING id INTO new_log_id;
    
    RETURN new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log generic DELETE activity
CREATE OR REPLACE FUNCTION log_delete(
    p_clinic_id UUID,
    p_user_id UUID,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_log_id UUID;
BEGIN
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        p_clinic_id,
        p_user_id,
        'DELETE',
        p_entity_type,
        p_entity_id,
        p_details,
        NOW()
    ) RETURNING id INTO new_log_id;
    
    RETURN new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Entity-Specific Logging
-- ============================================================================

-- Log patient activity
CREATE OR REPLACE FUNCTION log_patient_activity(
    p_patient_id UUID,
    p_action TEXT,
    p_user_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    clinic_id UUID;
    new_log_id UUID;
BEGIN
    -- Get clinic_id from patient
    SELECT clinic_id INTO clinic_id
    FROM patients
    WHERE id = p_patient_id;
    
    -- Log activity
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        clinic_id,
        p_user_id,
        p_action,
        'patients',
        p_patient_id,
        p_details,
        NOW()
    ) RETURNING id INTO new_log_id;
    
    RETURN new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log appointment activity
CREATE OR REPLACE FUNCTION log_appointment_activity(
    p_appointment_id UUID,
    p_action TEXT,
    p_user_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    clinic_id UUID;
    new_log_id UUID;
BEGIN
    -- Get clinic_id from appointment
    SELECT clinic_id INTO clinic_id
    FROM appointments
    WHERE id = p_appointment_id;
    
    -- Log activity
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        clinic_id,
        p_user_id,
        p_action,
        'appointments',
        p_appointment_id,
        p_details,
        NOW()
    ) RETURNING id INTO new_log_id;
    
    RETURN new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log medical record activity
CREATE OR REPLACE FUNCTION log_medical_record_activity(
    p_medical_record_id UUID,
    p_action TEXT,
    p_user_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    clinic_id UUID;
    new_log_id UUID;
BEGIN
    -- Get clinic_id from medical record
    SELECT clinic_id INTO clinic_id
    FROM medical_records
    WHERE id = p_medical_record_id;
    
    -- Log activity
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        clinic_id,
        p_user_id,
        p_action,
        'medical_records',
        p_medical_record_id,
        p_details,
        NOW()
    ) RETURNING id INTO new_log_id;
    
    RETURN new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log prescription activity
CREATE OR REPLACE FUNCTION log_prescription_activity(
    p_prescription_id UUID,
    p_action TEXT,
    p_user_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    clinic_id UUID;
    new_log_id UUID;
BEGIN
    -- Get clinic_id from prescription
    SELECT clinic_id INTO clinic_id
    FROM prescriptions
    WHERE id = p_prescription_id;
    
    -- Log activity
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        clinic_id,
        p_user_id,
        p_action,
        'prescriptions',
        p_prescription_id,
        p_details,
        NOW()
    ) RETURNING id INTO new_log_id;
    
    RETURN new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log invoice activity
CREATE OR REPLACE FUNCTION log_invoice_activity(
    p_invoice_id UUID,
    p_action TEXT,
    p_user_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    clinic_id UUID;
    new_log_id UUID;
BEGIN
    -- Get clinic_id from invoice
    SELECT clinic_id INTO clinic_id
    FROM invoices
    WHERE id = p_invoice_id;
    
    -- Log activity
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        clinic_id,
        p_user_id,
        p_action,
        'invoices',
        p_invoice_id,
        p_details,
        NOW()
    ) RETURNING id INTO new_log_id;
    
    RETURN new_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Audit Trail Queries
-- ============================================================================

-- Get activity log for a specific entity
CREATE OR REPLACE FUNCTION get_entity_activity_log(
    p_entity_type TEXT,
    p_entity_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    clinic_id UUID,
    user_id UUID,
    action TEXT,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.clinic_id,
        al.user_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.details,
        al.ip_address,
        al.user_agent,
        al.created_at
    FROM activity_logs al
    WHERE al.entity_type = p_entity_type
    AND al.entity_id = p_entity_id
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get activity log for a user
CREATE OR REPLACE FUNCTION get_user_activity_log(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    clinic_id UUID,
    user_id UUID,
    action TEXT,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.clinic_id,
        al.user_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.details,
        al.ip_address,
        al.user_agent,
        al.created_at
    FROM activity_logs al
    WHERE al.user_id = p_user_id
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get activity log for a clinic
CREATE OR REPLACE FUNCTION get_clinic_activity_log(
    p_clinic_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    clinic_id UUID,
    user_id UUID,
    action TEXT,
    entity_type TEXT,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.clinic_id,
        al.user_id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.details,
        al.ip_address,
        al.user_agent,
        al.created_at
    FROM activity_logs al
    WHERE al.clinic_id = p_clinic_id
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Activity Log Cleanup
-- ============================================================================

-- Archive old activity logs (for data retention policies)
CREATE OR REPLACE FUNCTION archive_old_activity_logs(p_days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    -- Move old logs to archive table (if it exists)
    -- For now, just return the count
    SELECT COUNT(*) INTO archived_count
    FROM activity_logs
    WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete old activity logs (use with caution)
CREATE OR REPLACE FUNCTION delete_old_activity_logs(p_days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete old logs
    DELETE FROM activity_logs
    WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL
    RETURNING COUNT(*) INTO deleted_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
