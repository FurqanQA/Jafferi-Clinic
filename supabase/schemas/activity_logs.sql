-- ============================================================================
-- Jafferi Clinic - Activity Logs Schema
-- ============================================================================
-- Audit trail for user actions and system events.
-- Comprehensive logging of all user actions and system events for compliance and auditing purposes.
-- ============================================================================

-- Activity Logs Table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    user_id UUID,
    action action_enum NOT NULL,
    entity_type entity_type_enum,
    entity_id UUID,
    description TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_activity_logs_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_activity_logs_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Comments
COMMENT ON TABLE activity_logs IS 'Audit trail for user actions and system events. Each log belongs to exactly one clinic.';
COMMENT ON COLUMN activity_logs.id IS 'Unique identifier for the activity log';
COMMENT ON COLUMN activity_logs.clinic_id IS 'Foreign key to clinics table - log belongs to this clinic';
COMMENT ON COLUMN activity_logs.user_id IS 'Foreign key to profiles table - user who performed the action (optional)';
COMMENT ON COLUMN activity_logs.action IS 'Action type (login, logout, create, update, delete, view, etc.)';
COMMENT ON COLUMN activity_logs.entity_type IS 'Entity type affected (clinic, user, patient, appointment, etc.)';
COMMENT ON COLUMN activity_logs.entity_id IS 'ID of affected entity';
COMMENT ON COLUMN activity_logs.description IS 'Action description';
COMMENT ON COLUMN activity_logs.ip_address IS 'User IP address';
COMMENT ON COLUMN activity_logs.user_agent IS 'Browser user agent';
COMMENT ON COLUMN activity_logs.metadata IS 'Additional metadata (JSON)';
COMMENT ON COLUMN activity_logs.old_values IS 'Previous values before change (JSON)';
COMMENT ON COLUMN activity_logs.new_values IS 'New values after change (JSON)';
COMMENT ON COLUMN activity_logs.created_at IS 'Timestamp when the action occurred';

-- Indexes
CREATE INDEX idx_activity_logs_clinic_id ON activity_logs(clinic_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX idx_activity_logs_entity_id ON activity_logs(entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_clinic_user_action ON activity_logs(clinic_id, user_id, action);
CREATE INDEX idx_activity_logs_clinic_entity_action ON activity_logs(clinic_id, entity_type, action);
CREATE INDEX idx_activity_logs_clinic_created_at ON activity_logs(clinic_id, created_at);
