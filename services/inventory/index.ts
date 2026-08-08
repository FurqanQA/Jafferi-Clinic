// ============================================================================
// Inventory Service Index
// Main export file for the Enterprise Pharmacy Inventory & Supply Chain Management Service
// ============================================================================

// Medicine catalog
export * from './generic-medicines';
export * from './brands';
export * from './categories';
export * from './dosage-forms';
export * from './strengths';

// Suppliers and warehouses
export * from './suppliers';
export * from './warehouses';
export * from './warehouse-locations';

// Stock management
export * from './stock';
export * from './stock-movement';
export * from './stock-adjustment';
export * from './stock-transfer';
export * from './stock-reservation';
export * from './dispensing';

// Purchase management
export * from './purchase-requests';
export * from './purchase-orders';
export * from './receiving';
export * from './supplier-invoices';
export * from './returns';

// Batch and expiry management
export * from './expiry';
export * from './batches';
export * from './serial-numbers';

// Reorder and alerts
export * from './reorder';
export * from './alerts';

// Barcode, QR, and print
export * from './barcode';
export * from './qr';
export * from './print';

// Analytics and forecasting
export * from './analytics';
export * from './forecasting';

// Generic CRUD operations
export * from './create-item';
export * from './update-item';
export * from './archive-item';
export * from './restore-item';
export * from './delete-item';
export * from './get-item';
export * from './get-items';
export * from './search-items';
export * from './export-items';
