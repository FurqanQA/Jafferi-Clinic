-- ============================================================================
-- Jafferi Clinic - Notification Functions
-- ============================================================================
-- Functions for creating and managing notifications for various events
-- such as appointments, invoices, payments, and user management.
-- ============================================================================

-- ============================================================================
-- Appointment Notifications
-- ============================================================================

-- Create notification for new appointment
CREATE OR REPLACE FUNCTION notify_appointment_created(p_appointment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
   (patient_id, doctor_id, clinic_id, scheduled_date, scheduled_time) RECORD;
    patient_user_id UUID;
    doctor_user_id UUID;
BEGIN
    -- Get appointment details
    SELECT p.id, d.id, a.clinic_id, a.scheduled_date, a.scheduled_time
    INTO patient_id, doctor_id, clinic_id, scheduled_date, scheduled_time
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.id = p_appointment_id;
    
    -- Get user IDs
    SELECT user_id INTO patient_user_id FROM profiles WHERE id = patient_id;
    SELECT user_id INTO doctor_user_id FROM profiles WHERE id = doctor_id;
    
    -- Notify patient
    INSERT INTO notifications (
        clinic_id,
        user_id,
        type,
        title,
        message,
        data,
        created_at
    ) VALUES (
        clinic_id,
        patient_user_id,
        'appointment_created',
        'New Appointment Scheduled',
        'Your appointment has been scheduled for ' || scheduled_date || ' at ' || scheduled_time,
        jsonb_build_object(
            'appointment_id', p_appointment_id,
            'scheduled_date', scheduled_date,
            'scheduled_time', scheduled_time
        ),
        NOW()
    );
    
    -- Notify doctor
    INSERT INTO notifications (
        clinic_id,
        user_id,
        type,
        title,
        message,
        data,
        created_at
    ) VALUES (
        clinic_id,
        doctor_user_id,
        'appointment_created',
        'New Appointment Assigned',
        'You have a new appointment on ' || scheduled_date || ' at ' || scheduled_time,
        jsonb_build_object(
            'appointment_id', p_appointment_id,
            'scheduled_date', scheduled_date,
            'scheduled_time', scheduled_time
        ),
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notification for appointment update
CREATE OR REPLACE FUNCTION notify_appointment_updated(p_appointment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    (patient_id, doctor_id, clinic_id, scheduled_date, scheduled_time) RECORD;
    patient_user_id UUID;
    doctor_user_id UUID;
BEGIN
    -- Get appointment details
    SELECT p.id, d.id, a.clinic_id, a.scheduled_date, a.scheduled_time
    INTO patient_id, doctor_id, clinic_id, scheduled_date, scheduled_time
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.id = p_appointment_id;
    
    -- Get user IDs
    SELECT user_id INTO patient_user_id FROM profiles WHERE id = patient_id;
    SELECT user_id INTO doctor_user_id FROM profiles WHERE id = doctor_id;
    
    -- Notify patient
    INSERT INTO notifications (
        clinic_id,
        user_id,
        type,
        title,
        message,
        data,
        created_at
    ) VALUES (
        clinic_id,
        patient_user_id,
        'appointment_updated',
        'Appointment Updated',
        'Your appointment has been rescheduled to ' || scheduled_date || ' at ' || scheduled_time,
        jsonb_build_object(
            'appointment_id', p_appointment_id,
            'scheduled_date', scheduled_date,
            'scheduled_time', scheduled_time
        ),
        NOW()
    );
    
    -- Notify doctor
    INSERT INTO notifications (
        clinic_id,
        user_id,
        type,
        title,
        message,
        data,
        created_at
    ) VALUES (
        clinic_id,
        doctor_user_id,
        'appointment_updated',
        'Appointment Updated',
        'An appointment has been rescheduled to ' || scheduled_date || ' at ' || scheduled_time,
        jsonb_build_object(
            'appointment_id', p_appointment_id,
            'scheduled_date', scheduled_date,
            'scheduled_time', scheduled_time
        ),
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notification for appointment cancellation
CREATE OR REPLACE FUNCTION notify_appointment_cancelled(p_appointment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    (patient_id, doctor_id, clinic_id) RECORD;
    patient_user_id UUID;
    doctor_user_id UUID;
BEGIN
    -- Get appointment details
    SELECT p.id, d.id, a.clinic_id
    INTO patient_id, doctor_id, clinic_id
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.id = p_appointment_id;
    
    -- Get user IDs
    SELECT user_id INTO patient_user_id FROM profiles WHERE id = patient_id;
    SELECT user_id INTO doctor_user_id FROM profiles WHERE id = doctor_id;
    
    -- Notify patient
    INSERT INTO notifications (
        clinic_id,
        user_id,
        type,
        title,
        message,
        data,
        created_at
    ) VALUES (
        clinic_id,
        patient_user_id,
        'appointment_cancelled',
        'Appointment Cancelled',
        'Your appointment has been cancelled',
        jsonb_build_object('appointment_id', p_appointment_id),
        NOW()
    );
    
    -- Notify doctor
    INSERT INTO notifications (
        clinic_id,
        user_id,
        type,
        title,
        message,
        data,
        created_at
    ) VALUES (
        clinic_id,
        doctor_user_id,
        'appointment_cancelled',
        'Appointment Cancelled',
        'An appointment has been cancelled',
        jsonb_build_object('appointment_id', p_appointment_id),
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Invoice Notifications
-- ============================================================================

-- Create notification for invoice generated
CREATE OR REPLACE FUNCTION notify_invoice_generated(p_invoice_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    (patient_id, clinic_id, invoice_number, total_amount) RECORD;
    patient_user_id UUID;
BEGIN
    -- Get invoice details
    SELECT p.id, i.clinic_id, i.invoice_number, i.total_amount
    INTO patient_id, clinic_id, invoice_number, total_amount
    FROM invoices i
    JOIN patients p ON i.patient_id = p.id
    WHERE i.id = p_invoice_id;
    
    -- Get user ID
    SELECT user_id INTO patient_user_id FROM profiles WHERE id = patient_id;
    
    -- Notify patient
    INSERT INTO notifications (
        clinic_id,
        user_id,
        type,
        title,
        message,
        data,
        created_at
    ) VALUES (
        clinic_id,
        patient_user_id,
        'invoice_generated',
        'New Invoice Generated',
        'Invoice ' || invoice_number || ' for $' || total_amount || ' has been generated',
        jsonb_build_object(
            'invoice_id', p_invoice_id,
            'invoice_number', invoice_number,
            'amount', total_amount
        ),
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Payment Notifications
-- ============================================================================

-- Create notification for payment received
CREATE OR REPLACE FUNCTION notify_payment_received(p_payment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    (clinic_id, amount, invoice_number) RECORD;
BEGIN
    -- Get payment details
    SELECT p.clinic_id, p.amount, i.invoice_number
    INTO clinic_id, amount, invoice_number
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    WHERE p.id = p_payment_id;
    
    -- Notify clinic owner/admin (simplified - notify all admin users)
    INSERT INTO notifications (
        clinic_id,
        user_id,
        type,
        title,
        message,
        data,
        created_at
    ) SELECT
        clinic_id,
        ur.user_id,
        'payment_received',
        'Payment Received',
        'Payment of $' || amount || ' received for invoice ' || invoice_number,
        jsonb_build_object(
            'payment_id', p_payment_id,
            'amount', amount,
            'invoice_number', invoice_number
        ),
        NOW()
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.clinic_id = clinic_id
    AND ur.is_active = true
    AND r.name IN ('owner', 'administrator');
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- User Management Notifications
-- ============================================================================

-- Create notification for new user invitation
CREATE OR REPLACE FUNCTION notify_user_invitation(p_user_id UUID, p_invited_by UUID)
RETURNS BOOLEAN AS $$
DECLARE
    clinic_id UUID;
    inviter_name TEXT;
BEGIN
    -- Get clinic and inviter details
    SELECT p.clinic_id, CONCAT(pr.first_name, ' ', pr.last_name)
    INTO clinic_id, inviter_name
    FROM profiles p
    JOIN profiles pr ON p.id = pr.id
    WHERE p.id = p_invited_by;
    
    -- Notify invited user
    INSERT INTO notifications (
        clinic_id,
        user_id,
        type,
        title,
        message,
        data,
        created_at
    ) VALUES (
        clinic_id,
        p_user_id,
        'user_invitation',
        'Invitation to Join Clinic',
        'You have been invited to join the clinic by ' || inviter_name,
        jsonb_build_object('invited_by', p_invited_by),
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create notification for password change
CREATE OR REPLACE FUNCTION notify_password_changed(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    clinic_id UUID;
BEGIN
    -- Get clinic
    SELECT clinic_id INTO clinic_id
    FROM profiles
    WHERE id = p_user_id;
    
    -- Notify user
    INSERT INTO notifications (
        clinic_id,
        user_id,
        type,
        title,
        message,
        data,
        created_at
    ) VALUES (
        clinic_id,
        p_user_id,
        'password_changed',
        'Password Changed',
        'Your password has been changed successfully',
        jsonb_build_object('event', 'password_changed'),
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Notification Management
-- ============================================================================

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications
    SET is_read = true,
        read_at = NOW(),
        updated_at = NOW()
    WHERE id = p_notification_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications
    SET is_read = true,
        read_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id
    AND is_read = false;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Delete notification
CREATE OR REPLACE FUNCTION delete_notification(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM notifications
    WHERE id = p_notification_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
