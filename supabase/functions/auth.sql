-- ============================================================================
-- Jafferi Clinic - Authentication Functions
-- ============================================================================
-- Functions for handling user authentication, profile creation, and role assignment.
-- These functions integrate with Supabase Auth to automatically create profiles
-- and assign appropriate roles when users sign up.
-- ============================================================================

-- ============================================================================
-- Profile Creation
-- ============================================================================

-- Create a user profile after signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_clinic_id UUID;
    owner_role_id UUID;
BEGIN
    -- Extract clinic_id from raw_user_meta_data if provided
    user_clinic_id := NEW.raw_user_meta_data->>'clinic_id';
    
    -- If no clinic_id provided, this is handled by application logic
    -- during clinic registration flow
    
    -- Insert profile
    INSERT INTO profiles (
        id,
        email,
        first_name,
        last_name,
        clinic_id,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        user_clinic_id,
        NOW(),
        NOW()
    );
    
    -- If clinic_id is provided, assign Owner role (first user in clinic)
    IF user_clinic_id IS NOT NULL THEN
        -- Get owner role ID
        SELECT id INTO owner_role_id
        FROM roles
        WHERE name = 'owner'
        LIMIT 1;
        
        -- Assign owner role
        IF owner_role_id IS NOT NULL THEN
            INSERT INTO user_roles (
                user_id,
                clinic_id,
                role_id,
                is_active,
                assigned_at,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                user_clinic_id,
                owner_role_id,
                true,
                NOW(),
                NOW(),
                NOW()
            );
        END IF;
        
        -- Log activity
        INSERT INTO activity_logs (
            clinic_id,
            user_id,
            action,
            entity_type,
            entity_id,
            details,
            ip_address,
            user_agent,
            created_at
        ) VALUES (
            user_clinic_id,
            NEW.id,
            'USER_CREATED',
            'profiles',
            NEW.id,
            jsonb_build_object(
                'email', NEW.email,
                'role', 'owner'
            ),
            NEW.raw_user_meta_data->>'ip_address',
            NEW.raw_user_meta_data->>'user_agent',
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Role Assignment
-- ============================================================================

-- Assign a role to a user within a clinic
CREATE OR REPLACE FUNCTION assign_user_role(
    p_user_id UUID,
    p_clinic_id UUID,
    p_role_name TEXT,
    p_assigned_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    role_id UUID;
    existing_role_id UUID;
BEGIN
    -- Get role ID
    SELECT id INTO role_id
    FROM roles
    WHERE name = p_role_name
    LIMIT 1;
    
    IF role_id IS NULL THEN
        RAISE EXCEPTION 'Role % does not exist', p_role_name;
    END IF;
    
    -- Check if user already has this role in the clinic
    SELECT ur.role_id INTO existing_role_id
    FROM user_roles ur
    WHERE ur.user_id = p_user_id
    AND ur.clinic_id = p_clinic_id
    AND ur.role_id = role_id;
    
    IF existing_role_id IS NOT NULL THEN
        -- Reactivate if inactive
        UPDATE user_roles
        SET is_active = true,
            assigned_at = NOW(),
            updated_at = NOW()
        WHERE user_id = p_user_id
        AND clinic_id = p_clinic_id
        AND role_id = role_id;
    ELSE
        -- Insert new role assignment
        INSERT INTO user_roles (
            user_id,
            clinic_id,
            role_id,
            is_active,
            assigned_at,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            p_clinic_id,
            role_id,
            true,
            NOW(),
            NOW(),
            NOW()
        );
    END IF;
    
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
        COALESCE(p_assigned_by, p_user_id),
        'ROLE_ASSIGNED',
        'user_roles',
        (SELECT id FROM user_roles WHERE user_id = p_user_id AND clinic_id = p_clinic_id AND role_id = role_id),
        jsonb_build_object(
            'target_user_id', p_user_id,
            'role', p_role_name,
            'assigned_by', p_assigned_by
        ),
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove a role from a user
CREATE OR REPLACE FUNCTION remove_user_role(
    p_user_id UUID,
    p_clinic_id UUID,
    p_role_name TEXT,
    p_removed_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    role_id UUID;
BEGIN
    -- Get role ID
    SELECT id INTO role_id
    FROM roles
    WHERE name = p_role_name
    LIMIT 1;
    
    IF role_id IS NULL THEN
        RAISE EXCEPTION 'Role % does not exist', p_role_name;
    END IF;
    
    -- Deactivate role instead of deleting (for audit trail)
    UPDATE user_roles
    SET is_active = false,
        updated_at = NOW()
    WHERE user_id = p_user_id
    AND clinic_id = p_clinic_id
    AND role_id = role_id;
    
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
        COALESCE(p_removed_by, p_user_id),
        'ROLE_REMOVED',
        'user_roles',
        (SELECT id FROM user_roles WHERE user_id = p_user_id AND clinic_id = p_clinic_id AND role_id = role_id),
        jsonb_build_object(
            'target_user_id', p_user_id,
            'role', p_role_name,
            'removed_by', p_removed_by
        ),
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- User Management
-- ============================================================================

-- Link a user to a clinic
CREATE OR REPLACE FUNCTION link_user_to_clinic(
    p_user_id UUID,
    p_clinic_id UUID,
    p_linked_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update user's clinic
    UPDATE profiles
    SET clinic_id = p_clinic_id,
        updated_at = NOW()
    WHERE id = p_user_id;
    
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
        COALESCE(p_linked_by, p_user_id),
        'CLINIC_LINKED',
        'profiles',
        p_user_id,
        jsonb_build_object(
            'target_user_id', p_user_id,
            'linked_by', p_linked_by
        ),
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Password Management
-- ============================================================================

-- Log password change
CREATE OR REPLACE FUNCTION log_password_change(p_user_id UUID, p_ip_address TEXT DEFAULT NULL, p_user_agent TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    user_clinic_id UUID;
BEGIN
    -- Get user's clinic
    SELECT clinic_id INTO user_clinic_id
    FROM profiles
    WHERE id = p_user_id;
    
    -- Log activity
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        user_clinic_id,
        p_user_id,
        'PASSWORD_CHANGED',
        'profiles',
        p_user_id,
        jsonb_build_object('event', 'password_change'),
        p_ip_address,
        p_user_agent,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log password reset request
CREATE OR REPLACE FUNCTION log_password_reset(p_user_id UUID, p_ip_address TEXT DEFAULT NULL, p_user_agent TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    user_clinic_id UUID;
BEGIN
    -- Get user's clinic
    SELECT clinic_id INTO user_clinic_id
    FROM profiles
    WHERE id = p_user_id;
    
    -- Log activity
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        user_clinic_id,
        p_user_id,
        'PASSWORD_RESET',
        'profiles',
        p_user_id,
        jsonb_build_object('event', 'password_reset_requested'),
        p_ip_address,
        p_user_agent,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Email Verification
-- ============================================================================

-- Log email verification
CREATE OR REPLACE FUNCTION log_email_verification(p_user_id UUID, p_ip_address TEXT DEFAULT NULL, p_user_agent TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    user_clinic_id UUID;
BEGIN
    -- Get user's clinic
    SELECT clinic_id INTO user_clinic_id
    FROM profiles
    WHERE id = p_user_id;
    
    -- Log activity
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        user_clinic_id,
        p_user_id,
        'EMAIL_VERIFIED',
        'profiles',
        p_user_id,
        jsonb_build_object('event', 'email_verified'),
        p_ip_address,
        p_user_agent,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Session Management
-- ============================================================================

-- Log user login
CREATE OR REPLACE FUNCTION log_user_login(p_user_id UUID, p_ip_address TEXT DEFAULT NULL, p_user_agent TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    user_clinic_id UUID;
BEGIN
    -- Get user's clinic
    SELECT clinic_id INTO user_clinic_id
    FROM profiles
    WHERE id = p_user_id;
    
    -- Log activity
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        user_clinic_id,
        p_user_id,
        'LOGIN',
        'profiles',
        p_user_id,
        jsonb_build_object('event', 'user_login'),
        p_ip_address,
        p_user_agent,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log user logout
CREATE OR REPLACE FUNCTION log_user_logout(p_user_id UUID, p_ip_address TEXT DEFAULT NULL, p_user_agent TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    user_clinic_id UUID;
BEGIN
    -- Get user's clinic
    SELECT clinic_id INTO user_clinic_id
    FROM profiles
    WHERE id = p_user_id;
    
    -- Log activity
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        user_clinic_id,
        p_user_id,
        'LOGOUT',
        'profiles',
        p_user_id,
        jsonb_build_object('event', 'user_logout'),
        p_ip_address,
        p_user_agent,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
