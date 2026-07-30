-- ============================================================================
-- Jafferi Clinic - Activity Log Triggers
-- ============================================================================
-- Triggers for activity log management, including automatic logging of
-- INSERT, UPDATE, and DELETE operations on key tables.
-- ============================================================================

-- ============================================================================
-- Patient Triggers
-- ============================================================================

-- Update updated_at timestamp on patients update
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log patient insert activity
CREATE TRIGGER log_patient_insert
    AFTER INSERT ON patients
    FOR EACH ROW
    EXECUTE FUNCTION log_patient_activity(
        NEW.id,
        'PATIENT_CREATED',
        NEW.created_by,
        jsonb_build_object('patient_number', NEW.patient_number, 'name', CONCAT(NEW.first_name, ' ', NEW.last_name))
    );

-- Log patient update activity
CREATE TRIGGER log_patient_update
    AFTER UPDATE ON patients
    FOR EACH ROW
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION log_patient_activity(
        NEW.id,
        'PATIENT_UPDATED',
        NEW.updated_by,
        jsonb_build_object('patient_number', NEW.patient_number)
    );

-- Log patient delete activity
CREATE TRIGGER log_patient_delete
    AFTER DELETE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION log_patient_activity(
        OLD.id,
        'PATIENT_DELETED',
        OLD.updated_by,
        jsonb_build_object('patient_number', OLD.patient_number)
    );

-- ============================================================================
-- Doctor Triggers
-- ============================================================================

-- Update updated_at timestamp on doctors update
CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON doctors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log doctor insert activity
CREATE TRIGGER log_doctor_insert
    AFTER INSERT ON doctors
    FOR EACH ROW
    EXECUTE FUNCTION log_insert(
        NEW.clinic_id,
        NEW.created_by,
        'doctors',
        NEW.id,
        jsonb_build_object('doctor_number', NEW.doctor_number, 'name', CONCAT(NEW.first_name, ' ', NEW.last_name))
    );

-- Log doctor update activity
CREATE TRIGGER log_doctor_update
    AFTER UPDATE ON doctors
    FOR EACH ROW
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION log_update(
        NEW.clinic_id,
        NEW.updated_by,
        'doctors',
        NEW.id,
        jsonb_build_object('doctor_number', NEW.doctor_number)
    );

-- Log doctor delete activity
CREATE TRIGGER log_doctor_delete
    AFTER DELETE ON doctors
    FOR EACH ROW
    EXECUTE FUNCTION log_delete(
        OLD.clinic_id,
        OLD.updated_by,
        'doctors',
        OLD.id,
        jsonb_build_object('doctor_number', OLD.doctor_number)
    );

-- ============================================================================
-- Subscription Triggers
-- ============================================================================

-- Update updated_at timestamp on subscription_plans update
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at timestamp on clinic_subscriptions update
CREATE TRIGGER update_clinic_subscriptions_updated_at
    BEFORE UPDATE ON clinic_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log clinic subscription insert activity
CREATE TRIGGER log_clinic_subscription_insert
    AFTER INSERT ON clinic_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION log_insert(
        NEW.clinic_id,
        NULL,
        'clinic_subscriptions',
        NEW.id,
        jsonb_build_object('plan_id', NEW.plan_id, 'status', NEW.status)
    );

-- Log clinic subscription update activity
CREATE TRIGGER log_clinic_subscription_update
    AFTER UPDATE ON clinic_subscriptions
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION log_update(
        NEW.clinic_id,
        NULL,
        'clinic_subscriptions',
        NEW.id,
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );

-- ============================================================================
-- AI Features Triggers
-- ============================================================================

-- Update updated_at timestamp on ai_conversations update
CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at timestamp on ai_reports update
CREATE TRIGGER update_ai_reports_updated_at
    BEFORE UPDATE ON ai_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log AI conversation insert activity
CREATE TRIGGER log_ai_conversation_insert
    AFTER INSERT ON ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION log_insert(
        NEW.clinic_id,
        NEW.user_id,
        'ai_conversations',
        NEW.id,
        jsonb_build_object('conversation_type', NEW.conversation_type)
    );

-- Log AI report insert activity
CREATE TRIGGER log_ai_report_insert
    AFTER INSERT ON ai_reports
    FOR EACH ROW
    EXECUTE FUNCTION log_insert(
        NEW.clinic_id,
        NEW.generated_by,
        'ai_reports',
        NEW.id,
        jsonb_build_object('report_type', NEW.report_type)
    );
