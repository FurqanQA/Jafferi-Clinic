-- ============================================================================
-- Jafferi Clinic - AI Features Schema
-- ============================================================================
-- AI-powered features for future expansion.
-- Placeholder tables for AI conversations and AI-generated reports.
-- ============================================================================

-- AI Conversations Table
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    user_id UUID,
    conversation_type ai_conversation_type_enum NOT NULL,
    title VARCHAR(255),
    context JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_ai_conversations_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_ai_conversations_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Comments
COMMENT ON TABLE ai_conversations IS 'AI-powered conversations for medical assistance, appointment scheduling, billing, and general queries. Each conversation belongs to exactly one clinic.';
COMMENT ON COLUMN ai_conversations.id IS 'Unique identifier for the AI conversation';
COMMENT ON COLUMN ai_conversations.clinic_id IS 'Foreign key to clinics table - conversation belongs to this clinic';
COMMENT ON COLUMN ai_conversations.user_id IS 'Foreign key to profiles table - user who initiated the conversation';
COMMENT ON COLUMN ai_conversations.conversation_type IS 'Type of AI conversation (medical_assistant, appointment_assistant, billing_assistant, general)';
COMMENT ON COLUMN ai_conversations.title IS 'Conversation title';
COMMENT ON COLUMN ai_conversations.context IS 'Conversation context and metadata (JSON)';
COMMENT ON COLUMN ai_conversations.is_active IS 'Conversation active status';
COMMENT ON COLUMN ai_conversations.created_at IS 'Timestamp when the conversation was created';
COMMENT ON COLUMN ai_conversations.updated_at IS 'Timestamp when the conversation was last updated';
COMMENT ON COLUMN ai_conversations.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_ai_conversations_clinic_id ON ai_conversations(clinic_id);
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_conversation_type ON ai_conversations(conversation_type);
CREATE INDEX idx_ai_conversations_is_active ON ai_conversations(is_active);
CREATE INDEX idx_ai_conversations_deleted_at ON ai_conversations(deleted_at);
CREATE INDEX idx_ai_conversations_clinic_user_type ON ai_conversations(clinic_id, user_id, conversation_type);

-- Triggers for updated_at
CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- AI Reports Table
CREATE TABLE ai_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    report_type ai_report_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    parameters JSONB DEFAULT '{}'::jsonb,
    status ai_report_status_enum NOT NULL DEFAULT 'pending',
    generated_at TIMESTAMPTZ,
    report_data JSONB,
    summary TEXT,
    error_message TEXT,
    generated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_ai_reports_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_ai_reports_generated_by 
        FOREIGN KEY (generated_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Comments
COMMENT ON TABLE ai_reports IS 'AI-generated reports for medical summaries, appointment insights, billing analytics, patient trends, and operational metrics. Each report belongs to exactly one clinic.';
COMMENT ON COLUMN ai_reports.id IS 'Unique identifier for the AI report';
COMMENT ON COLUMN ai_reports.clinic_id IS 'Foreign key to clinics table - report belongs to this clinic';
COMMENT ON COLUMN ai_reports.report_type IS 'Type of AI report (medical_summary, appointment_insights, billing_analytics, patient_trends, operational_metrics)';
COMMENT ON COLUMN ai_reports.title IS 'Report title';
COMMENT ON COLUMN ai_reports.description IS 'Report description';
COMMENT ON COLUMN ai_reports.parameters IS 'Report generation parameters (JSON)';
COMMENT ON COLUMN ai_reports.status IS 'Generation status (pending, processing, completed, failed)';
COMMENT ON COLUMN ai_reports.generated_at IS 'Report generation timestamp';
COMMENT ON COLUMN ai_reports.report_data IS 'Generated report data (JSON)';
COMMENT ON COLUMN ai_reports.summary IS 'Report summary';
COMMENT ON COLUMN ai_reports.error_message IS 'Error message if generation failed';
COMMENT ON COLUMN ai_reports.generated_by IS 'Foreign key to profiles table - user who requested the report';
COMMENT ON COLUMN ai_reports.created_at IS 'Timestamp when the report was requested';
COMMENT ON COLUMN ai_reports.updated_at IS 'Timestamp when the report was last updated';
COMMENT ON COLUMN ai_reports.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_ai_reports_clinic_id ON ai_reports(clinic_id);
CREATE INDEX idx_ai_reports_report_type ON ai_reports(report_type);
CREATE INDEX idx_ai_reports_status ON ai_reports(status);
CREATE INDEX idx_ai_reports_generated_at ON ai_reports(generated_at);
CREATE INDEX idx_ai_reports_generated_by ON ai_reports(generated_by);
CREATE INDEX idx_ai_reports_deleted_at ON ai_reports(deleted_at);
CREATE INDEX idx_ai_reports_clinic_type_status ON ai_reports(clinic_id, report_type, status);

-- Triggers for updated_at
CREATE TRIGGER update_ai_reports_updated_at
    BEFORE UPDATE ON ai_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
