-- ============================================================================
-- Jafferi Clinic - Payments RLS Policies
-- ============================================================================
-- Row Level Security policies for the payments table.
-- Payments contain financial transaction information.
-- Accountants and owners/admins can manage payments.
-- ============================================================================

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Authenticated users can view payments from their own clinic
CREATE POLICY "payments_select_own_clinic"
    ON payments
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

-- Clinic owners, administrators, and accountants can create payment records
CREATE POLICY "payments_billing_staff_insert"
    ON payments
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
            AND user_roles.clinic_id = payments.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator', 'accountant')
            )
        )
    );

-- Ensure invoice belongs to the same clinic
CREATE POLICY "payments_invoice_clinic_match"
    ON payments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        invoice_id IN (
            SELECT id 
            FROM invoices 
            WHERE invoices.clinic_id = payments.clinic_id
        )
    );

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Clinic owners, administrators, and accountants can update payments
CREATE POLICY "payments_billing_staff_update"
    ON payments
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
            AND user_roles.clinic_id = payments.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator', 'accountant')
            )
        )
    );

-- Prevent modification of clinic_id (tenant isolation)
CREATE POLICY "payments_clinic_id_protect"
    ON payments
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        clinic_id IS NOT DISTINCT FROM (SELECT clinic_id FROM payments WHERE payments.id = id)
    );

-- Prevent modification of invoice_id (payment identity)
CREATE POLICY "payments_invoice_id_protect"
    ON payments
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        invoice_id IS NOT DISTINCT FROM (SELECT invoice_id FROM payments WHERE payments.id = id)
    );

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Only clinic owners can delete payment records
CREATE POLICY "payments_owner_delete"
    ON payments
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
            AND user_roles.clinic_id = payments.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name = 'owner'
            )
        )
    );
