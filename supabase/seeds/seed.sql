-- ============================================================================
-- Jafferi Clinic - Master Seed File
-- ============================================================================
-- This is the master seed file that executes all individual seed files.
-- Run this file to populate the database with all seed data.
-- ============================================================================

-- Execute seed files in the correct order to maintain referential integrity
-- 1. Clinics (base data)
-- 2. Users (depends on clinics)
-- 3. Doctors (depends on users and clinics)
-- 4. Patients (depends on clinics)
-- 5. Appointments (depends on patients, doctors, clinics)
-- 6. Medical Records (depends on appointments, patients, doctors, clinics)
-- 7. Prescriptions (depends on medical records, patients, doctors, clinics)
-- 8. Invoices (depends on appointments, patients, clinics)
-- 9. Payments (depends on invoices, clinics)
-- 10. Notifications (depends on users, clinics)
-- 11. Settings (depends on clinics)

-- Note: Each seed file uses ON CONFLICT DO NOTHING to prevent duplicate records
-- This allows safe re-running of the seed file

\i clinics.sql
\i users.sql
\i doctors.sql
\i patients.sql
\i appointments.sql
\i medical_records.sql
\i prescriptions.sql
\i invoices.sql
\i payments.sql
\i notifications.sql
\i settings.sql

-- ============================================================================
-- Seed Data Summary
-- ============================================================================
-- Total Records Created:
-- - Clinics: 5
-- - Subscription Plans: 5
-- - Clinic Subscriptions: 5
-- - Roles: 6
-- - Users: 50 (10 per clinic)
-- - Doctors: 15 (3 per clinic)
-- - Patients: 200 (40 per clinic)
-- - Appointments: 500 (100 per clinic)
-- - Medical Records: 300 (60 per clinic)
-- - Prescriptions: 250 (50 per clinic)
-- - Invoice Items: 300 (60 per clinic)
-- - Invoices: 300 (60 per clinic)
-- - Payments: 250 (50 per clinic)
-- - Notifications: 200 (40 per clinic)
-- - Clinic Settings: 175 (35 per clinic)
-- ============================================================================
