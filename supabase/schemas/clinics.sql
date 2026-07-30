-- ============================================================================
-- Jafferi Clinic - Clinics Schema
-- ============================================================================
-- Represents individual clinic tenants in the multi-tenant SaaS system.
-- This is the core multi-tenancy table that all clinic-specific data references.
-- ============================================================================

-- Clinics Table
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    logo_url TEXT,
    website VARCHAR(255),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    subscription_plan_id UUID,
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Comments
COMMENT ON TABLE clinics IS 'Represents individual clinic tenants in the multi-tenant SaaS system. This table DEFINES tenants.';
COMMENT ON COLUMN clinics.id IS 'Unique identifier for the clinic';
COMMENT ON COLUMN clinics.name IS 'Clinic name';
COMMENT ON COLUMN clinics.slug IS 'URL-friendly unique identifier for the clinic';
COMMENT ON COLUMN clinics.email IS 'Clinic contact email';
COMMENT ON COLUMN clinics.phone IS 'Clinic contact phone number';
COMMENT ON COLUMN clinics.address IS 'Clinic physical address';
COMMENT ON COLUMN clinics.city IS 'City where the clinic is located';
COMMENT ON COLUMN clinics.state IS 'State/Province where the clinic is located';
COMMENT ON COLUMN clinics.country IS 'Country where the clinic is located';
COMMENT ON COLUMN clinics.postal_code IS 'Postal/ZIP code';
COMMENT ON COLUMN clinics.logo_url IS 'URL to the clinic logo image';
COMMENT ON COLUMN clinics.website IS 'Clinic website URL';
COMMENT ON COLUMN clinics.description IS 'Clinic description';
COMMENT ON COLUMN clinics.is_active IS 'Whether the clinic is active';
COMMENT ON COLUMN clinics.subscription_plan_id IS 'Foreign key to subscription_plans table';
COMMENT ON COLUMN clinics.trial_ends_at IS 'Trial period end date';
COMMENT ON COLUMN clinics.created_at IS 'Timestamp when the clinic was created';
COMMENT ON COLUMN clinics.updated_at IS 'Timestamp when the clinic was last updated';
COMMENT ON COLUMN clinics.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_clinics_slug ON clinics(slug);
CREATE INDEX idx_clinics_email ON clinics(email);
CREATE INDEX idx_clinics_is_active ON clinics(is_active);
CREATE INDEX idx_clinics_subscription_plan_id ON clinics(subscription_plan_id);
CREATE INDEX idx_clinics_deleted_at ON clinics(deleted_at);
CREATE INDEX idx_clinics_is_active_deleted_at ON clinics(is_active, deleted_at);

-- Triggers for updated_at
CREATE TRIGGER update_clinics_updated_at
    BEFORE UPDATE ON clinics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
