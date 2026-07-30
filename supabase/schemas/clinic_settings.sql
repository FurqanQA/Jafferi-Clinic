-- ============================================================================
-- Jafferi Clinic - Clinic Settings Schema
-- ============================================================================
-- Stores clinic-specific configuration settings.
-- Key-value settings for clinic customization including business hours, branding, and feature configurations.
-- ============================================================================

-- Clinic Settings Table
CREATE TABLE clinic_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type setting_type_enum NOT NULL DEFAULT 'string',
    category setting_category_enum NOT NULL DEFAULT 'general',
    description TEXT,
    is_encrypted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_clinic_settings_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    -- Unique Constraint
    CONSTRAINT uk_clinic_settings_clinic_setting_key 
        UNIQUE (clinic_id, setting_key)
);

-- Comments
COMMENT ON TABLE clinic_settings IS 'Stores clinic-specific configuration settings. Each setting belongs to exactly one clinic.';
COMMENT ON COLUMN clinic_settings.id IS 'Unique identifier for the setting';
COMMENT ON COLUMN clinic_settings.clinic_id IS 'Foreign key to clinics table - setting belongs to this clinic';
COMMENT ON COLUMN clinic_settings.setting_key IS 'Setting key';
COMMENT ON COLUMN clinic_settings.setting_value IS 'Setting value (can be JSON string)';
COMMENT ON COLUMN clinic_settings.setting_type IS 'Value type (string, number, boolean, json)';
COMMENT ON COLUMN clinic_settings.category IS 'Setting category (general, branding, features, integration, security)';
COMMENT ON COLUMN clinic_settings.description IS 'Setting description';
COMMENT ON COLUMN clinic_settings.is_encrypted IS 'Whether value is encrypted';
COMMENT ON COLUMN clinic_settings.created_at IS 'Timestamp when the setting was created';
COMMENT ON COLUMN clinic_settings.updated_at IS 'Timestamp when the setting was last updated';

-- Indexes
CREATE INDEX idx_clinic_settings_clinic_id ON clinic_settings(clinic_id);
CREATE INDEX idx_clinic_settings_setting_key ON clinic_settings(setting_key);
CREATE INDEX idx_clinic_settings_category ON clinic_settings(category);

-- Triggers for updated_at
CREATE TRIGGER update_clinic_settings_updated_at
    BEFORE UPDATE ON clinic_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
