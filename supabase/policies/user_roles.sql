-- ============================================================================
-- Jafferi Clinic - User Roles RLS Policies
-- ============================================================================
-- Row Level Security policies for the user_roles table.
-- User roles is a junction table linking users to roles within a clinic.
-- ============================================================================

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Authenticated users can view roles from their own clinic
CREATE POLICY "user_roles_select_own_clinic"
    ON user_roles
    FOR SELECT
    TO authenticated
    USING (
        clinic_id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- ============================================================================
-- INSERT Policies
-- ============================================================================

-- Only clinic owners and administrators can assign roles
CREATE POLICY "user_roles_owner_admin_insert"
    ON user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        clinic_id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 
            FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.clinic_id = user_roles.clinic_id
            AND ur.is_active = true
            AND ur.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator')
            )
        )
    );

-- Prevent assigning owner role to users who already have it (single owner per clinic)
CREATE POLICY "user_roles_prevent_duplicate_owner"
    ON user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        NOT EXISTS (
            SELECT 1 
            FROM user_roles ur
            WHERE ur.clinic_id = user_roles.clinic_id
            AND ur.role_id IN (SELECT id FROM roles WHERE name = 'owner')
            AND ur.is_active = true
        )
        OR role_id NOT IN (SELECT id FROM roles WHERE name = 'owner')
    );

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Only clinic owners and administrators can update role assignments
CREATE POLICY "user_roles_owner_admin_update"
    ON user_roles
    FOR UPDATE
    TO authenticated
    USING (
        clinic_id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 
            FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.clinic_id = user_roles.clinic_id
            AND ur.is_active = true
            AND ur.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator')
            )
        )
    );

-- Prevent modification of clinic_id (tenant isolation)
CREATE POLICY "user_roles_clinic_id_protect"
    ON user_roles
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        clinic_id IS NOT DISTINCT FROM (SELECT clinic_id FROM user_roles WHERE user_roles.id = id)
    );

-- Prevent users from modifying their own role assignments (owner can't demote themselves)
CREATE POLICY "user_roles_prevent_self_modify"
    ON user_roles
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        user_id != auth.uid()
        OR NOT EXISTS (
            SELECT 1 
            FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.clinic_id = user_roles.clinic_id
            AND ur.is_active = true
            AND ur.role_id IN (SELECT id FROM roles WHERE name = 'owner')
        )
    );

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Only clinic owners can delete role assignments
CREATE POLICY "user_roles_owner_delete"
    ON user_roles
    FOR DELETE
    TO authenticated
    USING (
        clinic_id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 
            FROM user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.clinic_id = user_roles.clinic_id
            AND ur.is_active = true
            AND ur.role_id IN (
                SELECT id FROM roles WHERE name = 'owner'
            )
        )
    );

-- Prevent deletion of owner role (must have at least one owner)
CREATE POLICY "user_roles_prevent_owner_delete"
    ON user_roles
    FOR DELETE
    TO authenticated
    USING (
        role_id NOT IN (SELECT id FROM roles WHERE name = 'owner')
        OR (
            SELECT COUNT(*) 
            FROM user_roles 
            WHERE clinic_id = user_roles.clinic_id
            AND role_id IN (SELECT id FROM roles WHERE name = 'owner')
            AND is_active = true
        ) > 1
    );
