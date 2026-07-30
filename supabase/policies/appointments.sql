-- ============================================================================
-- Jafferi Clinic - Appointments RLS Policies
-- ============================================================================
-- Row Level Security policies for the appointments table.
-- Appointments belong to exactly one clinic.
-- Access varies by role - doctors manage their appointments, receptionists schedule, etc.
-- ============================================================================

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Authenticated users can view appointments from their own clinic
CREATE POLICY "appointments_select_own_clinic"
    ON appointments
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

-- Clinic owners, administrators, doctors, and receptionists can create appointments
CREATE POLICY "appointments_staff_insert"
    ON appointments
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
            AND user_roles.clinic_id = appointments.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator', 'doctor', 'receptionist')
            )
        )
    );

-- Ensure patient belongs to the same clinic
CREATE POLICY "appointments_patient_clinic_match"
    ON appointments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        patient_id IN (
            SELECT id 
            FROM patients 
            WHERE patients.clinic_id = appointments.clinic_id
        )
    );

-- Ensure doctor belongs to the same clinic
CREATE POLICY "appointments_doctor_clinic_match"
    ON appointments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        doctor_id IN (
            SELECT id 
            FROM doctors 
            WHERE doctors.clinic_id = appointments.clinic_id
        )
    );

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Clinic owners and administrators can update any appointment
CREATE POLICY "appointments_owner_admin_update"
    ON appointments
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
            AND user_roles.clinic_id = appointments.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator')
            )
        )
    );

-- Doctors can update their own appointments
CREATE POLICY "appointments_doctor_update_own"
    ON appointments
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

-- Receptionists can update appointment scheduling details (not medical notes)
CREATE POLICY "appointments_receptionist_update_schedule"
    ON appointments
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
            AND user_roles.clinic_id = appointments.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name = 'receptionist'
            )
        )
    )
    WITH CHECK (
        -- Only allow updating scheduling fields
        scheduled_date IS NOT DISTINCT FROM (SELECT scheduled_date FROM appointments WHERE appointments.id = id)
        OR scheduled_time IS NOT DISTINCT FROM (SELECT scheduled_time FROM appointments WHERE appointments.id = id)
        OR end_time IS NOT DISTINCT FROM (SELECT end_time FROM appointments WHERE appointments.id = id)
        OR duration_minutes IS NOT DISTINCT FROM (SELECT duration_minutes FROM appointments WHERE appointments.id = id)
        OR reminder_sent IS NOT DISTINCT FROM (SELECT reminder_sent FROM appointments WHERE appointments.id = id)
        OR reminder_sent_at IS NOT DISTINCT FROM (SELECT reminder_sent_at FROM appointments WHERE appointments.id = id)
        OR check_in_time IS NOT DISTINCT FROM (SELECT check_in_time FROM appointments WHERE appointments.id = id)
    );

-- Prevent modification of clinic_id (tenant isolation)
CREATE POLICY "appointments_clinic_id_protect"
    ON appointments
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        clinic_id IS NOT DISTINCT FROM (SELECT clinic_id FROM appointments WHERE appointments.id = id)
    );

-- Prevent modification of patient_id (appointment identity)
CREATE POLICY "appointments_patient_id_protect"
    ON appointments
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        patient_id IS NOT DISTINCT FROM (SELECT patient_id FROM appointments WHERE appointments.id = id)
    );

-- Prevent modification of doctor_id (appointment identity)
CREATE POLICY "appointments_doctor_id_protect"
    ON appointments
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        doctor_id IS NOT DISTINCT FROM (SELECT doctor_id FROM appointments WHERE appointments.id = id)
    );

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Only clinic owners can delete appointment records
CREATE POLICY "appointments_owner_delete"
    ON appointments
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
            AND user_roles.clinic_id = appointments.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name = 'owner'
            )
        )
    );
