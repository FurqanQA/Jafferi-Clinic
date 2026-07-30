-- ============================================================================
-- Jafferi Clinic - User Roles Schema
-- ============================================================================
-- Junction table for many-to-many relationship between users and roles.
-- Assigns roles to users within their clinic context.
-- ============================================================================

-- User Roles Table
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    clinic_id UUID NOT NULL,
    role_id UUID NOT NULL,
    assigned_by UUID,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_user_roles_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_user_roles_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_user_roles_role_id 
        FOREIGN KEY (role_id) 
        REFERENCES roles(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_user_roles_assigned_by 
        FOREIGN KEY (assigned_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    -- Unique Constraint
    CONSTRAINT uk_user_roles_user_clinic_role 
        UNIQUE (user_id, clinic_id, role_id)
);

-- Comments
COMMENT ON TABLE user_roles IS 'Junction table for many-to-many relationship between users and roles. Role assignments are clinic-specific.';
COMMENT ON COLUMN user_roles.id IS 'Unique identifier for the role assignment';
COMMENT ON COLUMN user_roles.user_id IS 'Foreign key to profiles table - user being assigned the role';
COMMENT ON COLUMN user_roles.clinic_id IS 'Foreign key to clinics table - clinic context for the role assignment';
COMMENT ON COLUMN user_roles.role_id IS 'Foreign key to roles table - role being assigned';
COMMENT ON COLUMN user_roles.assigned_by IS 'Foreign key to profiles table - user who assigned this role';
COMMENT ON COLUMN user_roles.assigned_at IS 'Timestamp when the role was assigned';
COMMENT ON COLUMN user_roles.expires_at IS 'Optional expiration date for the role assignment';
COMMENT ON COLUMN user_roles.is_active IS 'Whether the role assignment is currently active';
COMMENT ON COLUMN user_roles.created_at IS 'Timestamp when the role assignment was created';
COMMENT ON COLUMN user_roles.updated_at IS 'Timestamp when the role assignment was last updated';

-- Indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_clinic_id ON user_roles(clinic_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_is_active ON user_roles(is_active);
CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at);
CREATE INDEX idx_user_roles_clinic_is_active ON user_roles(clinic_id, is_active);
CREATE INDEX idx_user_roles_assigned_by ON user_roles(assigned_by);

-- Triggers for updated_at
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
