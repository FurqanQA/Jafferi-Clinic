-- ============================================================================
-- Jafferi Clinic - Clinic Triggers
-- ============================================================================
-- Triggers for clinic management, including slug generation, code generation,
-- duplicate prevention, and activity logging.
-- ============================================================================

-- ============================================================================
-- Clinic Triggers
-- ============================================================================

-- Generate clinic slug before insert
CREATE TRIGGER set_clinic_slug_before_insert
    BEFORE INSERT ON clinics
    FOR EACH ROW
    EXECUTE FUNCTION set_clinic_slug();

-- Generate clinic code before insert
CREATE TRIGGER set_clinic_code_before_insert
    BEFORE INSERT ON clinics
    FOR EACH ROW
    EXECUTE FUNCTION set_clinic_code();

-- Prevent duplicate clinic names
CREATE TRIGGER prevent_duplicate_clinic_names
    BEFORE INSERT ON clinics
    FOR EACH ROW
    EXECUTE FUNCTION prevent_duplicate_clinic_name();

-- Prevent duplicate clinic names on update
CREATE TRIGGER prevent_duplicate_clinic_names_update
    BEFORE UPDATE ON clinics
    FOR EACH ROW
    WHEN (OLD.name IS DISTINCT FROM NEW.name OR OLD.city IS DISTINCT FROM NEW.city OR OLD.state IS DISTINCT FROM NEW.state)
    EXECUTE FUNCTION prevent_duplicate_clinic_name();

-- Update updated_at timestamp on clinic update
CREATE TRIGGER update_clinics_updated_at
    BEFORE UPDATE ON clinics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log clinic insert activity
CREATE TRIGGER log_clinic_insert
    AFTER INSERT ON clinics
    FOR EACH ROW
    EXECUTE FUNCTION log_insert(
        NEW.id,
        NEW.created_by,
        'clinics',
        NEW.id,
        jsonb_build_object('name', NEW.name, 'code', NEW.code, 'action', 'clinic_created')
    );

-- Log clinic update activity
CREATE TRIGGER log_clinic_update
    AFTER UPDATE ON clinics
    FOR EACH ROW
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION log_update(
        NEW.id,
        NEW.updated_by,
        'clinics',
        NEW.id,
        jsonb_build_object('name', NEW.name, 'action', 'clinic_updated')
    );

-- Log clinic delete activity
CREATE TRIGGER log_clinic_delete
    AFTER DELETE ON clinics
    FOR EACH ROW
    EXECUTE FUNCTION log_delete(
        OLD.id,
        OLD.updated_by,
        'clinics',
        OLD.id,
        jsonb_build_object('name', OLD.name, 'action', 'clinic_deleted')
    );

-- ============================================================================
-- Clinic Settings Triggers
-- ============================================================================

-- Update updated_at timestamp on clinic_settings update
CREATE TRIGGER update_clinic_settings_updated_at
    BEFORE UPDATE ON clinic_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log clinic settings insert activity
CREATE TRIGGER log_clinic_settings_insert
    AFTER INSERT ON clinic_settings
    FOR EACH ROW
    EXECUTE FUNCTION log_insert(
        NEW.clinic_id,
        NULL,
        'clinic_settings',
        NEW.id,
        jsonb_build_object('setting_key', NEW.setting_key, 'action', 'setting_created')
    );

-- Log clinic settings update activity
CREATE TRIGGER log_clinic_settings_update
    AFTER UPDATE ON clinic_settings
    FOR EACH ROW
    WHEN (OLD.setting_value IS DISTINCT FROM NEW.setting_value)
    EXECUTE FUNCTION log_update(
        NEW.clinic_id,
        NULL,
        'clinic_settings',
        NEW.id,
        jsonb_build_object('setting_key', NEW.setting_key, 'old_value', OLD.setting_value, 'new_value', NEW.setting_value)
    );
