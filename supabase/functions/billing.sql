-- ============================================================================
-- Jafferi Clinic - Billing Functions
-- ============================================================================
-- Functions for billing management, including invoice generation, payment processing,
-- tax calculation, discount calculation, and automatic payment status updates.
-- ============================================================================

-- ============================================================================
-- Invoice Creation
-- ============================================================================

-- Generate invoice number before insert
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate invoice number if not provided
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number(NEW.clinic_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Invoice Calculations
-- ============================================================================

-- Calculate invoice total from items
CREATE OR REPLACE FUNCTION calculate_invoice_total()
RETURNS TRIGGER AS $$
DECLARE
    subtotal NUMERIC;
    tax_amount NUMERIC;
    discount_amount NUMERIC;
    total_amount NUMERIC;
BEGIN
    -- Calculate subtotal from invoice items
    SELECT COALESCE(SUM(quantity * unit_price), 0) INTO subtotal
    FROM invoice_items
    WHERE invoice_id = NEW.id;
    
    -- Calculate tax amount
    tax_amount := subtotal * (COALESCE(NEW.tax_rate, 0) / 100);
    
    -- Calculate discount amount
    IF NEW.discount_type = 'percentage' THEN
        discount_amount := subtotal * (COALESCE(NEW.discount_amount, 0) / 100);
    ELSE
        discount_amount := COALESCE(NEW.discount_amount, 0);
    END IF;
    
    -- Calculate total
    total_amount := subtotal + tax_amount - discount_amount;
    
    -- Update invoice
    NEW.subtotal := subtotal;
    NEW.tax_amount := tax_amount;
    NEW.discount_amount := discount_amount;
    NEW.total_amount := total_amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate tax based on clinic settings
CREATE OR REPLACE FUNCTION calculate_invoice_tax()
RETURNS NUMERIC AS $$
DECLARE
    p_invoice_id ALIAS FOR $1;
    clinic_tax_rate NUMERIC;
    subtotal NUMERIC;
BEGIN
    -- Get clinic tax rate from settings
    SELECT setting_value::NUMERIC INTO clinic_tax_rate
    FROM clinic_settings
    WHERE clinic_id = (SELECT clinic_id FROM invoices WHERE id = p_invoice_id)
    AND setting_key = 'tax_rate';
    
    -- Get subtotal
    SELECT COALESCE(SUM(quantity * unit_price), 0) INTO subtotal
    FROM invoice_items
    WHERE invoice_id = p_invoice_id;
    
    RETURN subtotal * (COALESCE(clinic_tax_rate, 0) / 100);
END;
$$ LANGUAGE plpgsql;

-- Calculate discount based on patient or clinic settings
CREATE OR REPLACE FUNCTION calculate_invoice_discount(p_invoice_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    patient_id UUID;
    clinic_id UUID;
    discount_percentage NUMERIC;
    subtotal NUMERIC;
BEGIN
    -- Get patient and clinic
    SELECT patient_id, clinic_id INTO patient_id, clinic_id
    FROM invoices
    WHERE id = p_invoice_id;
    
    -- Get subtotal
    SELECT COALESCE(SUM(quantity * unit_price), 0) INTO subtotal
    FROM invoice_items
    WHERE invoice_id = p_invoice_id;
    
    -- Check for patient discount
    SELECT COALESCE(discount_percentage, 0) INTO discount_percentage
    FROM patients
    WHERE id = patient_id;
    
    -- If no patient discount, check clinic default
    IF discount_percentage = 0 THEN
        SELECT COALESCE(setting_value::NUMERIC, 0) INTO discount_percentage
        FROM clinic_settings
        WHERE clinic_id = clinic_id
        AND setting_key = 'default_discount';
    END IF;
    
    RETURN subtotal * (discount_percentage / 100);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Payment Processing
-- ============================================================================

-- Update payment status based on payments received
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    total_paid NUMERIC;
    invoice_total NUMERIC;
    payment_percentage NUMERIC;
BEGIN
    -- Calculate total paid
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payments
    WHERE invoice_id = NEW.id
    AND status = 'completed';
    
    -- Get invoice total
    invoice_total := NEW.total_amount;
    
    -- Calculate payment percentage
    IF invoice_total > 0 THEN
        payment_percentage := (total_paid / invoice_total) * 100;
    ELSE
        payment_percentage := 0;
    END IF;
    
    -- Update status based on payment
    IF payment_percentage >= 100 THEN
        NEW.status := 'paid';
        NEW.paid_at := NOW();
    ELSIF payment_percentage > 0 THEN
        NEW.status := 'partial';
    ELSE
        NEW.status := 'pending';
    END IF;
    
    -- Update amount paid
    NEW.amount_paid := total_paid;
    NEW.amount_due := invoice_total - total_paid;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mark invoice as paid when full payment received
CREATE OR REPLACE FUNCTION mark_invoice_paid()
RETURNS TRIGGER AS $$
DECLARE
    invoice_total NUMERIC;
    total_paid NUMERIC;
BEGIN
    -- Only process completed payments
    IF NEW.status != 'completed' THEN
        RETURN NEW;
    END IF;
    
    -- Get invoice total
    SELECT total_amount INTO invoice_total
    FROM invoices
    WHERE id = NEW.invoice_id;
    
    -- Calculate total paid including this payment
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payments
    WHERE invoice_id = NEW.invoice_id
    AND status = 'completed';
    
    -- Update invoice if fully paid
    IF total_paid >= invoice_total THEN
        UPDATE invoices
        SET status = 'paid',
            paid_at = NOW(),
            amount_paid = total_paid,
            amount_due = 0,
            updated_at = NOW()
        WHERE id = NEW.invoice_id;
    ELSE
        UPDATE invoices
        SET status = 'partial',
            amount_paid = total_paid,
            amount_due = invoice_total - total_paid,
            updated_at = NOW()
        WHERE id = NEW.invoice_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Invoice Management
-- ============================================================================

-- Create invoice from appointment
CREATE OR REPLACE FUNCTION create_invoice_from_appointment(
    p_appointment_id UUID,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_invoice_id UUID;
    clinic_id UUID;
    patient_id UUID;
    doctor_id UUID;
    consultation_fee NUMERIC;
BEGIN
    -- Get appointment details
    SELECT clinic_id, patient_id, doctor_id INTO clinic_id, patient_id, doctor_id
    FROM appointments
    WHERE id = p_appointment_id;
    
    -- Get consultation fee from settings
    SELECT COALESCE(setting_value::NUMERIC, 50) INTO consultation_fee
    FROM clinic_settings
    WHERE clinic_id = clinic_id
    AND setting_key = 'consultation_fee';
    
    -- Create invoice
    INSERT INTO invoices (
        clinic_id,
        patient_id,
        appointment_id,
        invoice_number,
        subtotal,
        tax_rate,
        tax_amount,
        discount_amount,
        total_amount,
        amount_paid,
        amount_due,
        status,
        due_date,
        created_by,
        updated_by,
        created_at,
        updated_at
    ) VALUES (
        clinic_id,
        patient_id,
        p_appointment_id,
        generate_invoice_number(clinic_id),
        consultation_fee,
        0,
        0,
        0,
        consultation_fee,
        0,
        consultation_fee,
        'pending',
        CURRENT_DATE + INTERVAL '30 days',
        p_created_by,
        p_created_by,
        NOW(),
        NOW()
    ) RETURNING id INTO new_invoice_id;
    
    -- Create invoice item
    INSERT INTO invoice_items (
        invoice_id,
        clinic_id,
        item_type,
        description,
        quantity,
        unit_price,
        total_price,
        created_at,
        updated_at
    ) VALUES (
        new_invoice_id,
        clinic_id,
        'service',
        'Consultation Fee',
        1,
        consultation_fee,
        consultation_fee,
        NOW(),
        NOW()
    );
    
    -- Log activity
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        clinic_id,
        p_created_by,
        'INVOICE_CREATED',
        'invoices',
        new_invoice_id,
        jsonb_build_object(
            'appointment_id', p_appointment_id,
            'amount', consultation_fee
        ),
        NOW()
    );
    
    RETURN new_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Send invoice reminder
CREATE OR REPLACE FUNCTION send_invoice_reminder(p_invoice_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    clinic_id UUID;
    patient_id UUID;
    patient_email TEXT;
    patient_name TEXT;
    invoice_number TEXT;
    due_date DATE;
BEGIN
    -- Get invoice details
    SELECT i.clinic_id, i.patient_id, i.invoice_number, i.due_date,
           p.email, CONCAT(p.first_name, ' ', p.last_name)
    INTO clinic_id, patient_id, invoice_number, due_date, patient_email, patient_name
    FROM invoices i
    JOIN patients p ON i.patient_id = p.id
    WHERE i.id = p_invoice_id;
    
    -- Create notification for patient
    INSERT INTO notifications (
        clinic_id,
        user_id,
        type,
        title,
        message,
        data,
        created_at
    ) VALUES (
        clinic_id,
        (SELECT user_id FROM profiles WHERE id = patient_id),
        'invoice_reminder',
        'Invoice Payment Reminder',
        'Your invoice ' || invoice_number || ' is due on ' || due_date,
        jsonb_build_object(
            'invoice_id', p_invoice_id,
            'invoice_number', invoice_number,
            'due_date', due_date
        ),
        NOW()
    );
    
    -- Log activity
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        clinic_id,
        NULL,
        'INVOICE_REMINDER_SENT',
        'invoices',
        p_invoice_id,
        jsonb_build_object(
            'invoice_number', invoice_number,
            'patient_email', patient_email
        ),
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Payment Management
-- ============================================================================

-- Process payment
CREATE OR REPLACE FUNCTION process_payment(
    p_invoice_id UUID,
    p_amount NUMERIC,
    p_payment_method TEXT,
    p_reference_number TEXT DEFAULT NULL,
    p_processed_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_payment_id UUID;
    clinic_id UUID;
BEGIN
    -- Get clinic_id
    SELECT clinic_id INTO clinic_id
    FROM invoices
    WHERE id = p_invoice_id;
    
    -- Create payment
    INSERT INTO payments (
        clinic_id,
        invoice_id,
        amount,
        payment_method,
        reference_number,
        status,
        payment_date,
        created_by,
        updated_by,
        created_at,
        updated_at
    ) VALUES (
        clinic_id,
        p_invoice_id,
        p_amount,
        p_payment_method,
        p_reference_number,
        'completed',
        NOW(),
        p_processed_by,
        p_processed_by,
        NOW(),
        NOW()
    ) RETURNING id INTO new_payment_id;
    
    -- Log activity
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        clinic_id,
        p_processed_by,
        'PAYMENT_RECEIVED',
        'payments',
        new_payment_id,
        jsonb_build_object(
            'invoice_id', p_invoice_id,
            'amount', p_amount,
            'payment_method', p_payment_method
        ),
        NOW()
    );
    
    RETURN new_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refund payment
CREATE OR REPLACE FUNCTION refund_payment(
    p_payment_id UUID,
    p_refund_amount NUMERIC,
    p_refund_reason TEXT DEFAULT NULL,
    p_refunded_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    clinic_id UUID;
    invoice_id UUID;
    original_amount NUMERIC;
BEGIN
    -- Get payment details
    SELECT clinic_id, invoice_id, amount INTO clinic_id, invoice_id, original_amount
    FROM payments
    WHERE id = p_payment_id;
    
    -- Validate refund amount
    IF p_refund_amount > original_amount THEN
        RAISE EXCEPTION 'Refund amount cannot exceed original payment amount';
    END IF;
    
    -- Update payment status
    UPDATE payments
    SET status = 'refunded',
        refund_amount = p_refund_amount,
        refund_reason = p_refund_reason,
        refunded_at = NOW(),
        updated_at = NOW()
    WHERE id = p_payment_id;
    
    -- Update invoice status
    UPDATE invoices
    SET amount_paid = amount_paid - p_refund_amount,
        amount_due = amount_due + p_refund_amount,
        status = CASE 
            WHEN amount_paid - p_refund_amount = 0 THEN 'pending'
            ELSE 'partial'
        END,
        updated_at = NOW()
    WHERE id = invoice_id;
    
    -- Log activity
    INSERT INTO activity_logs (
        clinic_id,
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        clinic_id,
        p_refunded_by,
        'PAYMENT_REFUNDED',
        'payments',
        p_payment_id,
        jsonb_build_object(
            'refund_amount', p_refund_amount,
            'reason', p_refund_reason
        ),
        NOW()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
