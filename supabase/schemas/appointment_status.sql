-- ============================================================================
-- Jafferi Clinic - Appointment Status Schema
-- ============================================================================
-- Defines possible appointment statuses.
-- Reference table for appointment status values (scheduled, confirmed, in-progress, completed, cancelled, no-show).
-- This is a global table shared across all clinics.
-- ============================================================================

-- Appointment Status Table
CREATE TABLE appointment_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name appointment_status_enum NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20),
    is_final BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE appointment_status IS 'Defines possible appointment statuses. Global table shared across all clinics.';
COMMENT ON COLUMN appointment_status.id IS 'Unique identifier for the status';
COMMENT ON COLUMN appointment_status.name IS 'Status name (scheduled, confirmed, in_progress, completed, cancelled, no_show)';
COMMENT ON COLUMN appointment_status.display_name IS 'Human-readable status name';
COMMENT ON COLUMN appointment_status.description IS 'Status description';
COMMENT ON COLUMN appointment_status.color IS 'UI color code';
COMMENT ON COLUMN appointment_status.is_final IS 'Whether status is final (no further changes)';
COMMENT ON COLUMN appointment_status.sort_order IS 'Display order';
COMMENT ON COLUMN appointment_status.created_at IS 'Timestamp when the status was created';
COMMENT ON COLUMN appointment_status.updated_at IS 'Timestamp when the status was last updated';

-- Indexes
CREATE INDEX idx_appointment_status_name ON appointment_status(name);
CREATE INDEX idx_appointment_status_sort_order ON appointment_status(sort_order);

-- Triggers for updated_at
CREATE TRIGGER update_appointment_status_updated_at
    BEFORE UPDATE ON appointment_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
