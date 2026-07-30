-- ============================================================================
-- Jafferi Clinic - Activity Logs RLS Policies
-- ============================================================================
-- Row Level Security policies for the activity_logs table.
-- Activity logs are audit trails for compliance.
-- Only owners and administrators can read logs.
-- Logs are inserted automatically by triggers/functions.
-- ============================================================================

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Only clinic owners and administrators can view activity logs
CREATE POLICY "activity_logs_owner_admin_select"
    ON activity_logs
    FOR SELECT
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
            AND user_roles.clinic_id = activity_logs.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator')
            )
        )
    );

-- ============================================================================
-- INSERT Policies
-- ============================================================================

-- No direct INSERT policy - logs are inserted via triggers/functions
-- Service role can insert logs
CREATE POLICY "activity_logs_service_insert"
    ON activity_logs
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Activity logs should not be updated (immutable audit trail)
-- No UPDATE policy allowed

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Only clinic owners can delete activity logs (for data retention policies)
CREATE POLICY "activity_logs_owner_delete"
    ON activity_logs
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
            AND user_roles.clinic_id = activity_logs.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name = 'owner'
            )
        )
    );
