-- ============================================================================
-- Jafferi Clinic - Invoice Items Schema
-- ============================================================================
-- Stores individual line items within an invoice.
-- Detailed breakdown of invoice items including services, products, descriptions, and pricing.
-- ============================================================================

-- Invoice Items Table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    clinic_id UUID NOT NULL,
    item_type item_type_enum NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    service_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_invoice_items_invoice_id 
        FOREIGN KEY (invoice_id) 
        REFERENCES invoices(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    CONSTRAINT fk_invoice_items_clinic_id 
        FOREIGN KEY (clinic_id) 
        REFERENCES clinics(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    
    -- Check Constraints
    CONSTRAINT chk_invoice_items_quantity_positive 
        CHECK (quantity > 0),
    
    CONSTRAINT chk_invoice_items_unit_price_non_negative 
        CHECK (unit_price >= 0),
    
    CONSTRAINT chk_invoice_items_amounts_non_negative 
        CHECK (discount_amount >= 0 AND tax_amount >= 0),
    
    CONSTRAINT chk_invoice_items_total_amount_calculation 
        CHECK (total_amount = (quantity * unit_price) - discount_amount + tax_amount)
);

-- Comments
COMMENT ON TABLE invoice_items IS 'Stores individual line items within an invoice. Each item belongs to exactly one clinic.';
COMMENT ON COLUMN invoice_items.id IS 'Unique identifier for the invoice item';
COMMENT ON COLUMN invoice_items.invoice_id IS 'Foreign key to invoices table - item belongs to this invoice';
COMMENT ON COLUMN invoice_items.clinic_id IS 'Foreign key to clinics table - item belongs to this clinic';
COMMENT ON COLUMN invoice_items.item_type IS 'Item type (service, product, consultation, procedure, medication)';
COMMENT ON COLUMN invoice_items.description IS 'Item description';
COMMENT ON COLUMN invoice_items.quantity IS 'Quantity';
COMMENT ON COLUMN invoice_items.unit_price IS 'Price per unit';
COMMENT ON COLUMN invoice_items.discount_amount IS 'Discount amount';
COMMENT ON COLUMN invoice_items.tax_amount IS 'Tax amount';
COMMENT ON COLUMN invoice_items.total_amount IS 'Total amount';
COMMENT ON COLUMN invoice_items.service_date IS 'Date service was provided';
COMMENT ON COLUMN invoice_items.notes IS 'Additional notes';
COMMENT ON COLUMN invoice_items.created_at IS 'Timestamp when the item was created';
COMMENT ON COLUMN invoice_items.updated_at IS 'Timestamp when the item was last updated';
COMMENT ON COLUMN invoice_items.deleted_at IS 'Soft delete timestamp';

-- Indexes
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_clinic_id ON invoice_items(clinic_id);
CREATE INDEX idx_invoice_items_item_type ON invoice_items(item_type);
CREATE INDEX idx_invoice_items_service_date ON invoice_items(service_date);
CREATE INDEX idx_invoice_items_deleted_at ON invoice_items(deleted_at);

-- Triggers for updated_at
CREATE TRIGGER update_invoice_items_updated_at
    BEFORE UPDATE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
