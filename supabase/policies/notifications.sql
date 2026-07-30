-- ============================================================================
-- Jafferi Clinic - Notifications RLS Policies
-- ============================================================================
-- Row Level Security policies for the notifications table.
-- Notifications are user-specific but belong to a clinic.
-- Users can only view their own notifications.
-- ============================================================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Authenticated users can view notifications from their own clinic
CREATE POLICY "notifications_select_own_clinic"
    ON notifications
    FOR SELECT
    TO authenticated
    USING (
        clinic_id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Users can only view their own notifications (if user_id is set)
CREATE POLICY "notifications_select_own"
    ON notifications
    FOR SELECT
    TO authenticated
    USING (
        user_id IS NULL OR user_id = auth.uid()
    );

-- ============================================================================
-- INSERT Policies
-- ============================================================================

-- Authenticated users can create notifications for their clinic
CREATE POLICY "notifications_insert_own_clinic"
    ON notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (
        clinic_id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Users can only create notifications for themselves (if user_id is set)
CREATE POLICY "notifications_insert_own_user"
    ON notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id IS NULL OR user_id = auth.uid()
    );

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Users can update their own notifications (mark as read, etc.)
CREATE POLICY "notifications_update_own"
    ON notifications
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
    );

-- System processes can update notifications without user_id (handled by service role)
CREATE POLICY "notifications_update_system"
    ON notifications
    FOR UPDATE
    TO authenticated
    USING (
        user_id IS NULL
    );

-- Prevent modification of clinic_id (tenant isolation)
CREATE POLICY "notifications_clinic_id_protect"
    ON notifications
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        clinic_id IS NOT DISTINCT FROM (SELECT clinic_id FROM notifications WHERE notifications.id = id)
    );

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own"
    ON notifications
    FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid()
    );

-- System processes can delete notifications without user_id (handled by service role)
CREATE POLICY "notifications_delete_system"
    ON notifications
    FOR DELETE
    TO authenticated
    USING (
        user_id IS NULL
    );
