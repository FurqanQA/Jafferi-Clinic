-- ============================================================================
-- Jafferi Clinic - Clinic Settings Seed Data
-- ============================================================================
-- Production-ready development seed data for clinic settings.
-- Creates default settings for each of the 5 clinics including:
-- - General settings (business hours, timezone, currency)
-- - Appointment settings (duration, buffer time, cancellation policy)
-- - Invoice settings (tax rate, payment terms, late fees)
-- - Notification settings (email, SMS, in-app)
-- - Security settings (password policy, 2FA)
-- ============================================================================

-- Insert Clinic Settings for Clinic 1: Jafferi Dental Clinic
INSERT INTO clinic_settings (id, clinic_id, setting_key, setting_value, setting_type, description, created_by, updated_by, created_at, updated_at)
VALUES 
    -- General Settings
    ('ll0e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'business_hours_monday', '08:00-17:00', 'general', 'Monday business hours', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440000', 'business_hours_tuesday', '08:00-17:00', 'general', 'Tuesday business hours', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440000', 'business_hours_wednesday', '08:00-17:00', 'general', 'Wednesday business hours', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440000', 'business_hours_thursday', '08:00-17:00', 'general', 'Thursday business hours', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440000', 'business_hours_friday', '08:00-17:00', 'general', 'Friday business hours', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440000', 'business_hours_saturday', '09:00-14:00', 'general', 'Saturday business hours', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440000', 'business_hours_sunday', 'closed', 'general', 'Sunday business hours', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440000', 'timezone', 'America/New_York', 'general', 'Clinic timezone', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440000', 'currency', 'USD', 'general', 'Default currency', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440000', 'language', 'en', 'general', 'Default language', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    
    -- Appointment Settings
    ('ll0e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440000', 'default_appointment_duration', '30', 'appointment', 'Default appointment duration in minutes', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440000', 'appointment_buffer_time', '15', 'appointment', 'Buffer time between appointments in minutes', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440000', 'cancellation_policy_hours', '24', 'appointment', 'Minimum hours before cancellation without penalty', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440000', 'no_show_fee', '50.00', 'appointment', 'Fee for no-show appointments', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440000', 'advance_booking_days', '30', 'appointment', 'Maximum days in advance for booking', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    
    -- Invoice Settings
    ('ll0e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440000', 'tax_rate', '8.00', 'invoice', 'Tax rate percentage', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440000', 'payment_terms_days', '15', 'invoice', 'Payment terms in days', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440000', 'late_fee_percentage', '5.00', 'invoice', 'Late fee percentage per month', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440018', '660e8400-e29b-41d4-a716-446655440000', 'auto_invoice', 'true', 'invoice', 'Automatically generate invoices after appointments', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    
    -- Notification Settings
    ('ll0e8400-e29b-41d4-a716-446655440019', '660e8400-e29b-41d4-a716-446655440000', 'email_notifications', 'true', 'notification', 'Enable email notifications', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440020', '660e8400-e29b-41d4-a716-446655440000', 'sms_notifications', 'true', 'notification', 'Enable SMS notifications', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440021', '660e8400-e29b-41d4-a716-446655440000', 'appointment_reminder_hours', '24', 'notification', 'Hours before appointment to send reminder', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440022', '660e8400-e29b-41d4-a716-446655440000', 'invoice_reminder_days', '7', 'notification', 'Days before invoice due to send reminder', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    
    -- Security Settings
    ('ll0e8400-e29b-41d4-a716-446655440023', '660e8400-e29b-41d4-a716-446655440000', 'password_min_length', '8', 'security', 'Minimum password length', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440024', '660e8400-e29b-41d4-a716-446655440000', 'password_require_uppercase', 'true', 'security', 'Require uppercase in password', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440025', '660e8400-e29b-41d4-a716-446655440000', 'password_require_lowercase', 'true', 'security', 'Require lowercase in password', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440026', '660e8400-e29b-41d4-a716-446655440000', 'password_require_number', 'true', 'security', 'Require number in password', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440027', '660e8400-e29b-41d4-a716-446655440000', 'password_require_special', 'true', 'security', 'Require special character in password', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440028', '660e8400-e29b-41d4-a716-446655440000', 'two_factor_enabled', 'false', 'security', 'Enable two-factor authentication', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440029', '660e8400-e29b-41d4-a716-446655440000', 'session_timeout_minutes', '60', 'security', 'Session timeout in minutes', '990e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Clinic Settings for Clinic 2: Smile Care Center
INSERT INTO clinic_settings (id, clinic_id, setting_key, setting_value, setting_type, description, created_by, updated_by, created_at, updated_at)
VALUES 
    -- General Settings
    ('ll0e8400-e29b-41d4-a716-446655440030', '660e8400-e29b-41d4-a716-446655440001', 'business_hours_monday', '08:30-17:30', 'general', 'Monday business hours', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440031', '660e8400-e29b-41d4-a716-446655440001', 'business_hours_tuesday', '08:30-17:30', 'general', 'Tuesday business hours', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440032', '660e8400-e29b-41d4-a716-446655440001', 'business_hours_kednesday', '08:30-17:30', 'general', 'Wednesday business hours', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440033', '660e8400-e29b-41d4-a716-446655440001', 'business_hours_thursday', '08:30-17:30', 'general', 'Thursday business hours', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440034', '660e8400-e29b-41d4-a716-446655440001', 'business_hours_friday', '08:30-17:30', 'general', 'Friday business hours', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440035', '660e8400-e29b-41d4-a716-446655440001', 'business_hours_saturday', '09:00-15:00', 'general', 'Saturday business hours', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440036', '660e8400-e29b-41d4-a716-446655440001', 'business_hours_sunday', 'closed', 'general', 'Sunday business hours', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440037', '660e8400-e29b-41d4-a716-446655440001', 'timezone', 'America/Los_Angeles', 'general', 'Clinic timezone', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440038', '660e8400-e29b-41d4-a716-446655440001', 'currency', 'USD', 'general', 'Default currency', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440039', '660e8400-e29b-41d4-a716-446655440001', 'language', 'en', 'general', 'Default language', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    
    -- Appointment Settings
    ('ll0e8400-e29b-41d4-a716-446655440040', '660e8400-e29b-41d4-a716-446655440001', 'default_appointment_duration', '30', 'appointment', 'Default appointment duration in minutes', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440041', '660e8400-e29b-41d4-a716-446655440001', 'appointment_buffer_time', '10', 'appointment', 'Buffer time between appointments in minutes', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440042', '660e8400-e29b-41d4-a716-446655440001', 'cancellation_policy_hours', '24', 'appointment', 'Minimum hours before cancellation without penalty', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440043', '660e8400-e29b-41d4-a716-446655440001', 'no_show_fee', '35.00', 'appointment', 'Fee for no-show appointments', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440044', '660e8400-e29b-41d4-a716-446655440001', 'advance_booking_days', '45', 'appointment', 'Maximum days in advance for booking', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    
    -- Invoice Settings
    ('ll0e8400-e29b-41d4-a716-446655440045', '660e8400-e29b-41d4-a716-446655440001', 'tax_rate', '7.25', 'invoice', 'Tax rate percentage', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440046', '660e8400-e29b-41d4-a716-446655440001', 'payment_terms_days', '30', 'invoice', 'Payment terms in days', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440047', '660e8400-e29b-41d4-a716-446655440001', 'late_fee_percentage', '3.00', 'invoice', 'Late fee percentage per month', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440048', '660e8400-e29b-41d4-a716-446655440001', 'auto_invoice', 'true', 'invoice', 'Automatically generate invoices after appointments', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    
    -- Notification Settings
    ('ll0e8400-e29b-41d4-a716-446655440049', '660e8400-e29b-41d4-a716-446655440001', 'email_notifications', 'true', 'notification', 'Enable email notifications', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440050', '660e8400-e29b-41d4-a716-446655440001', 'sms_notifications', 'false', 'notification', 'Enable SMS notifications', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440051', '660e8400-e29b-41d4-a716-446655440001', 'appointment_reminder_hours', '48', 'notification', 'Hours before appointment to send reminder', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440052', '660e8400-e29b-41d4-a716-446655440001', 'invoice_reminder_days', '5', 'notification', 'Days before invoice due to send reminder', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    
    -- Security Settings
    ('ll0e8400-e29b-41d4-a716-446655440053', '660e8400-e29b-41d4-a716-446655440001', 'password_min_length', '8', 'security', 'Minimum password length', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440054', '660e8400-e29b-41d4-a716-446655440001', 'password_require_uppercase', 'true', 'security', 'Require uppercase in password', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440055', '660e8400-e29b-41d4-a716-446655440001', 'password_require_lowercase', 'true', 'security', 'Require lowercase in password', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440056', '660e8400-e29b-41d4-a716-446655440001', 'password_require_number', 'true', 'security', 'Require number in password', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440057', '660e8400-e29b-41d4-a716-446655440001', 'password_require_special', 'false', 'security', 'Require special character in password', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440058', '660e8400-e29b-41d4-a716-446655440001', 'two_factor_enabled', 'false', 'security', 'Enable two-factor authentication', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440059', '660e8400-e29b-41d4-a716-446655440001', 'session_timeout_minutes', '30', 'security', 'Session timeout in minutes', '990e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Clinic Settings for Clinic 3: City Medical Clinic
INSERT INTO clinic_settings (id, clinic_id, setting_key, setting_value, setting_type, description, created_by, updated_by, created_at, updated_at)
VALUES 
    -- General Settings
    ('ll0e8400-e29b-41d4-a716-446655440060', '660e8400-e29b-41d4-a716-446655440002', 'business_hours_monday', '07:00-19:00', 'general', 'Monday business hours', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440061', '660e8400-e29b-41d4-a716-446655440002', 'business_hours_tuesday', '07:00-19:00', 'general', 'Tuesday business hours', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440062', '660e8400-e29b-41d4-a716-446655440002', 'business_hours_wednesday', '07:00-19:00', 'general', 'Wednesday business hours', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440063', '660e8400-e29b-41d4-a716-446655440002', 'business_hours_thursday', '07:00-19:00', 'general', 'Thursday business hours', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440064', '660e8400-e29b-41d4-a716-446655440002', 'business_hours_friday', '07:00-19:00', 'general', 'Friday business hours', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440065', '660e8400-e29b-41d4-a716-446655440002', 'business_hours_saturday', '08:00-16:00', 'general', 'Saturday business hours', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440066', '660e8400-e29b-41d4-a716-446655440002', 'business_hours_sunday', '09:00-14:00', 'general', 'Sunday business hours', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440067', '660e8400-e29b-41d4-a716-446655440002', 'timezone', 'America/Chicago', 'general', 'Clinic timezone', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440068', '660e8400-e29b-41d4-a716-446655440002', 'currency', 'USD', 'general', 'Default currency', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440069', '660e8400-e29b-41d4-a716-446655440002', 'language', 'en', 'general', 'Default language', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    
    -- Appointment Settings
    ('ll0e8400-e29b-41d4-a716-446655440070', '660e8400-e29b-41d4-a716-446655440002', 'default_appointment_duration', '45', 'appointment', 'Default appointment duration in minutes', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440071', '660e8400-e29b-41d4-a716-446655440002', 'appointment_buffer_time', '15', 'appointment', 'Buffer time between appointments in minutes', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440072', '660e8400-e29b-41d4-a716-446655440002', 'cancellation_policy_hours', '12', 'appointment', 'Minimum hours before cancellation without penalty', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440073', '660e8400-e29b-41d4-a716-446655440002', 'no_show_fee', '75.00', 'appointment', 'Fee for no-show appointments', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440074', '660e8400-e29b-41d4-a716-446655440002', 'advance_booking_days', '60', 'appointment', 'Maximum days in advance for booking', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    
    -- Invoice Settings
    ('ll0e8400-e29b-41d4-a716-446655440075', '660e8400-e29b-41d4-a716-446655440002', 'tax_rate', '8.25', 'invoice', 'Tax rate percentage', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440076', '660e8400-e29b-41d4-a716-446655440002', 'payment_terms_days', '30', 'invoice', 'Payment terms in days', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440077', '660e8400-e29b-41d4-a716-446655440002', 'late_fee_percentage', '5.00', 'invoice', 'Late fee percentage per month', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440078', '660e8400-e29b-41d4-a716-446655440002', 'auto_invoice', 'true', 'invoice', 'Automatically generate invoices after appointments', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    
    -- Notification Settings
    ('ll0e8400-e29b-41d4-a716-446655440079', '660e8400-e29b-41d4-a716-446655440002', 'email_notifications', 'true', 'notification', 'Enable email notifications', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440080', '660e8400-e29b-41d4-a716-446655440002', 'sms_notifications', 'true', 'notification', 'Enable SMS notifications', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440081', '660e8400-e29b-41d4-a716-446655440002', 'appointment_reminder_hours', '24', 'notification', 'Hours before appointment to send reminder', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440082', '660e8400-e29b-41d4-a716-446655440002', 'invoice_reminder_days', '7', 'notification', 'Days before invoice due to send reminder', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    
    -- Security Settings
    ('ll0e8400-e29b-41d4-a716-446655440083', '660e8400-e29b-41d4-a716-446655440002', 'password_min_length', '10', 'security', 'Minimum password length', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440084', '660e8400-e29b-41d4-a716-446655440002', 'password_require_uppercase', 'true', 'security', 'Require uppercase in password', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440085', '660e8400-e29b-41d4-a716-446655440002', 'password_require_lowercase', 'true', 'security', 'Require lowercase in password', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440086', '660e8400-e29b-41d4-a716-446655440002', 'password_require_number', 'true', 'security', 'Require number in password', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440087', '660e8400-e29b-41d4-a716-446655440002', 'password_require_special', 'true', 'security', 'Require special character in password', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440088', '660e8400-e29b-41d4-a716-446655440002', 'two_factor_enabled', 'true', 'security', 'Enable two-factor authentication', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440089', '660e8400-e29b-41d4-a716-446655440002', 'session_timeout_minutes', '120', 'security', 'Session timeout in minutes', '990e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Clinic Settings for Clinic 4: Family Health Clinic
INSERT INTO clinic_settings (id, clinic_id, setting_key, setting_value, setting_type, description, created_by, updated_by, created_at, updated_at)
VALUES 
    -- General Settings
    ('ll0e8400-e29b-41d4-a716-446655440090', '660e8400-e29b-41d4-a716-446655440003', 'business_hours_monday', '08:00-18:00', 'general', 'Monday business hours', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440091', '660e8400-e29b-41d4-a716-446655440003', 'business_hours_tuesday', '08:00-18:00', 'general', 'Tuesday business hours', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440092', '660e8400-e29b-41d4-a716-446655440003', 'business_hours_wednesday', '08:00-18:00', 'general', 'Wednesday business hours', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440093', '660e8400-e29b-41d4-a716-446655440003', 'business_hours_thursday', '08:00-18:00', 'general', 'Thursday business hours', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440094', '660e8400-e29b-41d4-a716-446655440003', 'business_hours_friday', '08:00-18:00', 'general', 'Friday business hours', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440095', '660e8400-e29b-41d4-a716-446655440003', 'business_hours_saturday', '09:00-15:00', 'general', 'Saturday business hours', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440096', '660e8400-e29b-41d4-a716-446655440003', 'business_hours_sunday', 'closed', 'general', 'Sunday business hours', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440097', '660e8400-e29b-41d4-a716-446655440003', 'timezone', 'America/Chicago', 'general', 'Clinic timezone', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440098', '660e8400-e29b-41d4-a716-446655440003', 'currency', 'USD', 'general', 'Default currency', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440099', '660e8400-e29b-41d4-a716-446655440003', 'language', 'en', 'general', 'Default language', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    
    -- Appointment Settings
    ('ll0e8400-e29b-41d4-a716-446655440100', '660e8400-e29b-41d4-a716-446655440003', 'default_appointment_duration', '30', 'appointment', 'Default appointment duration in minutes', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440101', '660e8400-e29b-41d4-a716-446655440003', 'appointment_buffer_time', '15', 'appointment', 'Buffer time between appointments in minutes', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440102', '660e8400-e29b-41d4-a716-446655440003', 'cancellation_policy_hours', '24', 'appointment', 'Minimum hours before cancellation without penalty', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440103', '660e8400-e29b-41d4-a716-446655440003', 'no_show_fee', '40.00', 'appointment', 'Fee for no-show appointments', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440104', '660e8400-e29b-41d4-a716-446655440003', 'advance_booking_days', '30', 'appointment', 'Maximum days in advance for booking', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    
    -- Invoice Settings
    ('ll0e8400-e29b-41d4-a716-446655440105', '660e8400-e29b-41d4-a716-446655440003', 'tax_rate', '6.25', 'invoice', 'Tax rate percentage', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440106', '660e8400-e29b-41d4-a716-446655440003', 'payment_terms_days', '30', 'invoice', 'Payment terms in days', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440107', '660e8400-e29b-41d4-a716-446655440003', 'late_fee_percentage', '4.00', 'invoice', 'Late fee percentage per month', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440108', '660e8400-e29b-41d4-a716-446655440003', 'auto_invoice', 'true', 'invoice', 'Automatically generate invoices after appointments', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    
    -- Notification Settings
    ('ll0e8400-e29b-41d4-a716-446655440109', '660e8400-e29b-41d4-a716-446655440003', 'email_notifications', 'true', 'notification', 'Enable email notifications', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440110', '660e8400-e29b-41d4-a716-446655440003', 'sms_notifications', 'true', 'notification', 'Enable SMS notifications', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440111', '660e8400-e29b-41d4-a716-446655440003', 'appointment_reminder_hours', '24', 'notification', 'Hours before appointment to send reminder', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440112', '660e8400-e29b-41d4-a716-446655440003', 'invoice_reminder_days', '7', 'notification', 'Days before invoice due to send reminder', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    
    -- Security Settings
    ('ll0e8400-e29b-41d4-a716-446655440113', '660e8400-e29b-41d4-a716-446655440003', 'password_min_length', '8', 'security', 'Minimum password length', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440114', '660e8400-e29b-41d4-a716-446655440003', 'password_require_uppercase', 'true', 'security', 'Require uppercase in password', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440115', '660e8400-e29b-41d4-a716-446655440003', 'password_require_lowercase', 'true', 'security', 'Require lowercase in password', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440116', '660e8400-e29b-41d4-a716-446655440003', 'password_require_number', 'true', 'security', 'Require number in password', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440117', '660e8400-e29b-41d4-a716-446655440003', 'password_require_special', 'false', 'security', 'Require special character in password', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440118', '660e8400-e29b-41d4-a716-446655440003', 'two_factor_enabled', 'false', 'security', 'Enable two-factor authentication', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440119', '660e8400-e29b-41d4-a716-446655440003', 'session_timeout_minutes', '45', 'security', 'Session timeout in minutes', '990e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Clinic Settings for Clinic 5: Prime Care Hospital
INSERT INTO clinic_settings (id, clinic_id, setting_key, setting_value, setting_type, description, created_by, updated_by, created_at, updated_at)
VALUES 
    -- General Settings
    ('ll0e8400-e29b-41d4-a716-446655440120', '660e8400-e29b-41d4-a716-446655440004', 'business_hours_monday', '00:00-23:59', 'general', 'Monday business hours (24/7)', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440121', '660e8400-e29b-41d4-a716-446655440004', 'business_hours_tuesday', '00:00-23:59', 'general', 'Tuesday business hours (24/7)', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440122', '660e8400-e29b-41d4-a716-446655440004', 'business_hours_wednesday', '00:00-23:59', 'general', 'Wednesday business hours (24/7)', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440123', '660e8400-e29b-41d4-a716-446655440004', 'business_hours_thursday', '00:00-23:59', 'general', 'Thursday business hours (24/7)', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440124', '660e8400-e29b-41d4-a716-446655440004', 'business_hours_friday', '00:00-23:59', 'general', 'Friday business hours (24/7)', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440125', '660e8400-e29b-41d4-a716-446655440004', 'business_hours_saturday', '00:00-23:59', 'general', 'Saturday business hours (24/7)', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440126', '660e8400-e29b-41d4-a716-446655440004', 'business_hours_sunday', '00:00-23:59', 'general', 'Sunday business hours (24/7)', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440127', '660e8400-e29b-41d4-a716-446655440004', 'timezone', 'America/Los_Angeles', 'general', 'Clinic timezone', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440128', '660e8400-e29b-41d4-a716-446655440004', 'currency', 'USD', 'general', 'Default currency', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440129', '660e8400-e29b-41d4-a716-446655440004', 'language', 'en', 'general', 'Default language', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    
    -- Appointment Settings
    ('ll0e8400-e29b-41d4-a716-446655440130', '660e8400-e29b-41d4-a716-446655440004', 'default_appointment_duration', '30', 'appointment', 'Default appointment duration in minutes', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440131', '660e8400-e29b-41d4-a716-446655440004', 'appointment_buffer_time', '10', 'appointment', 'Buffer time between appointments in minutes', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440132', '660e8400-e29b-41d4-a716-446655440004', 'cancellation_policy_hours', '4', 'appointment', 'Minimum hours before cancellation without penalty', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440133', '660e8400-e29b-41d4-a716-446655440004', 'no_show_fee', '100.00', 'appointment', 'Fee for no-show appointments', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440134', '660e8400-e29b-41d4-a716-446655440004', 'advance_booking_days', '90', 'appointment', 'Maximum days in advance for booking', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    
    -- Invoice Settings
    ('ll0e8400-e29b-41d4-a716-446655440135', '660e8400-e29b-41d4-a716-446655440004', 'tax_rate', '9.50', 'invoice', 'Tax rate percentage', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440136', '660e8400-e29b-41d4-a716-446655440004', 'payment_terms_days', '14', 'invoice', 'Payment terms in days', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440137', '660e8400-e29b-41d4-a716-446655440004', 'late_fee_percentage', '6.00', 'invoice', 'Late fee percentage per month', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440138', '660e8400-e29b-41d4-a716-446655440004', 'auto_invoice', 'true', 'invoice', 'Automatically generate invoices after appointments', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    
    -- Notification Settings
    ('ll0e8400-e29b-41d4-a716-446655440139', '660e8400-e29b-41d4-a716-446655440004', 'email_notifications', 'true', 'notification', 'Enable email notifications', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440140', '660e8400-e29b-41d4-a716-446655440004', 'sms_notifications', 'true', 'notification', 'Enable SMS notifications', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440141', '660e8400-e29b-41d4-a716-446655440004', 'appointment_reminder_hours', '12', 'notification', 'Hours before appointment to send reminder', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440142', '660e8400-e29b-41d4-a716-446655440004', 'invoice_reminder_days', '3', 'notification', 'Days before invoice due to send reminder', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    
    -- Security Settings
    ('ll0e8400-e29b-41d4-a716-446655440143', '660e8400-e29b-41d4-a716-446655440004', 'password_min_length', '12', 'security', 'Minimum password length', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440144', '660e8400-e29b-41d4-a716-446655440004', 'password_require_uppercase', 'true', 'security', 'Require uppercase in password', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440145', '660e8400-e29b-41d4-a716-446655440004', 'password_require_lowercase', 'true', 'security', 'Require lowercase in password', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440146', '660e8400-e29b-41d4-a716-446655440004', 'password_require_number', 'true', 'security', 'Require number in password', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440147', '660e8400-e29b-41d4-a716-446655440004', 'password_require_special', 'true', 'security', 'Require special character in password', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440148', '660e8400-e29b-41d4-a716-446655440004', 'two_factor_enabled', 'true', 'security', 'Enable two-factor authentication', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW()),
    ('ll0e8400-e29b-41d4-a716-446655440149', '660e8400-e29b-41d4-a716-446655440004', 'session_timeout_minutes', '15', 'security', 'Session timeout in minutes', '990e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
