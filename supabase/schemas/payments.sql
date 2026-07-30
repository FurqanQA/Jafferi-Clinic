-- ============================================================================
-- Jafferi Clinic - Payments Schema
-- ============================================================================
-- Tracks payments received for invoices.
-- Payment records linking invoices to payment transactions with method, amount, and status information.
-- ============================================================================

-- Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    invoice_id UUID NOT NULL,
    payment_number VARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method payment_method_enum NOT NULL,
    payment_gateway VARCHAR(50),
    transaction_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status payment_status_enum NOT NULL DEFAULT 'pending',
    notes TEXT,
    refunded_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    refund_reason TEXT,
    refunded_at TIMESTAMPTZ,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_payments_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_payments_invoice_id 
        FOREIGN KEY (invoice_id) 
        REFERENCES invoices(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_payments_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_payments_updated_by 
        FOREIGN KEY (updated_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    -- Unique Constraint
    CONSTRAINT uk_payments_clinic_payment_number 
        UNIQUE (clinic_id, payment_number),
    
    -- Check Constraints
    CONSTRAINT chk_payments_amount_positive 
        CHECK (amount > 0),
    
    CONSTRAINT chk_payments_refunded_amount_non_negative 
        CHECK (refunded_amount >= 0),
    
    CONSTRAINT chk_payments_refunded_amount_not_exceed_amount 
        CHECK (refunded_amount <= amount)
);

-- Comments
COMMENT ON TABLE payments IS 'Tracks payments received for invoices. Each payment belongs to exactly one clinic.';
COMMENT ON COLUMN payments.id IS 'Unique identifier for the payment';
COMMENT ON COLUMN payments.clinic_id IS 'Foreign key to clinics table - payment belongs to this clinic';
COMMENT ON COLUMN payments.invoice_id IS 'Foreign key to invoices table - payment for this invoice';
COMMENT ON COLUMN payments.payment_number IS 'Unique payment ID';
COMMENT ON COLUMN payments.payment_date IS 'Payment date';
COMMENT ON COLUMN payments.payment_method IS 'Payment method (cash, card, insurance, transfer)';
COMMENT ON COLUMN payments.payment_gateway IS 'Payment gateway used';
COMMENT ON COLUMN payments.transaction_id IS 'External transaction ID';
COMMENT ON COLUMN payments.amount IS 'Payment amount';
COMMENT ON COLUMN payments.currency IS 'Currency code';
COMMENT ON COLUMN payments.status IS 'Payment status (pending, completed, failed, refunded)';
COMMENT ON COLUMN payments.notes IS 'Payment notes';
COMMENT ON COLUMN payments.refunded_amount IS 'Refunded amount';
COMMENT ON COLUMN payments.refund_reason IS 'Reason for refund';
COMMENT ON COLUMN payments.refunded_at IS 'Refund timestamp';
COMMENT ON COLUMN payments.receipt_url IS 'Receipt document URL';
COMMENT ON COLUMN payments.created_at IS 'Timestamp when the payment was created';
COMMENT ON COLUMN payments.updated_at IS 'Timestamp when the payment was last updated';
COMMENT ON COLUMN payments.created_by IS 'Foreign key to profiles table - user who recorded';
COMMENT ON COLUMN payments.updated_by IS 'Foreign key to profiles table - user who last updated';
COMMENT ON COLUMN payments.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_payments_clinic_id ON payments(clinic_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_payment_method ON payments(payment_method);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_deleted_at ON payments(deleted_at);
CREATE INDEX idx_payments_clinic_invoice_status ON payments(clinic_id, invoice_id, status);
CREATE INDEX idx_payments_clinic_date_status ON payments(clinic_id, payment_date, status);

-- Triggers for updated_at
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
