-- ============================================================================
-- Jafferi Clinic - Appointment Functions
-- ============================================================================
-- Functions for appointment management, including double booking prevention,
-- doctor availability validation, duration calculation, and automatic status updates.
-- ============================================================================

-- ============================================================================
-- Appointment Creation
-- ============================================================================

-- Generate appointment number before insert
CREATE OR REPLACE FUNCTION set_appointment_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate appointment number if not provided
    IF NEW.appointment_number IS NULL OR NEW.appointment_number = '' THEN
        NEW.appointment_number := generate_appointment_number(NEW.clinic_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Appointment Validation
-- ============================================================================

-- Prevent double booking for the same doctor at the same time
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    -- Check for overlapping appointments for the same doctor
    SELECT COUNT(*) INTO conflict_count
    FROM appointments
    WHERE doctor_id = NEW.doctor_id
    AND scheduled_date = NEW.scheduled_date
    AND deleted_at IS NULL
    AND id IS DISTINCT FROM NEW.id
    AND (
        -- New appointment starts during existing appointment
        (NEW.scheduled_time, NEW.scheduled_time + (NEW.duration_minutes || ' minutes')::INTERVAL)
        OVERLAPS (scheduled_time, scheduled_time + (duration_minutes || ' minutes')::INTERVAL)
    );
    
    IF conflict_count > 0 THEN
        RAISE EXCEPTION 'Doctor already has an appointment scheduled at this time';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Validate doctor availability
CREATE OR REPLACE FUNCTION validate_doctor_availability()
RETURNS TRIGGER AS $$
DECLARE
    doctor_active BOOLEAN;
BEGIN
    -- Check if doctor is active
    SELECT is_active INTO doctor_active
    FROM doctors
    WHERE id = NEW.doctor_id;
    
    IF NOT COALESCE(doctor_active, true) THEN
        RAISE EXCEPTION 'Doctor is not available for booking';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Appointment Duration
-- ============================================================================

-- Calculate appointment duration if not provided
CREATE OR REPLACE FUNCTION calculate_appointment_duration()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate duration from start and end time if not provided
    IF NEW.duration_minutes IS NULL OR NEW.duration_minutes = 0 THEN
        IF NEW.scheduled_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
            NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.scheduled_time)) / 60;
        ELSE
            -- Default to 30 minutes if not specified
            NEW.duration_minutes := 30;
        END IF;
    END IF;
    
    -- Calculate end time if duration is provided but end time is not
    IF NEW.end_time IS NULL AND NEW.scheduled_time IS NOT NULL AND NEW.duration_minutes IS NOT NULL THEN
        NEW.end_time := NEW.scheduled_time + (NEW.duration_minutes || ' minutes')::INTERVAL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Appointment Status
-- ============================================================================

-- Automatically update appointment status based on date/time
CREATE OR REPLACE FUNCTION update_appointment_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status based on scheduled date and time
    IF NEW.scheduled_date < CURRENT_DATE THEN
        -- Past date
        IF NEW.status_id IS NULL OR NEW.status_id = (SELECT id FROM appointment_status WHERE name = 'scheduled') THEN
            NEW.status_id := (SELECT id FROM appointment_status WHERE name = 'missed' LIMIT 1);
        END IF;
    ELSIF NEW.scheduled_date = CURRENT_DATE THEN
        -- Today
        IF NEW.scheduled_time <= CURRENT_TIME THEN
            -- Time has passed
            IF NEW.check_in_time IS NOT NULL THEN
                NEW.status_id := (SELECT id FROM appointment_status WHERE name = 'completed' LIMIT 1);
            ELSE
                NEW.status_id := (SELECT id FROM appointment_status WHERE name = 'in_progress' LIMIT 1);
            END IF;
        ELSE
            -- Future time today
            IF NEW.status_id IS NULL THEN
                NEW.status_id := (SELECT id FROM appointment_status WHERE name = 'scheduled' LIMIT 1);
            END IF;
        END IF;
    ELSE
        -- Future date
        IF NEW.status_id IS NULL THEN
            NEW.status_id := (SELECT id FROM appointment_status WHERE name = 'scheduled' LIMIT 1);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Manually update appointment status
CREATE OR REPLACE FUNCTION set_appointment_status(
    p_appointment_id UUID,
    p_status_name TEXT,
    p_updated_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    status_id UUID;
    clinic_id UUID;
BEGIN
    -- Get status ID
    SELECT id INTO status_id
    FROM appointment_status
    WHERE name = p_status_name
    LIMIT 1;
    
    IF status_id IS NULL THEN
        RAISE EXCEPTION 'Status % does not exist', p_status_name;
    END IF;
    
    -- Get clinic_id for logging
    SELECT clinic_id INTO clinic_id
    FROM appointments
    WHERE id = p_appointment_id;
    
    -- Update appointment status
    UPDATE appointments
    SET status_id = status_id,
        updated_at = NOW()
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
        p_updated_by,
        'APPOINTMENT_STATUS_CHANGED',
        'appointments',
        p_appointment_id,
        jsonb_build_object(
            'status', p_status_name,
            'updated_by', p_updated_by
        ),
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Appointment Management
-- ============================================================================

-- Check in patient for appointment
CREATE OR REPLACE FUNCTION check_in_appointment(
    p_appointment_id UUID,
    p_checked_in_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    clinic_id UUID;
BEGIN
    -- Get clinic_id
    SELECT clinic_id INTO clinic_id
    FROM appointments
    WHERE id = p_appointment_id;
    
    -- Update appointment
    UPDATE appointments
    SET check_in_time = NOW(),
        status_id = (SELECT id FROM appointment_status WHERE name = 'in_progress' LIMIT 1),
        updated_at = NOW()
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
        p_checked_in_by,
        'APPOINTMENT_CHECKED_IN',
        'appointments',
        p_appointment_id,
        jsonb_build_object('checked_in_by', p_checked_in_by),
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cancel appointment
CREATE OR REPLACE FUNCTION cancel_appointment(
    p_appointment_id UUID,
    p_cancelled_by UUID DEFAULT NULL,
    p_cancellation_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    clinic_id UUID;
BEGIN
    -- Get clinic_id
    SELECT clinic_id INTO clinic_id
    FROM appointments
    WHERE id = p_appointment_id;
    
    -- Update appointment
    UPDATE appointments
    SET status_id = (SELECT id FROM appointment_status WHERE name = 'cancelled' LIMIT 1),
        cancellation_reason = p_cancellation_reason,
        cancelled_at = NOW(),
        updated_at = NOW()
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
        p_cancelled_by,
        'APPOINTMENT_CANCELLED',
        'appointments',
        p_appointment_id,
        jsonb_build_object(
            'cancelled_by', p_cancelled_by,
            'reason', p_cancellation_reason
        ),
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete appointment
CREATE OR REPLACE FUNCTION complete_appointment(
    p_appointment_id UUID,
    p_completed_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    clinic_id UUID;
BEGIN
    -- Get clinic_id
    SELECT clinic_id INTO clinic_id
    FROM appointments
    WHERE id = p_appointment_id;
    
    -- Update appointment
    UPDATE appointments
    SET status_id = (SELECT id FROM appointment_status WHERE name = 'completed' LIMIT 1),
        end_time = NOW(),
        updated_at = NOW()
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
        p_completed_by,
        'APPOINTMENT_COMPLETED',
        'appointments',
        p_appointment_id,
        jsonb_build_object('completed_by', p_completed_by),
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
