-- ============================================================================
-- Jafferi Clinic - Clinic Settings RLS Policies
-- ============================================================================
-- Row Level Security policies for the clinic_settings table.
-- Clinic settings are key-value configuration for each clinic.
-- Only owners and administrators can manage settings.
-- ============================================================================

-- Enable RLS
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policies
-- ============================================================================

-- Authenticated users can view settings from their own clinic
CREATE POLICY "clinic_settings_select_own_clinic"
    ON clinic_settings
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

-- Only clinic owners and administrators can create settings
CREATE POLICY "clinic_settings_owner_admin_insert"
    ON clinic_settings
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
            AND user_roles.clinic_id = clinic_settings.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator')
            )
        )
    );

-- ============================================================================
-- UPDATE Policies
-- ============================================================================

-- Only clinic owners and administrators can update settings
CREATE POLICY "clinic_settings_owner_admin_update"
    ON clinic_settings
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
            AND user_roles.clinic_id = clinic_settings.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator')
            )
        )
    );

-- Prevent modification of clinic_id (tenant isolation)
CREATE POLICY "clinic_settings_clinic_id_protect"
    ON clinic_settings
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        clinic_id IS NOT DISTINCT FROM (SELECT clinic_id FROM clinic_settings WHERE clinic_settings.id = id)
    );

-- Prevent modification of setting_key (setting identity)
CREATE POLICY "clinic_settings_setting_key_protect"
    ON clinic_settings
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        setting_key IS NOT DISTINCT FROM (SELECT setting_key FROM clinic_settings WHERE clinic_settings.id = id)
    );

-- ============================================================================
-- DELETE Policies
-- ============================================================================

-- Only clinic owners can delete settings
CREATE POLICY "clinic_settings_owner_delete"
    ON clinic_settings
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
            AND user_roles.clinic_id = clinic_settings.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name = 'owner'
            )
        )
    );
