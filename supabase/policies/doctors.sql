-- ============================================================================
-- Jafferi Clinic - Doctors RLS Policies
-- ============================================================================
-- Row Level Security policies for the doctors table.
-- Doctors are users with extended medical credentials.
-- Each doctor belongs to exactly one clinic.
-- ============================================================================

-- Enable RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Authenticated users can view doctors from their own clinic
CREATE POLICY "doctors_select_own_clinic"
    ON doctors
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

-- Only clinic owners and administrators can create doctor records
CREATE POLICY "doctors_owner_admin_insert"
    ON doctors
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
            FROM user_roles 
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.clinic_id = doctors.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator')
            )
        )
    );

-- Ensure user_id belongs to the same clinic
CREATE POLICY "doctors_user_clinic_match"
    ON doctors
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IN (
            SELECT id 
            FROM profiles 
            WHERE profiles.clinic_id = doctors.clinic_id
        )
    );

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Doctors can update their own profile
CREATE POLICY "doctors_update_own"
    ON doctors
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
    );

-- Clinic owners and administrators can update any doctor in their clinic
CREATE POLICY "doctors_owner_admin_update_clinic"
    ON doctors
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
            AND user_roles.clinic_id = doctors.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator')
            )
        )
    );

-- Prevent modification of clinic_id (tenant isolation)
CREATE POLICY "doctors_clinic_id_protect"
    ON doctors
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        clinic_id IS NOT DISTINCT FROM (SELECT clinic_id FROM doctors WHERE doctors.id = id)
    );

-- Prevent modification of user_id (doctor identity)
CREATE POLICY "doctors_user_id_protect"
    ON doctors
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        user_id IS NOT DISTINCT FROM (SELECT user_id FROM doctors WHERE doctors.id = id)
    );

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Only clinic owners can delete doctor records
CREATE POLICY "doctors_owner_delete"
    ON doctors
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
            AND user_roles.clinic_id = doctors.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name = 'owner'
            )
        )
    );
