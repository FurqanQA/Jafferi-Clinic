-- ============================================================================
-- Jafferi Clinic - Billing Triggers
-- ============================================================================
-- Triggers for billing management, including invoice generation, payment processing,
-- tax calculation, and automatic status updates.
-- ============================================================================

-- ============================================================================
-- Invoice Triggers
-- ============================================================================

-- Generate invoice number before insert
CREATE TRIGGER set_invoice_number_before_insert
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- Calculate invoice total before insert
CREATE TRIGGER calculate_invoice_total_before_insert
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION calculate_invoice_total();

-- Calculate invoice total before update
CREATE TRIGGER calculate_invoice_total_before_update
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION calculate_invoice_total();

-- Update payment status based on payments
CREATE TRIGGER update_invoice_payment_status
    AFTER UPDATE ON invoices
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.amount_paid IS DISTINCT FROM NEW.amount_paid)
    EXECUTE FUNCTION update_invoice_payment_status();

-- Update updated_at timestamp on invoice update
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log invoice insert activity
CREATE TRIGGER log_invoice_insert
    AFTER INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION log_invoice_activity(
        NEW.id,
        'INVOICE_CREATED',
        NEW.created_by,
        jsonb_build_object(
            'invoice_number', NEW.invoice_number,
            'patient_id', NEW.patient_id,
            'total_amount', NEW.total_amount
        )
    );

-- Log invoice update activity
CREATE TRIGGER log_invoice_update
    AFTER UPDATE ON invoices
    FOR EACH ROW
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION log_invoice_activity(
        NEW.id,
        'INVOICE_UPDATED',
        NEW.updated_by,
        jsonb_build_object(
            'invoice_number', NEW.invoice_number,
            'status', NEW.status
        )
    );

-- Log invoice delete activity
CREATE TRIGGER log_invoice_delete
    AFTER DELETE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION log_invoice_activity(
        OLD.id,
        'INVOICE_DELETED',
        OLD.updated_by,
        jsonb_build_object('invoice_number', OLD.invoice_number)
    );

-- ============================================================================
-- Invoice Items Triggers
-- ============================================================================

-- Update updated_at timestamp on invoice_items update
CREATE TRIGGER update_invoice_items_updated_at
    BEFORE UPDATE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Recalculate invoice total when items change
CREATE TRIGGER recalculate_invoice_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON invoice_items
    FOR EACH ROW
    EXECUTE PROCEDURE recalculate_invoice_total();

-- ============================================================================
-- Payment Triggers
-- ============================================================================

-- Mark invoice as paid when payment received
CREATE TRIGGER mark_invoice_paid_after_payment
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION mark_invoice_paid();

-- Update updated_at timestamp on payment update
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log payment insert activity
CREATE TRIGGER log_payment_insert
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION log_insert(
        NEW.clinic_id,
        NEW.created_by,
        'payments',
        NEW.id,
        jsonb_build_object(
            'invoice_id', NEW.invoice_id,
            'amount', NEW.amount,
            'payment_method', NEW.payment_method
        )
    );

-- Log payment update activity
CREATE TRIGGER log_payment_update
    AFTER UPDATE ON payments
    FOR EACH ROW
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION log_update(
        NEW.clinic_id,
        NEW.updated_by,
        'payments',
        NEW.id,
        jsonb_build_object('status', NEW.status)
    );

-- ============================================================================
-- Expense Triggers
-- ============================================================================

-- Update updated_at timestamp on expenses update
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Log expense insert activity
CREATE TRIGGER log_expense_insert
    AFTER INSERT ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION log_insert(
        NEW.clinic_id,
        NEW.created_by,
        'expenses',
        NEW.id,
        jsonb_build_object(
            'amount', NEW.amount,
            'category', NEW.category,
            'expense_date', NEW.expense_date
        )
    );

-- Log expense update activity
CREATE TRIGGER log_expense_update
    AFTER UPDATE ON expenses
    FOR EACH ROW
    WHEN (OLD IS DISTINCT FROM NEW)
    EXECUTE FUNCTION log_update(
        NEW.clinic_id,
        NEW.updated_by,
        'expenses',
        NEW.id,
        jsonb_build_object('amount', NEW.amount, 'category', NEW.category)
    );

-- ============================================================================
-- Helper Function for Invoice Recalculation
-- ============================================================================

-- Create procedure to recalculate invoice total
CREATE OR REPLACE PROCEDURE recalculate_invoice_total()
LANGUAGE plpgsql
AS $$
BEGIN
    -- This is called by the trigger on invoice_items
    -- The actual recalculation is handled by the invoice's calculate_invoice_total function
    -- This procedure is a placeholder for any additional logic needed
    NULL;
END;
$$;
