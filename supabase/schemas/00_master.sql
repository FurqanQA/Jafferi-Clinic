-- ============================================================================
-- Jafferi Clinic - Master Schema Execution Order
-- ============================================================================
-- This file defines the correct execution order for all schema files.
-- Execute these files in the order listed below to properly set up the database.
-- ============================================================================

-- ============================================================================
-- Phase 1: Foundation (Types and Functions)
-- ============================================================================
-- These must be executed first as they are dependencies for all other tables.

-- 1. Common ENUM types
\i schemas/_types.sql

-- 2. Common functions
\i schemas/_functions.sql

-- ============================================================================
-- Phase 2: Global/Shared Tables
-- ============================================================================
-- These tables are shared across all clinics and have no clinic_id dependency.

-- 3. Roles (RBAC foundation)
\i schemas/roles.sql

-- ============================================================================
-- Phase 3: Core Multi-Tenant Tables
-- ============================================================================
-- These define the tenant structure and core entities.

-- 4. Clinics (defines tenants)
\i schemas/clinics.sql

-- 5. Profiles (extends auth.users, depends on clinics)
\i schemas/profiles.sql

-- 6. User Roles (junction table, depends on profiles, roles, clinics)
\i schemas/user_roles.sql

-- ============================================================================
-- Phase 4: Healthcare Entities
-- ============================================================================
-- Core healthcare domain entities.

-- 7. Doctors (depends on profiles, clinics)
\i schemas/doctors.sql

-- 8. Patients (depends on clinics)
\i schemas/patients.sql

-- 9. Appointment Status (global reference table)
\i schemas/appointment_status.sql

-- 10. Appointments (depends on patients, doctors, clinics, appointment_status)
\i schemas/appointments.sql

-- 11. Medical Records (depends on patients, doctors, clinics, appointments)
\i schemas/medical_records.sql

-- 12. Prescriptions (depends on patients, doctors, clinics, medical_records, appointments)
\i schemas/prescriptions.sql

-- 13. Prescription Medicines (depends on prescriptions, clinics)
\i schemas/prescription_medicines.sql

-- ============================================================================
-- Phase 5: Billing Entities
-- ============================================================================
-- Financial and billing domain entities.

-- 14. Invoices (depends on patients,Clinics, appointments)
\i schemas/invoices.sql

-- 15. Invoice Items (depends on invoices, clinics)
\i schemas/invoice_items.sql

-- 16. Payments (depends on invoices, clinics)
\i schemas/payments.sql

-- 17. Expenses (depends on clinics)
\i schemas/expenses.sql

-- ============================================================================
-- Phase 6: System Entities
-- ============================================================================
-- System-wide entities for notifications, settings, and auditing.

-- 18. Notifications (depends on clinics, profiles)
\i schemas/notifications.sql

-- 19. Clinic Settings (depends on clinics)
\i schemas/clinic_settings.sql

-- 20. Activity Logs (depends on clinics, profiles)
\i schemas/activity_logs.sql

-- 21. File Attachments (depends on clinics, profiles)
\i schemas/file_attachments.sql

-- ============================================================================
-- Phase 7: Subscription Entities
-- ============================================================================
-- SaaS subscription management.

-- 22. Subscription Plans (global reference table)
\i schemas/subscriptions.sql

-- ============================================================================
-- Phase 8: AI Features (Future Expansion)
-- ============================================================================
-- AI-powered features for future expansion.

-- 23. AI Features (depends on clinics, profiles)
\i schemas/ai.sql

-- ============================================================================
-- Execution Complete
-- ============================================================================
-- All tables have been created in the correct dependency order.
-- Next steps:
-- 1. Create Row Level Security (RLS) policies
-- 2. Create database functions and triggers
-- 3. Seed initial data (roles, appointment statuses, subscription plans)
-- ============================================================================
