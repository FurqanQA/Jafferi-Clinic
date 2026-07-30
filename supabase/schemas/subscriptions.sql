-- ============================================================================
-- Jafferi Clinic - Subscriptions Schema
-- ============================================================================
-- Manages subscription plans and clinic subscriptions.
-- Subscription plan definitions and clinic subscription records for the SaaS multi-tenant system.
-- ============================================================================

-- Subscription Plans Table
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    monthly_price DECIMAL(10,2) NOT NULL,
    yearly_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    billing_cycle billing_cycle_enum NOT NULL DEFAULT 'monthly',
    max_doctors INTEGER,
    max_patients INTEGER,
    max_appointments_per_month INTEGER,
    features JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_trial_available BOOLEAN NOT NULL DEFAULT true,
    trial_days INTEGER DEFAULT 14,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Check Constraints
    CONSTRAINT chk_subscription_plans_prices_positive 
        CHECK (monthly_price >= 0 AND yearly_price >= 0),
    
    CONSTRAINT chk_subscription_plans_limits_non_negative 
        CHECK (max_doctors IS NULL OR max_doctors >= 0) 
        AND (max_patients IS NULL OR max_patients >= 0) 
        AND (max_appointments_per_month IS NULL OR max_appointments_per_month >= 0),
    
    CONSTRAINT chk_subscription_plans_trial_days_positive 
        CHECK (trial_days >= 0)
);

-- Comments
COMMENT ON TABLE subscription_plans IS 'Defines available subscription plans for the SaaS platform. Global table shared across all clinics.';
COMMENT ON COLUMN subscription_plans.id IS 'Unique identifier for the subscription plan';
COMMENT ON COLUMN subscription_plans.name IS 'Plan name (slug)';
COMMENT ON COLUMN subscription_plans.display_name IS 'Human-readable plan name';
COMMENT ON COLUMN subscription_plans.description IS 'Plan description';
COMMENT ON COLUMN subscription_plans.monthly_price IS 'Monthly price';
COMMENT ON COLUMN subscription_plans.yearly_price IS 'Yearly price';
COMMENT ON COLUMN subscription_plans.currency IS 'Currency code';
COMMENT ON COLUMN subscription_plans.billing_cycle IS 'Billing cycle (monthly, quarterly, yearly)';
COMMENT ON COLUMN subscription_plans.max_doctors IS 'Maximum number of doctors allowed';
COMMENT ON COLUMN subscription_plans.max_patients IS 'Maximum number of patients allowed';
COMMENT ON COLUMN subscription_plans.max_appointments_per_month IS 'Maximum appointments per month';
COMMENT ON COLUMN subscription_plans.features IS 'Plan features (JSON)';
COMMENT ON COLUMN subscription_plans.is_active IS 'Plan active status';
COMMENT ON COLUMN subscription_plans.is_trial_available IS 'Whether trial is available';
COMMENT ON COLUMN subscription_plans.trial_days IS 'Trial duration in days';
COMMENT ON COLUMN subscription_plans.sort_order IS 'Display order';
COMMENT ON COLUMN subscription_plans.created_at IS 'Timestamp when the plan was created';
COMMENT ON COLUMN subscription_plans.updated_at IS 'Timestamp when the plan was last updated';

-- Indexes
CREATE INDEX idx_subscription_plans_name ON subscription_plans(name);
CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_sort_order ON subscription_plans(sort_order);

-- Triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Clinic Subscriptions Table
CREATE TABLE clinic_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    plan_id UUID NOT NULL,
    status subscription_status_enum NOT NULL DEFAULT 'trial',
    billing_cycle billing_cycle_enum NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE,
    trial_end_date DATE,
    next_billing_date DATE,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    payment_method VARCHAR(50),
    payment_gateway VARCHAR(50),
    external_subscription_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_clinic_subscriptions_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_clinic_subscriptions_plan_id 
        FOREIGN KEY (plan_id) 
        REFERENCES subscription_plans(id) 
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    
    -- Unique Constraint
    CONSTRAINT uk_clinic_subscriptions_clinic_id 
        UNIQUE (clinic_id),
    
    -- Check Constraints
    CONSTRAINT chk_clinic_subscriptions_dates_valid 
        CHECK (end_date IS NULL OR end_date > start_date),
    
    CONSTRAINT chk_clinic_subscriptions_trial_end_after_start 
        CHECK (trial_end_date IS NULL OR trial_end_date > start_date)
);

-- Comments
COMMENT ON TABLE clinic_subscriptions IS 'Manages clinic subscriptions to plans. Each clinic has exactly one subscription.';
COMMENT ON COLUMN clinic_subscriptions.id IS 'Unique identifier for the clinic subscription';
COMMENT ON COLUMN clinic_subscriptions.clinic_id IS 'Foreign key to clinics table - subscription for this clinic';
COMMENT ON COLUMN clinic_subscriptions.plan_id IS 'Foreign key to subscription_plans table - current plan';
COMMENT ON COLUMN clinic_subscriptions.status IS 'Subscription status (trial, active, past_due, cancelled, expired)';
COMMENT ON COLUMN clinic_subscriptions.billing_cycle IS 'Billing cycle (monthly, quarterly, yearly)';
COMMENT ON COLUMN clinic_subscriptions.start_date IS 'Subscription start date';
COMMENT ON COLUMN clinic_subscriptions.end_date IS 'Subscription end date';
COMMENT ON COLUMN clinic_subscriptions.trial_end_date IS 'Trial end date';
COMMENT ON COLUMN clinic_subscriptions.next_billing_date IS 'Next billing date';
COMMENT ON COLUMN clinic_subscriptions.cancel_at_period_end IS 'Cancel at period end flag';
COMMENT ON COLUMN clinic_subscriptions.cancelled_at IS 'Cancellation timestamp';
COMMENT ON COLUMN clinic_subscriptions.cancellation_reason IS 'Reason for cancellation';
COMMENT ON COLUMN clinic_subscriptions.payment_method IS 'Payment method';
COMMENT ON COLUMN clinic_subscriptions.payment_gateway IS 'Payment gateway';
COMMENT ON COLUMN clinic_subscriptions.external_subscription_id IS 'External subscription ID (Stripe, etc.)';
COMMENT ON COLUMN clinic_subscriptions.notes IS 'Additional notes';
COMMENT ON COLUMN clinic_subscriptions.created_at IS 'Timestamp when the subscription was created';
COMMENT ON COLUMN clinic_subscriptions.updated_at IS 'Timestamp when the subscription was last updated';

-- Indexes
CREATE INDEX idx_clinic_subscriptions_clinic_id ON clinic_subscriptions(clinic_id);
CREATE INDEX idx_clinic_subscriptions_plan_id ON clinic_subscriptions(plan_id);
CREATE INDEX idx_clinic_subscriptions_status ON clinic_subscriptions(status);
CREATE INDEX idx_clinic_subscriptions_end_date ON clinic_subscriptions(end_date);
CREATE INDEX idx_clinic_subscriptions_next_billing_date ON clinic_subscriptions(next_billing_date);
CREATE INDEX idx_clinic_subscriptions_status_next_billing ON clinic_subscriptions(status, next_billing_date);

-- Triggers for updated_at
CREATE TRIGGER update_clinic_subscriptions_updated_at
    BEFORE UPDATE ON clinic_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
