-- ============================================================================
-- Jafferi Clinic - Expenses RLS Policies
-- ============================================================================
-- Row Level Security policies for the expenses table.
-- Expenses contain clinic operational cost information.
-- Accountants and owners/admins can manage expenses.
-- ============================================================================

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Authenticated users can view expenses from their own clinic
CREATE POLICY "expenses_select_own_clinic"
    ON expenses
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

-- Clinic owners, administrators, and accountants can create expense records
CREATE POLICY "expenses_billing_staff_insert"
    ON expenses
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
            AND user_roles.clinic_id = expenses.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator', 'accountant')
            )
        )
    );

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Clinic owners, administrators, and accountants can update expenses
CREATE POLICY "expenses_billing_staff_update"
    ON expenses
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
            AND user_roles.clinic_id = expenses.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator', 'accountant')
            )
        )
    );

-- Prevent modification of clinic_id (tenant isolation)
CREATE POLICY "expenses_clinic_id_protect"
    ON expenses
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        clinic_id IS NOT DISTINCT FROM (SELECT clinic_id FROM expenses WHERE expenses.id = id)
    );

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Only clinic owners can delete expense records
CREATE POLICY "expenses_owner_delete"
    ON expenses
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
            AND user_roles.clinic_id = expenses.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name = 'owner'
            )
        )
    );
