-- ============================================================================
-- Jafferi Clinic - Notification Triggers
-- ============================================================================
-- Triggers for notification management, including automatic notification creation
-- for various events and timestamp management.
-- ============================================================================

-- ============================================================================
-- Notification Triggers
-- ============================================================================

-- Update updated_at timestamp on notifications update
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Automatic Notification Triggers
-- ============================================================================

-- Create notification when appointment is created
CREATE TRIGGER notify_on_appointment_created
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION notify_appointment_created(NEW.id);

-- Create notification when appointment is updated
CREATE TRIGGER notify_on_appointment_updated
    AFTER UPDATE ON appointments
    FOR EACH ROW
    WHEN (OLD.scheduled_date IS DISTINCT FROM NEW.scheduled_date 
          OR OLD.scheduled_time IS DISTINCT FROM NEW.scheduled_time 
          OR OLD.doctor_id IS DISTINCT FROM NEW.doctor_id)
    EXECUTE FUNCTION notify_appointment_updated(NEW.id);

-- Create notification when appointment is cancelled
CREATE TRIGGER notify_on_appointment_cancelled
    AFTER UPDATE ON appointments
    FOR EACH ROW
    WHEN (OLD.status_id IS DISTINCT FROM NEW.status_id 
          AND NEW.status_id = (SELECT id FROM appointment_status WHERE name = 'cancelled'))
    EXECUTE FUNCTION notify_appointment_cancelled(NEW.id);

-- Create notification when invoice is generated
CREATE TRIGGER notify_on_invoice_created
    AFTER INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION notify_invoice_generated(NEW.id);

-- Create notification when payment is received
CREATE TRIGGER notify_on_payment_received
    AFTER INSERT ON payments
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION notify_payment_received(NEW.id);

-- ============================================================================
-- File Attachments Triggers
-- ============================================================================

-- Update updated_at timestamp on file_attachments update
CREATE TRIGGER update_file_attachments_updated_at
    BEFORE UPDATE ON file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log file attachment insert activity
CREATE TRIGGER log_file_attachment_insert
    AFTER INSERT ON file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION log_insert(
        NEW.clinic_id,
        NEW.uploaded_by,
        'file_attachments',
        NEW.id,
        jsonb_build_object(
            'file_name', NEW.file_name,
            'entity_type', NEW.entity_type,
            'entity_id', NEW.entity_id
        )
    );

-- Log file attachment delete activity
CREATE TRIGGER log_file_attachment_delete
    AFTER DELETE ON file_attachments
    FOR EACH ROW
    EXECUTE FUNCTION log_delete(
        OLD.clinic_id,
        OLD.uploaded_by,
        'file_attachments',
        OLD.id,
        jsonb_build_object('file_name', OLD.file_name)
    );
