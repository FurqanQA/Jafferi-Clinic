-- ============================================================================
-- Jafferi Clinic - Profiles RLS Policies
-- ============================================================================
-- Row Level Security policies for the profiles table.
-- Profiles extends auth.users with clinic-specific data.
-- Each user belongs to exactly one clinic.
-- ============================================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Authenticated users can view profiles from their own clinic
CREATE POLICY "profiles_select_own_clinic"
    ON profiles
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

-- Authenticated users can create their own profile (during registration)
CREATE POLICY "profiles_insert_own"
    ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        id = auth.uid()
    );

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (
        id = auth.uid()
    );

-- Clinic owners and administrators can update any profile in their clinic
CREATE POLICY "profiles_owner_admin_update_clinic"
    ON profiles
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
            FROM user_roles 
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.clinic_id = profiles.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator')
            )
        )
    );

-- Users cannot change their own clinic_id (tenant isolation)
CREATE POLICY "profiles_clinic_id_protect"
    ON profiles
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        clinic_id IS NOT DISTINCT FROM (SELECT clinic_id FROM profiles WHERE profiles.id = id)
    );

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Only clinic owners can delete profiles (user management)
CREATE POLICY "profiles_owner_delete"
    ON profiles
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
            FROM user_roles 
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.clinic_id = profiles.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name = 'owner'
            )
        )
    );

-- Prevent users from deleting their own profile
CREATE POLICY "profiles_prevent_self_delete"
    ON profiles
    FOR DELETE
    TO authenticated
    USING (
        id != auth.uid()
    );
