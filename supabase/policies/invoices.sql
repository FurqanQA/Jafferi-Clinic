-- ============================================================================
-- Jafferi Clinic - Invoices RLS Policies
-- ============================================================================
-- Row Level Security policies for the invoices table.
-- Invoices contain financial information.
-- Accountants and owners/admins can manage billing.
-- ============================================================================

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Authenticated users can view invoices from their own clinic
CREATE POLICY "invoices_select_own_clinic"
    ON invoices
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

-- Clinic owners, administrators, and accountants can create invoices
CREATE POLICY "invoices_billing_staff_insert"
    ON invoices
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
            AND user_roles.clinic_id = invoices.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator', 'accountant')
            )
        )
    );

-- Ensure patient belongs to the same clinic
CREATE POLICY "invoices_patient_clinic_match"
    ON invoices
    FOR INSERT
    TO authenticated
    WITH CHECK (
        patient_id IN (
            SELECT id 
            FROM patients 
            WHERE patients.clinic_id = invoices.clinic_id
        )
    );

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Clinic owners, administrators, and accountants can update invoices
CREATE POLICY "invoices_billing_staff_update"
    ON invoices
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
            AND user_roles.clinic_id = invoices.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator', 'accountant')
            )
        )
    );

-- Prevent modification of clinic_id (tenant isolation)
CREATE POLICY "invoices_clinic_id_protect"
    ON invoices
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        clinic_id IS NOT DISTINCT FROM (SELECT clinic_id FROM invoices WHERE invoices.id = id)
    );

-- Prevent modification of patient_id (invoice identity)
CREATE POLICY "invoices_patient_id_protect"
    ON invoices
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        patient_id IS NOT DISTINCT FROM (SELECT patient_id FROM invoices WHERE invoices.id = id)
    );

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Only clinic owners can delete invoice records
CREATE POLICY "invoices_owner_delete"
    ON invoices
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
            AND user_roles.clinic_id = invoices.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name = 'owner'
            )
        )
    );
