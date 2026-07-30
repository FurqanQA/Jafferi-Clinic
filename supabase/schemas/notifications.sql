-- ============================================================================
-- Jafferi Clinic - Notifications Schema
-- ============================================================================
-- Manages system notifications for users.
-- Notification records for in-app, email, SMS, and push notifications with delivery tracking and status.
-- ============================================================================

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    user_id UUID,
    type notification_type_enum NOT NULL,
    channel notification_channel_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    priority notification_priority_enum NOT NULL DEFAULT 'normal',
    status notification_status_enum NOT NULL DEFAULT 'pending',
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    related_entity_type entity_type_enum,
    related_entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_notifications_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_notifications_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    -- Check Constraints
    CONSTRAINT chk_notifications_retry_count_non_negative 
        CHECK (retry_count >= 0)
);

-- Comments
COMMENT ON TABLE notifications IS 'Manages system notifications for users. Each notification belongs to exactly one clinic.';
COMMENT ON COLUMN notifications.id IS 'Unique identifier for the notification';
COMMENT ON COLUMN notifications.clinic_id IS 'Foreign key to clinics table - notification belongs to this clinic';
COMMENT ON COLUMN notifications.user_id IS 'Foreign key to profiles table - notification for this user (optional)';
COMMENT ON COLUMN notifications.type IS 'Notification type (appointment, payment, system, reminder, alert)';
COMMENT ON COLUMN notifications.channel IS 'Delivery channel (in_app, email, sms, whatsapp, push)';
COMMENT ON COLUMN notifications.title IS 'Notification title';
COMMENT ON COLUMN notifications.message IS 'Notification message';
COMMENT ON COLUMN notifications.data IS 'Additional notification data (JSON)';
COMMENT ON COLUMN notifications.priority IS 'Priority level (low, normal, high, urgent)';
COMMENT ON COLUMN notifications.status IS 'Delivery status (pending, sent, delivered, failed)';
COMMENT ON COLUMN notifications.scheduled_for IS 'Scheduled delivery time';
COMMENT ON COLUMN notifications.sent_at IS 'Actual send time';
COMMENT ON COLUMN notifications.delivered_at IS 'Delivery confirmation time';
COMMENT ON COLUMN notifications.read_at IS 'Read timestamp';
COMMENT ON COLUMN notifications.error_message IS 'Error message if failed';
COMMENT ON COLUMN notifications.retry_count IS 'Number of retry attempts';
COMMENT ON COLUMN notifications.expires_at IS 'Notification expiration time';
COMMENT ON COLUMN notifications.related_entity_type IS 'Related entity type (appointment, invoice, etc.)';
COMMENT ON COLUMN notifications.related_entity_id IS 'Related entity ID';
COMMENT ON COLUMN notifications.created_at IS 'Timestamp when the notification was created';
COMMENT ON COLUMN notifications.updated_at IS 'Timestamp when the notification was last updated';
COMMENT ON COLUMN notifications.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_notifications_clinic_id ON notifications(clinic_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_channel ON notifications(channel);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_deleted_at ON notifications(deleted_at);
CREATE INDEX idx_notifications_clinic_user_status ON notifications(clinic_id, user_id, status);
CREATE INDEX idx_notifications_clinic_status_scheduled ON notifications(clinic_id, status, scheduled_for);

-- Triggers for updated_at
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
