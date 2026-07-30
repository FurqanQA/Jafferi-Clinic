-- ============================================================================
-- Jafferi Clinic - AI Features RLS Policies
-- ============================================================================
-- Row Level Security policies for ai_conversations and ai_reports tables.
-- AI features are future expansion but still require proper security.
-- Users can only access AI data from their own clinic.
-- ============================================================================

-- ============================================================================
-- AI Conversations Table
-- ============================================================================

-- Enable RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- SELECT Policies
-- Authenticated users can view AI conversations from their own clinic
CREATE POLICY "ai_conversations_select_own_clinic"
    ON ai_conversations
    FOR SELECT
    TO authenticated
    USING (
        clinic_id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Users can only view their own AI conversations
CREATE POLICY "ai_conversations_select_own"
    ON ai_conversations
    FOR SELECT
    TO authenticated
    USING (
        user_id IS NULL OR user_id = auth.uid()
    );

-- INSERT Policies
-- Authenticated users can create AI conversations for their clinic
CREATE POLICY "ai_conversations_insert_own_clinic"
    ON ai_conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        clinic_id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Users can only create AI conversations for themselves
CREATE POLICY "ai_conversations_insert_own_user"
    ON ai_conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
    );

-- UPDATE Policies
-- Users can update their own AI conversations
CREATE POLICY "ai_conversations_update_own"
    ON ai_conversations
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
    );

-- Prevent modification of clinic_id (tenant isolation)
CREATE POLICY "ai_conversations_clinic_id_protect"
    ON ai_conversations
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        clinic_id IS NOT DISTINCT FROM (SELECT clinic_id FROM ai_conversations WHERE ai_conversations.id = id)
    );

-- DELETE Policies
-- Users can delete their own AI conversations
CREATE POLICY "ai_conversations_delete_own"
    ON ai_conversations
    FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid()
    );

-- ============================================================================
-- AI Reports Table
-- ============================================================================

-- Enable RLS
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;

-- SELECT Policies
-- Authenticated users can view AI reports from their own clinic
CREATE POLICY "ai_reports_select_own_clinic"
    ON ai_reports
    FOR SELECT
    TO authenticated
    USING (
        clinic_id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Users can only view AI reports they generated
CREATE POLICY "ai_reports_select_own"
    ON ai_reports
    FOR SELECT
    TO authenticated
    USING (
        generated_by IS NULL OR generated_by = auth.uid()
    );

-- INSERT Policies
-- Authenticated users can create AI reports for their clinic
CREATE POLICY "ai_reports_insert_own_clinic"
    ON ai_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (
        clinic_id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Users can only create AI reports for themselves
CREATE POLICY "ai_reports_insert_own_user"
    ON ai_reports
    FOR INSERT
    TO authenticated
    WITH CHECK (
        generated_by = auth.uid()
    );

-- UPDATE Policies
-- Users can update their own AI reports
CREATE POLICY "ai_reports_update_own"
    ON ai_reports
    FOR UPDATE
    TO authenticated
    USING (
        generated_by = auth.uid()
    );

-- Prevent modification of clinic_id (tenant isolation)
CREATE POLICY "ai_reports_clinic_id_protect"
    ON ai_reports
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        clinic_id IS NOT DISTINCT FROM (SELECT clinic_id FROM ai_reports WHERE ai_reports.id = id)
    );

-- DELETE Policies
-- Users can delete their own AI reports
CREATE POLICY "ai_reports_delete_own"
    ON ai_reports
    FOR DELETE
    TO authenticated
    USING (
        generated_by = auth.uid()
    );
