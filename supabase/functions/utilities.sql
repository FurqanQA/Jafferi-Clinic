-- ============================================================================
-- Jafferi Clinic - Utility Functions
-- ============================================================================
-- Common utility functions used across the application.
-- These functions provide reusable logic for UUID generation, slug creation,
-- number generation, and timestamp management.
-- ============================================================================

-- ============================================================================
-- Timestamp Management
-- ============================================================================

-- Automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UUID Generation
-- ============================================================================

-- Generate a UUID (wrapper for gen_random_uuid)
CREATE OR REPLACE FUNCTION generate_uuid()
RETURNS UUID AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE sql;

-- ============================================================================
-- Slug Generation
-- ============================================================================

-- Generate a URL-friendly slug from text
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Convert to lowercase, replace spaces and special chars with hyphens
    -- Remove multiple consecutive hyphens and trim
    RETURN regexp_replace(
        regexp_replace(
            regexp_replace(
                lower(input_text),
                '[^a-z0-9\s-]', '', 'g'
            ),
            '\s+', '-', 'g'
        ),
        '-+', '-', 'g'
    );
END;
$$ LANGUAGE plpgsql;

-- Generate a unique slug by appending a number if needed
CREATE OR REPLACE FUNCTION generate_unique_slug(base_text TEXT, table_name TEXT, column_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    base_slug := generate_slug(base_text);
    final_slug := base_slug;
    
    -- Check if slug exists, append number if needed
    WHILE EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = table_name
        AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = table_name AND column_name = column_name
        )
    ) LOOP
        IF EXISTS (
            SELECT 1 
            FROM pg_tables 
            WHERE tablename = table_name
            AND EXISTS (
                SELECT 1 FROM pg_attribute 
                WHERE attrelid = pg_tables.oid 
                AND attname = column_name
            )
        ) THEN
            EXECUTE format('SELECT 1 FROM %I WHERE %I = $1', table_name, column_name)
            INTO final_slug
            USING final_slug;
            
            IF FOUND THEN
                final_slug := base_slug || '-' || counter;
                counter := counter + 1;
            ELSE
                EXIT;
            END IF;
        ELSE
            EXIT;
        END IF;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Number Generation
-- ============================================================================

-- Generate invoice number (INV-YYYYMMDD-XXXX)
CREATE OR REPLACE FUNCTION generate_invoice_number(clinic_id UUID)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'INV';
    date_part TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
    sequence_num INTEGER;
    invoice_number TEXT;
BEGIN
    -- Get the next sequence number for this clinic
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '\d+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM invoices
    WHERE clinic_id = clinic_id
    AND invoice_number LIKE prefix || '-' || date_part || '-%';
    
    -- Format: INV-YYYYMMDD-XXXXX (5-digit sequence)
    invoice_number := prefix || '-' || date_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
    
    RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Generate patient number (PTN-CLINICID-XXXX)
CREATE OR REPLACE FUNCTION generate_patient_number(clinic_id UUID)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'PTN';
    clinic_code TEXT;
    sequence_num INTEGER;
    patient_number TEXT;
