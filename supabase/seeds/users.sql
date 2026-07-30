-- ============================================================================
-- Jafferi Clinic - Users Seed Data
-- ============================================================================
-- Production-ready development seed data for users.
-- Creates 50 users across 5 clinics with proper role assignments.
-- Each clinic has: 1 Owner, 1 Administrator, 2 Receptionists, 3 Doctors, 1 Accountant, 2 Staff
-- ============================================================================

-- Insert Roles (if not exists)
INSERT INTO roles (id, name, description, permissions, is_active, created_at, updated_at)
VALUES 
    ('880e8400-e29b-41d4-a716-446655440000', 'owner', 'Clinic owner with full access', '{"all": true}', true, NOW(), NOW()),
    ('880e8400-e29b-41d4-a716-446655440001', 'administrator', 'Administrator with management access', '{"clinics": "manage", "users": "manage", "appointments": "manage", "patients": "manage", "doctors": "manage", "billing": "manage", "reports": "view"}', true, NOW(), NOW()),
    ('880e8400-e29b-41d4-a716-446655440002', 'doctor', 'Doctor with patient and appointment access', '{"patients": "view", "appointments": "manage", "medical_records": "manage", "prescriptions": "manage"}', true, NOW(), NOW()),
    ('880e8400-e29b-41d4-a716-446655440003', 'receptionist', 'Receptionist with appointment and patient access', '{"patients": "view", "appointments": "manage", "billing": "view"}', true, NOW(), NOW()),
    ('880e8400-e29b-41d4-a716-446655440004', 'accountant', 'Accountant with billing access', '{"billing": "manage", "reports": "view"}', true, NOW(), NOW()),
    ('880e8400-e29b-41d4-a716-446655440005', 'staff', 'Staff with limited access', '{"appointments": "view", "patients": "view"}', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Profiles and User Roles
-- Clinic 1: Jafferi Dental Clinic
INSERT INTO profiles (id, email, first_name, last_name, phone, clinic_id, created_at, updated_at)
VALUES 
    ('990e8400-e29b-41d4-a716-446655440000', 'sarah.johnson@jafferidental.com', 'Sarah', 'Johnson', '+1 (555) 111-2222', '660e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440001', 'michael.smith@jafferidental.com', 'Michael', 'Smith', '+1 (555) 111-2223', '660e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440002', 'emily.davis@jafferidental.com', 'Emily', 'Davis', '+1 (555) 111-2224', '660e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440003', 'jennifer.wilson@jafferidental.com', 'Jennifer', 'Wilson', '+1 (555) 111-2225', '660e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440004', 'robert.brown@jafferidental.com', 'Robert', 'Brown', '+1 (555) 111-2226', '660e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440005', 'lisa.miller@jafferidental.com', 'Lisa', 'Miller', '+1 (555) 111-2227', '660e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440006', 'david.garcia@jafferidental.com', 'David', 'Garcia', '+1 (555) 111-2228', '660e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440007', 'amanda.martinez@jafferidental.com', 'Amanda', 'Martinez', '+1 (555) 111-2229', '660e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440008', 'christopher.anderson@jafferidental.com', 'Christopher', 'Anderson', '+1 (555) 111-2230', '660e8400-e29b-41d4-a716-446655440000', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440009', 'jessica.taylor@jafferidental.com', 'Jessica', 'Taylor', '+1 (555) 111-2231', '660e8400-e29b-41d4-a716-446655440000', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Clinic 2: Smile Care Center
INSERT INTO profiles (id, email, first_name, last_name, phone, clinic_id, created_at, updated_at)
VALUES 
    ('990e8400-e29b-41d4-a716-446655440010', 'james.thomas@smilecarecenter.com', 'James', 'Thomas', '+1 (555) 222-3333', '660e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440011', 'michelle.jackson@smilecarecenter.com', 'Michelle', 'Jackson', '+1 (555) 222-3334', '660e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440012', 'daniel.white@smilecarecenter.com', 'Daniel', 'White', '+1 (555) 222-3335', '660e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440013', 'sarah.harris@smilecarecenter.com', 'Sarah', 'Harris', '+1 (555) 222-3336', '660e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440014', 'matthew.martin@smilecarecenter.com', 'Matthew', 'Martin', '+1 (555) 222-3337', '660e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440015', 'laura.thompson@smilecarecenter.com', 'Laura', 'Thompson', '+1 (555) 222-3338', '660e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440016', 'kevin.robinson@smilecarecenter.com', 'Kevin', 'Robinson', '+1 (555) 222-3339', '660e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440017', 'rachel.clark@smilecarecenter.com', 'Rachel', 'Clark', '+1 (555) 222-3340', '660e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440018', 'brian.rodriguez@smilecarecenter.com', 'Brian', 'Rodriguez', '+1 (555) 222-3341', '660e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440019', 'stephanie.lewis@smilecarecenter.com', 'Stephanie', 'Lewis', '+1 (555) 222-3342', '660e8400-e29b-41d4-a716-446655440001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Clinic 3: City Medical Clinic
INSERT INTO profiles (id, email, first_name, last_name, phone, clinic_id, created_at, updated_at)
VALUES 
    ('990e8400-e29b-41d4-a716-446655440020', 'william.lee@citymedicalclinic.com', 'William', 'Lee', '+1 (555) 333-4444', '660e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440021', 'patricia.walker@citymedicalclinic.com', 'Patricia', 'Walker', '+1 (555) 333-4445', '660e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440022', 'joseph.hall@citymedicalclinic.com', 'Joseph', 'Hall', '+1 (555) 333-4446', '660e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440023', 'nancy.allen@citymedicalclinic.com', 'Nancy', 'Allen', '+1 (555) 333-4447', '660e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440024', 'mark.young@citymedicalclinic.com', 'Mark', 'Young', '+1 (555) 333-4448', '660e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440025', 'kathryn.hernandez@citymedicalclinic.com', 'Kathryn', 'Hernandez', '+1 (555) 333-4449', '660e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440026', 'steven.king@citymedicalclinic.com', 'Steven', 'King', '+1 (555) 333-4450', '660e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440027', 'elizabeth.wright@citymedicalclinic.com', 'Elizabeth', 'Wright', '+1 (555) 333-4451', '660e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440028', 'andrew.lopez@citymedicalclinic.com', 'Andrew', 'Lopez', '+1 (555) 333-4452', '660e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440029', 'rebecca.scott@citymedicalclinic.com', 'Rebecca', 'Scott', '+1 (555) 333-4453', '660e8400-e29b-41d4-a716-446655440002', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Clinic 4: Family Health Clinic
INSERT INTO profiles (id, email, first_name, last_name, phone, clinic_id, created_at, updated_at)
VALUES 
    ('990e8400-e29b-41d4-a716-446655440030', 'joshua.green@familyhealthclinic.com', 'Joshua', 'Green', '+1 (555) 444-5555', '660e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440031', 'barbara.adams@familyhealthclinic.com', 'Barbara', 'Adams', '+1 (555) 444-5556', '660e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440032', 'ryan.baker@familyhealthclinic.com', 'Ryan', 'Baker', '+1 (555) 444-5557', '660e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440033', 'sharon.gonzalez@familyhealthclinic.com', 'Sharon', 'Gonzalez', '+1 (555) 444-5558', '660e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440034', 'jeremy.nelson@familyhealthclinic.com', 'Jeremy', 'Nelson', '+1 (555) 444-5559', '660e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440035', 'melissa.hill@familyhealthclinic.com', 'Melissa', 'Hill', '+1 (555) 444-5560', '660e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440036', 'brandon.ramirez@familyhealthclinic.com', 'Brandon', 'Ramirez', '+1 (555) 444-5561', '660e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440037', 'deborah.campbell@familyhealthclinic.com', 'Deborah', 'Campbell', '+1 (555) 444-5562', '660e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440038', 'gregory.mitchell@familyhealthclinic.com', 'Gregory', 'Mitchell', '+1 (555) 444-5563', '660e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440039', 'amy.roberts@familyhealthclinic.com', 'Amy', 'Roberts', '+1 (555) 444-5564', '660e8400-e29b-41d4-a716-446655440003', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Clinic 5: Prime Care Hospital
INSERT INTO profiles (id, email, first_name, last_name, phone, clinic_id, created_at, updated_at)
VALUES 
    ('990e8400-e29b-41d4-a716-446655440040', 'kevin.carter@primecarehospital.com', 'Kevin', 'Carter', '+1 (555) 555-6666', '660e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440041', 'dorothy.phillips@primecarehospital.com', 'Dorothy', 'Phillips', '+1 (555) 555-6667', '660e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440042', 'timothy.evans@primecarehospital.com', 'Timothy', 'Evans', '+1 (555) 555-6668', '660e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440043', 'carol.turner@primecarehospital.com', 'Carol', 'Turner', '+1 (555) 555-6669', '660e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440044', 'ryan.torres@primecarehospital.com', 'Ryan', 'Torres', '+1 (555) 555-6670', '660e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440045', 'pamela.parker@primecarehospital.com', 'Pamela', 'Parker', '+1 (555) 555-6671', '660e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440046', 'jason.collins@primecarehospital.com', 'Jason', 'Collins', '+1 (555) 555-6672', '660e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440047', 'deborah.edwards@primecarehospital.com', 'Deborah', 'Edwards', '+1 (555) 555-6673', '660e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440048', 'justin.stewart@primecarehospital.com', 'Justin', 'Stewart', '+1 (555) 555-6674', '660e8400-e29b-41d4-a716-446655440004', NOW(), NOW()),
    ('990e8400-e29b-41d4-a716-446655440049', 'sandra.flores@primecarehospital.com', 'Sandra', 'Flores', '+1 (555) 555-6675', '660e8400-e29b-41d4-a716-446655440004', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert User Roles
-- Clinic 1: Jafferi Dental Clinic
INSERT INTO user_roles (id, user_id, clinic_id, role_id, is_active, assigned_at, created_at, updated_at)
VALUES 
    ('aa0e8400-e29b-41d4-a716-446655440000', '990e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440000', true, NOW(), NOW(), NOW()), -- Owner
    ('aa0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440001', true, NOW(), NOW(), NOW()), -- Administrator
    ('aa0e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440003', true, NOW(), NOW(), NOW()), -- Receptionist
    ('aa0e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440003', true, NOW(), NOW(), NOW()), -- Receptionist
    ('aa0e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW(), NOW()), -- Doctor
    ('aa0e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW(), NOW()), -- Doctor
    ('aa0e8400-e29b-41d4-a716-446655440006', '990e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW(), NOW()), -- Doctor
    ('aa0e8400-e29b-41d4-a716-446655440007', '990e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440004', true, NOW(), NOW(), NOW()), -- Accountant
    ('aa0e8400-e29b-41d4-a716-446655440008', '990e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440005', true, NOW(), NOW(), NOW()), -- Staff
    ('aa0e8400-e29b-41d4-a716-446655440009', '990e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440000', '880e8400-e29b-41d4-a716-446655440005', true, NOW(), NOW(), NOW())  -- Staff
ON CONFLICT (id) DO NOTHING;

-- Clinic 2: Smile Care Center
INSERT INTO user_roles (id, user_id, clinic_id, role_id, is_active, assigned_at, created_at, updated_at)
VALUES 
    ('aa0e8400-e29b-41d4-a716-446655440010', '990e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440000', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440011', '990e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440003', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440013', '990e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440003', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440014', '990e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440015', '990e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440016', '990e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440017', '990e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440004', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440018', '990e8400-e29b-41d4-a716-446655440018', '660e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440005', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440019', '990e8400-e29b-41d4-a716-446655440019', '660e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440005', true, NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Clinic 3: City Medical Clinic
INSERT INTO user_roles (id, user_id, clinic_id, role_id, is_active, assigned_at, created_at, updated_at)
VALUES 
    ('aa0e8400-e29b-41d4-a716-446655440020', '990e8400-e29b-41d4-a716-446655440020', '660e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440000', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440021', '990e8400-e29b-41d4-a716-446655440021', '660e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440022', '990e8400-e29b-41d4-a716-446655440022', '660e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440003', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440023', '990e8400-e29b-41d4-a716-446655440023', '660e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440003', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440024', '990e8400-e29b-41d4-a716-446655440024', '660e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440025', '990e8400-e29b-41d4-a716-446655440025', '660e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440026', '990e8400-e29b-41d4-a716-446655440026', '660e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440027', '990e8400-e29b-41d4-a716-446655440027', '660e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440004', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440028', '990e8400-e29b-41d4-a716-446655440028', '660e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440005', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440029', '990e8400-e29b-41d4-a716-446655440029', '660e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440005', true, NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Clinic 4: Family Health Clinic
INSERT INTO user_roles (id, user_id, clinic_id, role_id, is_active, assigned_at, created_at, updated_at)
VALUES 
    ('aa0e8400-e29b-41d4-a716-446655440030', '990e8400-e29b-41d4-a716-446655440030', '660e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440000', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440031', '990e8400-e29b-41d4-a716-446655440031', '660e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440001', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440032', '990e8400-e29b-41d4-a716-446655440032', '660e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440003', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440033', '990e8400-e29b-41d4-a716-446655440033', '660e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440003', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440034', '990e8400-e29b-41d4-a716-446655440034', '660e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440035', '990e8400-e29b-41d4-a716-446655440035', '660e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440036', '990e8400-e29b-41d4-a716-446655440036', '660e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440037', '990e8400-e29b-41d4-a716-446655440037', '660e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440004', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440038', '990e8400-e29b-41d4-a716-446655440038', '660e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440005', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440039', '990e8400-e29b-41d4-a716-446655440039', '660e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440005', true, NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Clinic 5: Prime Care Hospital
INSERT INTO user_roles (id, user_id, clinic_id, role_id, is_active, assigned_at, created_at, updated_at)
VALUES 
    ('aa0e8400-e29b-41d4-a716-446655440040', '990e8400-e29b-41d4-a716-446655440040', '660e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440000', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440041', '990e8400-e29b-41d4-a716-446655440041', '660e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440001', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440042', '990e8400-e29b-41d4-a716-446655440042', '660e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440003', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440043', '990e8400-e29b-41d4-a716-446655440043', '660e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440003', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440044', '990e8400-e29b-41d4-a716-446655440044', '660e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440045', '990e8400-e29b-41d4-a716-446655440045', '660e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440046', '990e8400-e29b-41d4-a716-446655440046', '660e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440047', '990e8400-e29b-41d4-a716-446655440047', '660e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440004', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440048', '990e8400-e29b-41d4-a716-446655440048', '660e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440005', true, NOW(), NOW(), NOW()),
    ('aa0e8400-e29b-41d4-a716-446655440049', '990e8400-e29b-41d4-a716-446655440049', '660e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440005', true, NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
