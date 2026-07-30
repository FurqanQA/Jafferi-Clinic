-- ============================================================================
-- Jafferi Clinic - Clinics Seed Data
-- ============================================================================
-- Production-ready development seed data for clinics.
-- Creates 5 realistic clinics with complete information.
-- ============================================================================

-- Insert Subscription Plans (if not exists)
INSERT INTO subscription_plans (id, name, description, price, currency, billing_cycle, max_users, max_patients, features, is_active, created_at, updated_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Starter', 'Perfect for small clinics', 99.00, 'USD', 'monthly', 5, 100, '{"appointments": true, "billing": true, "reports": true}', true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440001', 'Professional', 'For growing practices', 249.00, 'USD', 'monthly', 20, 500, '{"appointments": true, "billing": true, "reports": true, "api": true}', true, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440002', 'Enterprise', 'Full-featured solution', 499.00, 'USD', 'monthly', 50, 2000, '{"appointments": true, "billing": true, "reports": true, "api": true, "ai": true, "priority_support": true}', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Clinics
INSERT INTO clinics (id, name, slug, code, email, phone, address, city, state, country, postal_code, timezone, currency, logo_url, website, description, status, created_by, updated_by, created_at, updated_at)
VALUES 
    ('660e8400-e29b-41d4-a716-446655440000', 'Jafferi Dental Clinic', 'jafferi-dental-clinic', 'CLN-JAF000', 'info@jafferidental.com', '+1 (555) 123-4567', '123 Main Street, Suite 100', 'Springfield', 'IL', 'USA', '62701', 'America/Chicago', 'USD', 'https://ui-avatars.com/api/?name=Jafferi+Dental&background=0D8ABC&color=fff', 'https://jafferidental.com', 'Modern dental clinic providing comprehensive oral care services including general dentistry, orthodontics, and cosmetic procedures.', 'active', '660e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
    
    ('660e8400-e29b-41d4-a716-446655440001', 'Smile Care Center', 'smile-care-center', 'CLN-SMI000', 'contact@smilecarecenter.com', '+1 (555) 234-5678', '456 Oak Avenue, Building B', 'Riverside', 'CA', 'USA', '92501', 'America/Los_Angeles', 'USD', 'https://ui-avatars.com/api/?name=Smile+Care&background=4CAF50&color=fff', 'https://smilecarecenter.com', 'Family-focused dental practice specializing in preventive care, pediatric dentistry, and creating beautiful smiles for patients of all ages.', 'active', '660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
    
    ('660e8400-e29b-41d4-a716-446655440002', 'City Medical Clinic', 'city-medical-clinic', 'CLN-CIT000', 'info@citymedicalclinic.com', '+1 (555) 345-6789', '789 Elm Street, Floor 3', 'Denver', 'CO', 'USA', '80201', 'America/Denver', 'USD', 'https://ui-avatars.com/api/?name=City+Medical&background=FF9800&color=fff', 'https://citymedicalclinic.com', 'Comprehensive medical clinic offering primary care, specialist consultations, and diagnostic services with a focus on preventive medicine.', 'active', '660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    
    ('660e8400-e29b-41d4-a716-446655440003', 'Family Health Clinic', 'family-health-clinic', 'CLN-FAM000', 'admin@familyhealthclinic.com', '+1 (555) 456-7890', '321 Pine Road, Suite 200', 'Austin', 'TX', 'USA', '78701', 'America/Chicago', 'USD', 'https://ui-avatars.com/api/?name=Family+Health&background=9C27B0&color=fff', 'https://familyhealthclinic.com', 'Patient-centered family medicine practice providing continuous, comprehensive care for individuals and families across all ages.', 'active', '660e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
    
    ('660e8400-e29b-41d4-a716-446655440004', 'Prime Care Hospital', 'prime-care-hospital', 'CLN-PRI000', 'info@primecarehospital.com', '+1 (555) 567-8901', '654 Maple Drive', 'Seattle', 'WA', 'USA', '98101', 'America/Los_Angeles', 'USD', 'https://ui-avatars.com/api/?name=Prime+Care&background=F44336&color=fff', 'https://primecarehospital.com', 'Multi-specialty hospital providing advanced medical care with state-of-the-art facilities and expert healthcare professionals.', 'active', '660e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Clinic Subscriptions
INSERT INTO clinic_subscriptions (id, clinic_id, plan_id, status, start_date, end_date, payment_method, notes, created_at, updated_at)
VALUES 
    ('770e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'active', NOW() - INTERVAL '6 months', NOW() + INTERVAL '6 months', 'card', 'Annual subscription - Professional plan', NOW(), NOW()),
    ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'active', NOW() - INTERVAL '3 months', NOW() + INTERVAL '3 months', 'card', 'Quarterly subscription - Starter plan', NOW(), NOW()),
    ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'active', NOW() - INTERVAL '12 months', NOW() + INTERVAL '12 months', 'bank_transfer', 'Annual subscription - Enterprise plan', NOW(), NOW()),
    ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'active', NOW() - INTERVAL '8 months', NOW() + INTERVAL '4 months', 'card', 'Monthly subscription - Professional plan', NOW(), NOW()),
    ('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'active', NOW() - INTERVAL '2 months', NOW() + INTERVAL '10 months', 'card', 'Annual subscription - Enterprise plan', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
