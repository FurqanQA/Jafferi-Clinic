-- ============================================================================
-- Jafferi Clinic - Subscriptions RLS Policies
-- ============================================================================
-- Row Level Security policies for subscription_plans and clinic_subscriptions tables.
-- Subscription plans are global (public read).
-- Clinic subscriptions are restricted to owners and administrators only.
-- ============================================================================

-- ============================================================================
-- Subscription Plans Table
-- ============================================================================

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- SELECT Policies
-- Public read access to subscription plans (needed for pricing display)
CREATE POLICY "subscription_plans_public_select"
    ON subscription_plans
    FOR SELECT
    TO public
    USING (true);

-- INSERT Policies
-- Only service role can create subscription plans (managed by platform)
CREATE POLICY "subscription_plans_service_insert"
    ON subscription_plans
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- UPDATE Policies
-- Only service role can update subscription plans
CREATE POLICY "subscription_plans_service_update"
    ON subscription_plans
    FOR UPDATE
    TO service_role
    USING (true);

-- DELETE Policies
-- Only service role can delete subscription plans
CREATE POLICY "subscription_plans_service_delete"
    ON subscription_plans
    FOR DELETE
    TO service_role
    USING (true);

-- ============================================================================
-- Clinic Subscriptions Table
-- ============================================================================

-- Enable RLS
ALTER TABLE clinic_subscriptions ENABLE ROW LEVEL SECURITY;

-- SELECT Policies
-- Authenticated users can view their own clinic's subscription
CREATE POLICY "clinic_subscriptions_select_own_clinic"
    ON clinic_subscriptions
    FOR SELECT
    TO authenticated
    USING (
        clinic_id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- INSERT Policies
-- Only service role can create clinic subscriptions (managed by platform/billing system)
CREATE POLICY "clinic_subscriptions_service_insert"
    ON clinic_subscriptions
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- UPDATE Policies
-- Only service role can update clinic subscriptions (managed by platform/billing system)
CREATE POLICY "clinic_subscriptions_service_update"
    ON clinic_subscriptions
    FOR UPDATE
    TO service_role
    USING (true);

-- Clinic owners and administrators can update limited fields (e.g., payment method)
CREATE POLICY "clinic_subscriptions_owner_admin_update_limited"
    ON clinic_subscriptions
    FOR UPDATE
    TO authenticated
    USING (
        clinic_id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 
            FROM user_roles 
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.clinic_id = clinic_subscriptions.clinic_id
            AND user_roles.is_active = true
            AND user_roles.role_id IN (
                SELECT id FROM roles WHERE name IN ('owner', 'administrator')
            )
        )
    )
    WITH CHECK (
        -- Only allow updating payment-related fields
        payment_method IS NOT DISTINCT FROM (SELECT payment_method FROM clinic_subscriptions WHERE clinic_subscriptions.id = id)
        OR notes IS NOT DISTINCT FROM (SELECT notes FROM clinic_subscriptions WHERE clinic_subscriptions.id = id)
    );

-- Prevent modification of clinic_id (tenant isolation)
CREATE POLICY "clinic_subscriptions_clinic_id_protect"
    ON clinic_subscriptions
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        clinic_id IS NOT DISTINCT FROM (SELECT clinic_id FROM clinic_subscriptions WHERE clinic_subscriptions.id = id)
    );

-- Prevent modification of plan_id (subscription identity)
CREATE POLICY "clinic_subscriptions_plan_id_protect"
    ON clinic_subscriptions
    FOR UPDATE
    TO authenticated
    WITH CHECK (
        plan_id IS NOT DISTINCT FROM (SELECT plan_id FROM clinic_subscriptions WHERE clinic_subscriptions.id = id)
    );

-- DELETE Policies
-- Only service role can delete clinic subscriptions (managed by platform)
CREATE POLICY "clinic_subscriptions_service_delete"
    ON clinic_subscriptions
    FOR DELETE
    TO service_role
    USING (true);
