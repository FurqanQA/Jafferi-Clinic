-- ============================================================================
-- Jafferi Clinic - File Attachments RLS Policies
-- ============================================================================
-- Row Level Security policies for the file_attachments table.
-- File attachments are linked to entities (patients, appointments, etc.).
-- Users can view files from their clinic, with role-based access control.
-- ============================================================================

-- Enable RLS
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Authenticated users can view file attachments from their own clinic
CREATE POLICY "file_attachments_select_own_clinic"
    ON file_attachments
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

-- Clinic owners, administrators, doctors, and receptionists can upload files
CREATE POLICY "file_attachments_staff_insert"
    ON file_attachments
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
            AND user_roles.clinic_id = file_attachments.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator', 'doctor', 'receptionist')
            )
        )
    );

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Clinic owners and administrators can update any file attachment
CREATE POLICY "file_attachments_owner_admin_update"
    ON file_attachments
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
            AND user_roles.clinic_id = file_attachments.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator')
            )
        )
    );

-- Users can update files they uploaded
CREATE POLICY "file_attachments_update_own"
    ON file_attachments
    FOR UPDATE
    TO authenticated
    USING (
        uploaded_by = auth.uid()
    );

-- Prevent modification of clinic_id (tenant isolation)
CREATE POLICY "file_attachments_clinic_id_protect"
    ON file_attachments
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        clinic_id IS NOT DISTINCT FROM (SELECT clinic_id FROM file_attachments WHERE file_attachments.id = id)
    );

-- Prevent modification of entity_type and entity_id (attachment identity)
CREATE POLICY "file_attachments_entity_protect"
    ON file_attachments
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        entity_type IS NOT DISTINCT FROM (SELECT entity_type FROM file_attachments WHERE file_attachments.id = id)
        AND entity_id IS NOT DISTINCT FROM (SELECT entity_id FROM file_attachments WHERE file_attachments.id = id)
    );

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Only clinic owners can delete file attachments
CREATE POLICY "file_attachments_owner_delete"
    ON file_attachments
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
            AND user_roles.clinic_id = file_attachments.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name = 'owner'
            )
        )
    );
