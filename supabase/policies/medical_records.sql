-- ============================================================================
-- Jafferi Clinic - Medical Records RLS Policies
-- ============================================================================
-- Row Level Security policies for the medical_records table.
-- Medical records contain sensitive patient health information (HIPAA).
-- Strict access control - only doctors can create/update, owners/admins can manage.
-- ============================================================================

-- Enable RLS
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Authenticated users can view medical records from their own clinic
CREATE POLICY "medical_records_select_own_clinic"
    ON medical_records
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

-- Only doctors can create medical records
CREATE POLICY "medical_records_doctor_insert"
    ON medical_records
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
CREATE POLICY "medical_records_patient_clinic_match"
    ON medical_records
    FOR INSERT
    TO authenticated
    WITH CHECK (
        patient_id IN (
            SELECT id 
            FROM patients 
            WHERE patients.clinic_id = medical_records.clinic_id
        )
    );

-- Ensure doctor belongs to the same clinic
CREATE POLICY "medical_records_doctor_clinic_match"
    ON medical_records
    FOR INSERT
    TO authenticated
    WITH CHECK (
        doctor_id IN (
            SELECT id 
            FROM doctors 
            WHERE doctors.clinic_id = medical_records.clinic_id
        )
    );

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Only doctors can update medical records they created
CREATE POLICY "medical_records_doctor_update_own"
    ON medical_records
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

-- Clinic owners and administrators can update any medical record (emergency override)
CREATE POLICY "medical_records_owner_admin_update"
    ON medical_records
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
            AND user_roles.clinic_id = medical_records.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator')
            )
        )
    );

-- Prevent modification of clinic_id (tenant isolation)
CREATE POLICY "medical_records_clinic_id_protect"
    ON medical_records
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        clinic_id IS NOT DISTINCT FROM (SELECT clinic_id FROM medical_records WHERE medical_records.id = id)
    );

-- Prevent modification of patient_id (record identity)
CREATE POLICY "medical_records_patient_id_protect"
    ON medical_records
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        patient_id IS NOT DISTINCT FROM (SELECT patient_id FROM medical_records WHERE medical_records.id = id)
    );

-- Prevent modification of doctor_id (record identity)
CREATE POLICY "medical_records_doctor_id_protect"
    ON medical_records
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        doctor_id IS NOT DISTINCT FROM (SELECT doctor_id FROM medical_records WHERE medical_records.id = id)
    );

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Only clinic owners can delete medical records (HIPAA compliance - requires audit trail)
CREATE POLICY "medical_records_owner_delete"
    ON medical_records
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
            AND user_roles.clinic_id = medical_records.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name = 'owner'
            )
        )
    );
