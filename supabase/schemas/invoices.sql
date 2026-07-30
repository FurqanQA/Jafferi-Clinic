-- ============================================================================
-- Jafferi Clinic - Invoices Schema
-- ============================================================================
-- Manages patient billing invoices.
-- Invoice records for services rendered to patients, including status, amounts, and payment tracking.
-- ============================================================================

-- Invoices Table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    appointment_id UUID,
    invoice_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance_due DECIMAL(10,2) NOT NULL,
    status invoice_status_enum NOT NULL DEFAULT 'draft',
    payment_terms VARCHAR(100),
    notes TEXT,
    sent_date DATE,
    reminder_sent BOOLEAN NOT NULL DEFAULT false,
    reminder_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_invoices_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_invoices_patient_id 
        FOREIGN KEY (patient_id) 
        REFERENCES patients(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_invoices_appointment_id 
        FOREIGN KEY (appointment_id) 
        REFERENCES appointments(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_invoices_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_invoices_updated_by 
        FOREIGN KEY (updated_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    
    -- Unique Constraint
    CONSTRAINT uk_invoices_clinic_invoice_number 
        UNIQUE (clinic_id, invoice_number),
    
    -- Check Constraints
    CONSTRAINT chk_invoices_amounts_non_negative 
        CHECK (subtotal >= 0 AND tax_amount >= 0 AND discount_amount >= 0 AND amount_paid >= 0),
    
    CONSTRAINT chk_invoices_total_amount_calculation 
        CHECK (total_amount = subtotal + tax_amount - discount_amount),
    
    CONSTRAINT chk_invoices_balance_due_calculation 
        CHECK (balance_due = total_amount - amount_paid)
);

-- Comments
COMMENT ON TABLE invoices IS 'Manages patient billing invoices. Each invoice belongs to exactly one clinic.';
COMMENT ON COLUMN invoices.id IS 'Unique identifier for the invoice';
COMMENT ON COLUMN invoices.clinic_id IS 'Foreign key to clinics table - invoice belongs to this clinic';
COMMENT ON COLUMN invoices.patient_id IS 'Foreign key to patients table - invoice for this patient';
COMMENT ON COLUMN invoices.invoice_number IS 'Unique invoice number';
COMMENT ON COLUMN invoices.appointment_id IS 'Foreign key to appointments table - invoice for this appointment (optional)';
COMMENT ON COLUMN invoices.invoice_date IS 'Invoice date';
COMMENT ON COLUMN invoices.due_date IS 'Payment due date';
COMMENT ON COLUMN invoices.subtotal IS 'Subtotal amount';
COMMENT ON COLUMN invoices.tax_amount IS 'Tax amount';
COMMENT ON COLUMN invoices.discount_amount IS 'Discount amount';
COMMENT ON COLUMN invoices.total_amount IS 'Total amount';
COMMENT ON COLUMN invoices.amount_paid IS 'Amount paid';
COMMENT ON COLUMN invoices.balance_due IS 'Balance remaining';
COMMENT ON COLUMN invoices.status IS 'Invoice status (draft, sent, partial, paid, overdue, cancelled)';
COMMENT ON COLUMN invoices.payment_terms IS 'Payment terms';
COMMENT ON COLUMN invoices.notes IS 'Invoice notes';
COMMENT ON COLUMN invoices.sent_date IS 'Date invoice was sent to patient';
COMMENT ON COLUMN invoices.reminder_sent IS 'Payment reminder sent flag';
COMMENT ON COLUMN invoices.reminder_sent_at IS 'Reminder sent timestamp';
COMMENT ON COLUMN invoices.created_at IS 'Timestamp when the invoice was created';
COMMENT ON COLUMN invoices.updated_at IS 'Timestamp when the invoice was last updated';
COMMENT ON COLUMN invoices.created_by IS 'Foreign key to profiles table - user who created';
COMMENT ON COLUMN invoices.updated_by IS 'Foreign key to profiles table - user who last updated';
COMMENT ON COLUMN invoices.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_invoices_clinic_id ON invoices(clinic_id);
CREATE INDEX idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX idx_invoices_appointment_id ON invoices(appointment_id);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_deleted_at ON invoices(deleted_at);
CREATE INDEX idx_invoices_clinic_patient_status ON invoices(clinic_id, patient_id, status);
CREATE INDEX idx_invoices_clinic_status_due_date ON invoices(clinic_id, status, due_date);

-- Triggers for updated_at
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
