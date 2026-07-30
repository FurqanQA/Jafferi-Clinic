-- ============================================================================
-- Jafferi Clinic - Profiles Schema
-- ============================================================================
-- Extended user profile information linked to Supabase auth users.
-- This table extends the Supabase auth.users table with clinic-specific profile data.
-- ============================================================================

-- Profiles Table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    date_of_birth DATE,
    gender gender_enum,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_profiles_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Comments
COMMENT ON TABLE profiles IS 'Extended user profile information linked to Supabase auth users. Each user belongs to exactly one clinic.';
COMMENT ON COLUMN profiles.id IS 'Primary key, should match auth.users.id';
COMMENT ON COLUMN profiles.clinic_id IS 'Foreign key to clinics table - user belongs to this clinic';
COMMENT ON COLUMN profiles.full_name IS 'User full name';
COMMENT ON COLUMN profiles.phone IS 'Contact phone number';
COMMENT ON COLUMN profiles.avatar_url IS 'Profile picture URL';
COMMENT ON COLUMN profiles.date_of_birth IS 'Date of birth';
COMMENT ON COLUMN profiles.gender IS 'Gender (male, female, other, prefer_not_to_say)';
COMMENT ON COLUMN profiles.address IS 'Physical address';
COMMENT ON COLUMN profiles.city IS 'City';
COMMENT ON COLUMN profiles.state IS 'State/Province';
COMMENT ON COLUMN profiles.country IS 'Country';
COMMENT ON COLUMN profiles.postal_code IS 'Postal/ZIP code';
COMMENT ON COLUMN profiles.emergency_contact_name IS 'Emergency contact name';
COMMENT ON COLUMN profiles.emergency_contact_phone IS 'Emergency contact phone';
COMMENT ON COLUMN profiles.emergency_contact_relationship IS 'Relationship to emergency contact';
COMMENT ON COLUMN profiles.is_active IS 'User active status in clinic';
COMMENT ON COLUMN profiles.last_login_at IS 'Last login timestamp';
COMMENT ON COLUMN profiles.created_at IS 'Timestamp when the profile was created';
COMMENT ON COLUMN profiles.updated_at IS 'Timestamp when the profile was last updated';
COMMENT ON COLUMN profiles.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_profiles_id ON profiles(id);
CREATE INDEX idx_profiles_clinic_id ON profiles(clinic_id);
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at);
CREATE INDEX idx_profiles_clinic_is_active ON profiles(clinic_id, is_active);
CREATE INDEX idx_profiles_clinic_deleted_at ON profiles(clinic_id, deleted_at);

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
