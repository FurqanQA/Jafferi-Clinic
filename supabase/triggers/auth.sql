-- ============================================================================
-- Jafferi Clinic - Authentication Triggers
-- ============================================================================
-- Triggers for handling authentication-related events such as user signup,
-- profile creation, and session management.
-- ============================================================================

-- ============================================================================
-- Auth User Triggers
-- ============================================================================

-- Trigger to create profile after user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- Profile Triggers
-- ============================================================================

-- Update updated_at timestamp on profile update
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log profile insert activity
CREATE TRIGGER log_profile_insert
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_insert(
        NEW.clinic_id,
        NEW.id,
        'profiles',
        NEW.id,
        jsonb_build_object('email', NEW.email, 'action', 'profile_created')
    );

-- Log profile update activity
CREATE TRIGGER log_profile_update
    AFTER UPDATE ON profiles
    FOR EACH ROW
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION log_update(
        NEW.clinic_id,
        NEW.id,
        'profiles',
        NEW.id,
        jsonb_build_object('email', NEW.email, 'action', 'profile_updated')
    );

-- ============================================================================
-- User Roles Triggers
-- ============================================================================

-- Update updated_at timestamp on user_roles update
CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log user role assignment
CREATE TRIGGER log_user_role_insert
    AFTER INSERT ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION log_insert(
        NEW.clinic_id,
        NEW.user_id,
        'user_roles',
        NEW.id,
        jsonb_build_object('role_id', NEW.role_id, 'action', 'role_assigned')
    );

-- Log user role changes
CREATE TRIGGER log_user_role_update
    AFTER UPDATE ON user_roles
    FOR EACH ROW
    WHEN (OLD.is_active IS DISTINCT FROM NEW.is_active)
    EXECUTE FUNCTION log_update(
        NEW.clinic_id,
        NEW.user_id,
        'user_roles',
        NEW.id,
        jsonb_build_object('role_id', NEW.role_id, 'was_active', OLD.is_active, 'is_active', NEW.is_active)
    );
