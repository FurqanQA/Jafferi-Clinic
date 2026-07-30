-- ============================================================================
-- Jafferi Clinic - Prescriptions RLS Policies
-- ============================================================================
-- Row Level Security policies for the prescriptions table.
-- Prescriptions contain sensitive medication information.
-- Only doctors can create/update prescriptions.
-- ============================================================================

-- Enable RLS
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Authenticated users can view prescriptions from their own clinic
CREATE POLICY "prescriptions_select_own_clinic"
    ON prescriptions
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

-- Only doctors can create prescriptions
CREATE POLICY "prescriptions_doctor_insert"
    ON prescriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        clinic_id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
        AND doctor_id IN (
            SELECT id 
            FROM doctors 
            WHERE doctors.user_id = auth.uid()
        )
    );

-- Ensure patient belongs to the same clinic
CREATE POLICY "prescriptions_patient_clinic_match"
    ON prescriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        patient_id IN (
            SELECT id 
            FROM patients 
            WHERE patients.clinic_id = prescriptions.clinic_id
        )
    );

-- Ensure doctor belongs to the same clinic
CREATE POLICY "prescriptions_doctor_clinic_match"
    ON prescriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        doctor_id IN (
            SELECT id 
            FROM doctors 
            WHERE doctors.clinic_id = prescriptions.clinic_id
        )
    );

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Only doctors can update prescriptions they created
CREATE POLICY "prescriptions_doctor_update_own"
    ON prescriptions
    FOR UPDATE
    TO authenticated
    USING (
        clinic_id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
        AND doctor_id IN (
            SELECT id 
            FROM doctors 
            WHERE doctors.user_id = auth.uid()
        )
    );

-- Clinic owners and administrators can update any prescription (emergency override)
CREATE POLICY "prescriptions_owner_admin_update"
    ON prescriptions
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
            AND user_roles.clinic_id = prescriptions.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator')
            )
        )
    );

-- Prevent modification of clinic_id (tenant isolation)
CREATE POLICY "prescriptions_clinic_id_protect"
    ON prescriptions
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        clinic_id IS NOT DISTINCT FROM (SELECT clinic_id FROM prescriptions WHERE prescriptions.id = id)
    );

-- Prevent modification of patient_id (prescription identity)
CREATE POLICY "prescriptions_patient_id_protect"
    ON prescriptions
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        patient_id IS NOT DISTINCT FROM (SELECT patient_id FROM prescriptions WHERE prescriptions.id = id)
    );

-- Prevent modification of doctor_id (prescription identity)
CREATE POLICY "prescriptions_doctor_id_protect"
    ON prescriptions
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        doctor_id IS NOT DISTINCT FROM (SELECT doctor_id FROM prescriptions WHERE prescriptions.id = id)
    );

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Only clinic owners can delete prescription records
CREATE POLICY "prescriptions_owner_delete"
    ON prescriptions
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
            AND user_roles.clinic_id = prescriptions.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name = 'owner'
            )
        )
    );
