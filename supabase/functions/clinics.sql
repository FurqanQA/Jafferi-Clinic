-- ============================================================================
-- Jafferi Clinic - Clinic Functions
-- ============================================================================
-- Functions for clinic management, including slug generation, code generation,
-- and duplicate prevention.
-- ============================================================================

-- ============================================================================
-- Clinic Creation
-- ============================================================================

-- Generate and set clinic slug before insert
CREATE OR REPLACE FUNCTION set_clinic_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate slug from clinic name if not provided
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_unique_slug(NEW.name, 'clinics', 'slug');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate and set clinic code before insert
CREATE OR REPLACE FUNCTION set_clinic_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate clinic code if not provided
    IF NEW.code IS NULL OR NEW.code = '' THEN
        NEW.code := generate_clinic_code(NEW.name);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Clinic Validation
-- ============================================================================

-- Prevent duplicate clinic names within the same region
CREATE OR REPLACE FUNCTION prevent_duplicate_clinic_name()
RETURNS TRIGGER AS $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Check for duplicate clinic name in same city/state
    SELECT COUNT(*) INTO duplicate_count
    FROM clinics
    WHERE LOWER(name) = LOWER(NEW.name)
    AND city = NEW.city
    AND state = NEW.state
    AND id IS DISTINCT FROM NEW.id
    AND deleted_at IS NULL;
    
    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'A clinic with the name "%" already exists in %, %', 
            NEW.name, NEW.city, NEW.state;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Clinic Management
-- ============================================================================

-- Deactivate clinic (soft delete with cascade)
CREATE OR REPLACE FUNCTION deactivate_clinic(p_clinic_id UUID, p_deactivated_by UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    -- Soft delete clinic
    UPDATE clinics
    SET deleted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_clinic_id;
    
    -- Log activity
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        p_clinic_id,
        p_deactivated_by,
        'CLINIC_DEACTIVATED',
        'clinics',
        p_clinic_id,
        jsonb_build_object('deactivated_by', p_deactivated_by),
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reactivate clinic
CREATE OR REPLACE FUNCTION reactivate_clinic(p_clinic_id UUID, p_reactivated_by UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    -- Reactivate clinic
    UPDATE clinics
    SET deleted_at = NULL,
        updated_at = NOW()
    WHERE id = p_clinic_id;
    
    -- Log activity
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        p_clinic_id,
        p_reactivated_by,
        'CLINIC_REACTIVATED',
        'clinics',
        p_clinic_id,
        jsonb_build_object('reactivated_by', p_reactivated_by),
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Clinic Statistics
-- ============================================================================

-- Get clinic statistics
CREATE OR REPLACE FUNCTION get_clinic_statistics(p_clinic_id UUID)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_patients', (SELECT COUNT(*) FROM patients WHERE clinic_id = p_clinic_id AND deleted_at IS NULL),
        'total_doctors', (SELECT COUNT(*) FROM doctors WHERE clinic_id = p_clinic_id AND deleted_at IS NULL),
        'total_appointments', (SELECT COUNT(*) FROM appointments WHERE clinic_id = p_clinic_id AND deleted_at IS NULL),
        'appointments_today', (SELECT COUNT(*) FROM appointments WHERE clinic_id = p_clinic_id AND scheduled_date = CURRENT_DATE AND deleted_at IS NULL),
        'pending_invoices', (SELECT COUNT(*) FROM invoices WHERE clinic_id = p_clinic_id AND status = 'pending' AND deleted_at IS NULL),
        'total_revenue_month', (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE clinic_id = p_clinic_id AND payment_date >= DATE_TRUNC('month', CURRENT_DATE) AND deleted_at IS NULL),
        'active_users', (SELECT COUNT(DISTINCT user_id) FROM user_roles WHERE clinic_id = p_clinic_id AND is_active = true)
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