BEGIN
    -- Get clinic code (first 4 chars of clinic_id)
    clinic_code := UPPER(SUBSTRING(clinic_id::TEXT, 1, 4));
    
    -- Get the next sequence number for this clinic
    SELECT COALESCE(MAX(CAST(SUBSTRING(patient_number FROM '\d+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM patients
    WHERE clinic_id = clinic_id;
    
    -- Format: PTN-XXXX-XXXXX (5-digit sequence)
    patient_number := prefix || '-' || clinic_code || '-' || LPAD(sequence_num::TEXT, 5, '0');
    
    RETURN patient_number;
END;
$$ LANGUAGE plpgsql;

-- Generate doctor number (DOC-CLINICID-XXXX)
CREATE OR REPLACE FUNCTION generate_doctor_number(clinic_id UUID)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'DOC';
    clinic_code TEXT;
    sequence_num INTEGER;
    doctor_number TEXT;
BEGIN
    -- Get clinic code (first 4 chars of clinic_id)
    clinic_code := UPPER(SUBSTRING(clinic_id::TEXT, 1, 4));
    
    -- Get the next sequence number for this clinic
    SELECT COALESCE(MAX(CAST(SUBSTRING(doctor_number FROM '\d+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM doctors
    WHERE clinic_id = clinic_id;
    
    -- Format: DOC-XXXX-XXXXX (5-digit sequence)
    doctor_number := prefix || '-' || clinic_code || '-' || LPAD(sequence_num::TEXT, 5, '0');
    
    RETURN doctor_number;
END;
$$ LANGUAGE plpgsql;

-- Generate appointment number (APT-YYYYMMDD-XXXX)
CREATE OR REPLACE FUNCTION generate_appointment_number(clinic_id UUID)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'APT';
    date_part TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
    sequence_num INTEGER;
    appointment_number TEXT;
BEGIN
    -- Get the next sequence number for this clinic
    SELECT COALESCE(MAX(CAST(SUBSTRING(appointment_number FROM '\d+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM appointments
    WHERE clinic_id = clinic_id
    AND appointment_number LIKE prefix || '-' || date_part || '-%';
    
    -- Format: APT-YYYYMMDD-XXXXX (5-digit sequence)
    appointment_number := prefix || '-' || date_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
    
    RETURN appointment_number;
END;
$$ LANGUAGE plpgsql;

-- Generate clinic code (CLN-XXXX)
CREATE OR REPLACE FUNCTION generate_clinic_code(clinic_name TEXT)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'CLN';
    initials TEXT;
    random_suffix TEXT;
BEGIN
    -- Extract initials from clinic name (first 3 letters, uppercase)
    initials := UPPER(SUBSTRING(regexp_replace(clinic_name, '[^a-zA-Z]', '', 'g'), 1, 3));
    
    -- If initials are too short, pad with X
    IF LENGTH(initials) < 3 THEN
        initials := RPAD(initials, 3, 'X');
    END IF;
    
    -- Add random 3-digit suffix
    random_suffix := LPAD((FLOOR(RANDOM() * 1000))::TEXT, 3, '0');
    
    RETURN prefix || '-' || initials || random_suffix;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Validation Functions
-- ============================================================================

-- Validate email format
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE sql;

-- Validate phone number format (international)
CREATE OR REPLACE FUNCTION is_valid_phone(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Accept various phone formats with optional country code
    RETURN phone ~ '^\+?[0-9\s\-\(\)]{10,20}$';
END;
$$ LANGUAGE sql;

-- ============================================================================
-- Date/Time Utilities
-- ============================================================================

-- Calculate business days between two dates (excluding weekends)
CREATE OR REPLACE FUNCTION calculate_business_days(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
DECLARE
    days INTEGER;
    current_date DATE;
BEGIN
    days := 0;
    current_date := start_date;
    
    WHILE current_date <= end_date LOOP
        -- Exclude Saturday (6) and Sunday (0)
        IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
            days := days + 1;
        END IF;
        current_date := current_date + INTERVAL '1 day';
    END LOOP;
    
    RETURN days;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- String Utilities
-- ============================================================================

-- Truncate text to specified length with ellipsis
CREATE OR REPLACE FUNCTION truncate_text(input_text TEXT, max_length INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF LENGTH(input_text) <= max_length THEN
        RETURN input_text;
    ELSE
        RETURN SUBSTRING(input_text FROM 1 FOR max_length - 3) || '...';
    END IF;
END;
$$ LANGUAGE sql;

-- ============================================================================
-- Clinic Context
-- ============================================================================

-- Get the current user's clinic_id from their profile
CREATE OR REPLACE FUNCTION get_current_user_clinic_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT clinic_id 
        FROM profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE sql SECURITY DEFINER;

-- Get the current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
    role_name TEXT;
BEGIN
    SELECT r.name INTO role_name
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND ur.is_active = true
    LIMIT 1;
    
    RETURN COALESCE(role_name, 'staff');
END;
$$ LANGUAGE sql SECURITY DEFINER;
