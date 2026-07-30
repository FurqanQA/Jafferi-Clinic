-- ============================================================================
-- Jafferi Clinic - Common Functions
-- ============================================================================
-- This file contains common utility functions used across the database.
-- These must be created before any tables that reference them.
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at column on row updates';
