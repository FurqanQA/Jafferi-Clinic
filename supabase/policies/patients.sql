-- ============================================================================
-- Jafferi Clinic - Patients RLS Policies
-- ============================================================================
-- Row Level Security policies for the patients table.
-- Patients belong to exactly one clinic.
-- All clinic staff can view patients, but access control varies by role.
-- ============================================================================

-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Authenticated users can view patients from their own clinic
CREATE POLICY "patients_select_own_clinic"
    ON patients
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

-- Clinic owners, administrators, doctors, and receptionists can create patients
CREATE POLICY "patients_staff_insert"
    ON patients
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
            AND user_roles.clinic_id = patients.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator', 'doctor', 'receptionist')
            )
        )
    );

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Clinic owners and administrators can update any patient
CREATE POLICY "patients_owner_admin_update"
    ON patients
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
            AND user_roles.clinic_id = patients.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator')
            )
        )
    );

-- Doctors can update patient medical information
CREATE POLICY "patients_doctor_update"
    ON patients
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
            AND user_roles.clinic_id = patients.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name = 'doctor'
            )
        )
    );

-- Receptionists can update patient contact information only
CREATE POLICY "patients_receptionist_update_contact"
    ON patients
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
            AND user_roles.clinic_id = patients.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name = 'receptionist'
            )
        )
    )
    WITH CHECK (
        -- Only allow updating contact fields
        email IS NOT DISTINCT FROM (SELECT email FROM patients WHERE patients.id = id)
        OR phone IS NOT DISTINCT FROM (SELECT phone FROM patients WHERE patients.id = id)
        OR secondary_phone IS NOT DISTINCT FROM (SELECT secondary_phone FROM patients WHERE patients.id = id)
        OR address IS NOT DISTINCT FROM (SELECT address FROM patients WHERE patients.id = id)
        OR city IS NOT DISTINCT FROM (SELECT city FROM patients WHERE patients.id = id)
        OR state IS NOT DISTINCT FROM (SELECT state FROM patients WHERE patients.id = id)
        OR country IS NOT DISTINCT FROM (SELECT country FROM patients WHERE patients.id = id)
        OR postal_code IS NOT DISTINCT FROM (SELECT postal_code FROM patients WHERE patients.id = id)
    );

-- Prevent modification of clinic_id (tenant isolation)
CREATE POLICY "patients_clinic_id_protect"
    ON patients
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        clinic_id IS NOT DISTINCT FROM (SELECT clinic_id FROM patients WHERE patients.id = id)
    );

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Only clinic owners can delete patient records
CREATE POLICY "patients_owner_delete"
    ON patients
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
            AND user_roles.clinic_id = patients.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name = 'owner'
            )
        )
    );
