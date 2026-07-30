-- ============================================================================
-- Jafferi Clinic - Expenses Schema
-- ============================================================================
-- Tracks clinic operational expenses.
-- Expense records for clinic operations including salaries, utilities, supplies, and other business expenses.
-- ============================================================================

-- Expenses Table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    expense_number VARCHAR(50) NOT NULL,
    expense_date DATE NOT NULL,
    category expense_category_enum NOT NULL,
    sub_category VARCHAR(100),
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    payment_method payment_method_enum,
    vendor VARCHAR(255),
    invoice_reference VARCHAR(100),
    receipt_url TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurring_frequency VARCHAR(50),
    next_due_date DATE,
    status expense_status_enum NOT NULL DEFAULT 'pending',
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_expenses_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_expenses_approved_by 
        FOREIGN KEY (approved_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_expenses_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_expenses_updated_by 
        FOREIGN KEY (updated_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    -- Unique Constraint
    CONSTRAINT uk_expenses_clinic_expense_number 
        UNIQUE (clinic_id, expense_number),
    
    -- Check Constraints
    CONSTRAINT chk_expenses_amount_positive 
        CHECK (amount > 0)
);

-- Comments
COMMENT ON TABLE expenses IS 'Tracks clinic operational expenses. Each expense belongs to exactly one clinic.';
COMMENT ON COLUMN expenses.id IS 'Unique identifier for the expense';
COMMENT ON COLUMN expenses.clinic_id IS 'Foreign key to clinics table - expense belongs to this clinic';
COMMENT ON COLUMN expenses.expense_number IS 'Unique expense ID';
COMMENT ON COLUMN expenses.expense_date IS 'Expense date';
COMMENT ON COLUMN expenses.category IS 'Expense category (salary, utilities, supplies, rent, etc.)';
COMMENT ON COLUMN expenses.sub_category IS 'Expense sub-category';
COMMENT ON COLUMN expenses.description IS 'Expense description';
COMMENT ON COLUMN expenses.amount IS 'Expense amount';
COMMENT ON COLUMN expenses.currency IS 'Currency code';
COMMENT ON COLUMN expenses.payment_method IS 'Payment method (cash, card, insurance, transfer)';
COMMENT ON COLUMN expenses.vendor IS 'Vendor/supplier name';
COMMENT ON COLUMN expenses.invoice_reference IS 'Vendor invoice reference';
COMMENT ON COLUMN expenses.receipt_url IS 'Receipt document URL';
COMMENT ON COLUMN expenses.is_recurring IS 'Recurring expense flag';
COMMENT ON COLUMN expenses.recurring_frequency IS 'Recurring frequency (monthly, quarterly, yearly)';
COMMENT ON COLUMN expenses.next_due_date IS 'Next due date for recurring expenses';
COMMENT ON COLUMN expenses.status IS 'Expense status (pending, approved, paid, cancelled)';
COMMENT ON COLUMN expenses.approved_by IS 'Foreign key to profiles table - user who approved';
COMMENT ON COLUMN expenses.approved_at IS 'Approval timestamp';
COMMENT ON COLUMN expenses.notes IS 'Additional notes';
COMMENT ON COLUMN expenses.created_at IS 'Timestamp when the expense was created';
COMMENT ON COLUMN expenses.updated_at IS 'Timestamp when the expense was last updated';
COMMENT ON COLUMN expenses.created_by IS 'Foreign key to profiles table - user who created';
COMMENT ON COLUMN expenses.updated_by IS 'Foreign key to profiles table - user who last updated';
COMMENT ON COLUMN expenses.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_expenses_clinic_id ON expenses(clinic_id);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_is_recurring ON expenses(is_recurring);
CREATE INDEX idx_expenses_next_due_date ON expenses(next_due_date);
CREATE INDEX idx_expenses_deleted_at ON expenses(deleted_at);
CREATE INDEX idx_expenses_clinic_category_date ON expenses(clinic_id, category, expense_date);
CREATE INDEX idx_expenses_clinic_status_date ON expenses(clinic_id, status, expense_date);

-- Triggers for updated_at
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
