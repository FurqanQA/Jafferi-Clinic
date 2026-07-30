-- ============================================================================
-- Jafferi Clinic - Roles RLS Policies
-- ============================================================================
-- Row Level Security policies for the roles table.
-- Roles is a global table shared across all clinics.
-- ============================================================================

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Public read access to roles (needed for UI dropdowns, role assignment)
CREATE POLICY "roles_public_select"
    ON roles
    FOR SELECT
    TO public
    USING (true);

-- ============================================================================
-- INSERT Policies
-- ============================================================================

-- Only authenticated users with owner or administrator role can create roles
CREATE POLICY "roles_owner_admin_insert"
    ON roles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM profiles 
            WHERE profiles.id = auth.uid()
            AND profiles.clinic_id IS NOT NULL
            AND EXISTS (
                SELECT 1 
                FROM user_roles 
                WHERE user_roles.user_id = auth.uid()
                AND user_roles.is_active = true
                AND user_roles.role_id IN (
                    SELECT id FROM roles WHERE name IN ('owner', 'administrator')
                )
            )
        )
    );

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Only authenticated users with owner or administrator role can update roles
CREATE POLICY "roles_owner_admin_update"
    ON roles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM profiles 
            WHERE profiles.id = auth.uid()
            AND profiles.clinic_id IS NOT NULL
            AND EXISTS (
                SELECT 1 
                FROM user_roles 
                WHERE user_roles.user_id = auth.uid()
                AND user_roles.is_active = true
                AND user_roles.role_id IN (
                    SELECT id FROM roles WHERE name IN ('owner', 'administrator')
                )
            )
        )
    );

-- Prevent modification of system roles
CREATE POLICY "roles_system_role_protect"
    ON roles
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        is_system_role = false
    );

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Only authenticated users with owner or administrator role can delete roles
CREATE POLICY "roles_owner_admin_delete"
    ON roles
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM profiles 
            WHERE profiles.id = auth.uid()
            AND profiles.clinic_id IS NOT NULL
            AND EXISTS (
                SELECT 1 
                FROM user_roles 
                WHERE user_roles.user_id = auth.uid()
                AND user_roles.is_active = true
                AND user_roles.role_id IN (
                    SELECT id FROM roles WHERE name IN ('owner', 'administrator')
                )
            )
        )
    );

-- Prevent deletion of system roles
CREATE POLICY "roles_system_role_delete_protect"
    ON roles
    FOR DELETE
    TO authenticated
    USING (
        is_system_role = false
    );
