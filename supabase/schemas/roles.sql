-- ============================================================================
-- Jafferi Clinic - Roles Schema
-- ============================================================================
-- Defines available roles in the system for Role-Based Access Control (RBAC).
-- This is a global table shared across all clinics.
-- ============================================================================

-- Roles Table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    is_system_role BOOLEAN NOT NULL DEFAULT false,
    level INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE roles IS 'Defines available system roles for RBAC. Global table shared across all clinics.';
COMMENT ON COLUMN roles.id IS 'Unique identifier for the role';
COMMENT ON COLUMN roles.name IS 'System role name (owner, administrator, doctor, receptionist, accountant, staff)';
COMMENT ON COLUMN roles.display_name IS 'Human-readable role name for UI display';
COMMENT ON COLUMN roles.description IS 'Description of the role and its purpose';
COMMENT ON COLUMN roles.permissions IS 'JSON object defining role permissions';
COMMENT ON COLUMN roles.is_system_role IS 'Whether this is a system role that cannot be deleted';
COMMENT ON COLUMN roles.level IS 'Role hierarchy level (higher = more permissions)';
COMMENT ON COLUMN roles.created_at IS 'Timestamp when the role was created';
COMMENT ON COLUMN roles.updated_at IS 'Timestamp when the role was last updated';

-- Indexes
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_level ON roles(level);
CREATE INDEX idx_roles_is_system_role ON roles(is_system_role);

-- Triggers for updated_at
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
