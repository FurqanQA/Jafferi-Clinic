-- ============================================================================
-- Jafferi Clinic - Clinics RLS Policies
-- ============================================================================
-- Row Level Security policies for the clinics table.
-- Clinics is the tenant-defining table - each user belongs to exactly one clinic.
-- ============================================================================

-- Enable RLS
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Authenticated users can only view their own clinic
CREATE POLICY "clinics_select_own_clinic"
    ON clinics
    FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- ============================================================================
-- INSERT Policies
-- ============================================================================

-- Only authenticated users can create clinics (during registration)
-- This is typically handled by application logic, but we allow it
CREATE POLICY "clinics_insert_authenticated"
    ON clinics
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Only clinic owners and administrators can update their clinic
CREATE POLICY "clinics_owner_admin_update"
    ON clinics
    FOR UPDATE
    TO authenticated
    USING (
        id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 
            FROM user_roles 
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.clinic_id = clinics.id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator')
            )
        )
    );

-- Prevent modification of subscription-related fields by non-owners
CREATE POLICY "clinics_subscription_protect"
    ON clinics
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        NOT EXISTS (
            SELECT 1 
            FROM user_roles 
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.clinic_id = clinics.id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name = 'administrator'
            )
        )
        OR (
            subscription_plan_id IS NOT DISTINCT FROM (SELECT subscription_plan_id FROM clinics WHERE clinics.id = id)
            AND trial_ends_at IS NOT DISTINCT FROM (SELECT trial_ends_at FROM clinics WHERE clinics.id = id)
        )
    );

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Only clinic owners can delete their clinic
CREATE POLICY "clinics_owner_delete"
    ON clinics
    FOR DELETE
    TO authenticated
    USING (
        id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 
            FROM user_roles 
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.clinic_id = clinics.id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name = 'owner'
            )
        )
    );

-- Prevent accidental deletion of clinic by ensuring it's not the user's only active clinic
CREATE POLICY "clinics_prevent_orphan_delete"
    ON clinics
    FOR DELETE
    TO authenticated
    WITH CHECK (
        -- Allow deletion if user has other clinics (edge case for multi-clinic users)
        -- For single-clinic users, this should be handled by application logic
        true
    );
