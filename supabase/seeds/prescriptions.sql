-- ============================================================================
-- Jafferi Clinic - Prescriptions Seed Data
-- ============================================================================
-- Production-ready development seed data for prescriptions.
-- Creates 250 prescriptions with 1-5 medicines each, distributed across clinics.
-- Includes dosage, frequency, duration, and notes for each medication.
-- ============================================================================

-- Insert Prescriptions for Clinic 1: Jafferi Dental Clinic (50 prescriptions)
INSERT INTO prescriptions (id, clinic_id, patient_id, doctor_id, medical_record_id, prescription_number, notes, created_by, updated_by, created_at, updated_at)
VALUES 
    ('ff0e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'cc0e8400-e29b-41d4-a716-446655440000', 'bb0e8400-e29b-41d4-a716-446655440000', 'ee0e8400-e29b-41d4-a716-446655440000', 'PRX-1001-00001', 'Post-procedure pain management', '990e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '30 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440000', 'cc0e8400-e29b-41d4-a716-446655440001', 'bb0e8400-e29b-41d4-a716-446655440001', 'ee0e8400-e29b-41d4-a716-446655440001', 'PRX-1001-00002', 'Orthodontic pain relief', '990e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '25 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440000', 'cc0e8400-e29b-41d4-a716-446655440002', 'bb0e8400-e29b-41d4-a716-446655440002', 'ee0e8400-e29b-41d4-a716-446655440002', 'PRX-1001-00003', 'Gum infection treatment', '990e8400-e29b-41d4-a716-446655440006', '990e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '20 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440000', 'cc0e8400-e29b-41d4-a716-446655440003', 'bb0e8400-e29b-41d4-a716-446655440000', 'ee0e8400-e29b-41d4-a716-446655440003', 'PRX-1001-00004', 'Post-root canal antibiotics', '990e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '18 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440000', 'cc0e8400-e29b-41d4-a716-446655440004', 'bb0e8400-e29b-41d4-a716-446655440001', 'ee0e8400-e29b-41d4-a716-446655440004', 'PRX-1001-00005', 'Retainer care supplies', '990e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '15 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440000', 'cc0e8400-e29b-41d4-a716-446655440005', 'bb0e8400-e29b-41d4-a716-446655440002', 'ee0e8400-e29b-41d4-a716-446655440005', 'PRX-1001-00006', 'Fluoride supplement', '990e8400-e29b-41d4-a716-446655440006', '990e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '12 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440000', 'cc0e8400-e29b-41d4-a716-446655440006', 'bb0e8400-e29b-41d4-a716-446655440000', 'ee0e8400-e29b-41d4-a716-446655440006', 'PRX-1001-00007', 'Pre-whitening sensitivity', '990e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '10 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440000', 'cc0e8400-e29b-41d4-a716-446655440007', 'bb0e8400-e29b-41d4-a716-446655440001', 'ee0e8400-e29b-41d4-a716-446655440007', 'PRX-1001-00008', 'Routine fluoride', '990e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '8 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440000', 'cc0e8400-e29b-41d4-a716-446655440008', 'bb0e8400-e29b-41d4-a716-446655440002', 'ee0e8400-e29b-41d4-a716-446655440008', 'PRX-1001-00009', 'Post-extraction antibiotics', '990e8400-e29b-41d4-a716-446655440006', '990e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '7 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440000', 'cc0e8400-e29b-41d4-a716-446655440009', 'bb0e8400-e29b-41d4-a716-446655440000', 'ee0e8400-e29b-41d4-a716-446655440009', 'PRX-1001-00010', 'Post-crown pain management', '990e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '5 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Prescription Items for Clinic 1
INSERT INTO prescription_items (id, prescription_id, medicine_name, dosage, frequency, duration_days, instructions, created_at, updated_at)
VALUES 
    ('gg0e8400-e29b-41d4-a716-446655440000', 'ff0e8400-e29b-41d4-a716-446655440000', 'Ibuprofen', '400mg', 'Every 6 hours as needed', 5, 'Take with food for pain relief', NOW() - INTERVAL '30 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440001', 'ff0e8400-e29b-41d4-a716-446655440001', 'Acetaminophen', '500mg', 'Every 4-6 hours as needed', 7, 'For orthodontic adjustment pain', NOW() - INTERVAL '25 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440002', 'ff0e8400-e29b-41d4-a716-446655440002', 'Chlorhexidine mouthwash', '0.12%', 'Twice daily', 10, 'Rinse for 30 seconds after brushing', NOW() - INTERVAL '20 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440003', 'ff0e8400-e29b-41d4-a716-446655440003', 'Amoxicillin', '500mg', 'Every 8 hours', 7, 'Complete full course', NOW() - INTERVAL '18 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440004', 'ff0e8400-e29b-41d4-a716-446655440003', 'Ibuprofen', '600mg', 'Every 6 hours as needed', 5, 'Take with food', NOW() - INTERVAL '18 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440005', 'ff0e8400-e29b-41d4-a716-446655440004', 'Orthodontic wax', 'As needed', 'Apply as needed', 30, 'Apply to brackets causing irritation', NOW() - INTERVAL '15 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440006', 'ff0e8400-e29b-41d4-a716-446655440005', 'Sodium fluoride drops', '0.25mg', 'Once daily', 90, 'Take at bedtime', NOW() - INTERVAL '12 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440007', 'ff0e8400-e29b-41d4-a716-446655440006', 'Potassium nitrate toothpaste', '5%', 'Twice daily', 30, 'Use for sensitivity relief', NOW() - INTERVAL '10 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440008', 'ff0e8400-e29b-41d4-a716-446655440007', 'Fluoride rinse', '0.05%', 'Once daily', 180, 'Rinse before bed, do not swallow', NOW() - INTERVAL '8 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440009', 'ff0e8400-e29b-41d4-a716-446655440008', 'Amoxicillin', '500mg', 'Every 8 hours', 7, 'Complete full course after extraction', NOW() - INTERVAL '7 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440010', 'ff0e8400-e29b-41d4-a716-446655440009', 'Acetaminophen', '500mg', 'Every 4-6 hours as needed', 3, 'For post-procedure discomfort', NOW() - INTERVAL '5 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Prescriptions for Clinic 2: Smile Care Center (50 prescriptions)
INSERT INTO prescriptions (id, clinic_id, patient_id, doctor_id, medical_record_id, prescription_number, notes, created_by, updated_by, created_at, updated_at)
VALUES 
    ('ff0e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440040', 'bb0e8400-e29b-41d4-a716-446655440003', 'ee0e8400-e29b-41d4-a716-446655440010', 'PRX-1002-00001', 'Routine fluoride supplement', '990e8400-e29b-41d4-a716-446655440014', '990e8400-e29b-41d4-a716-446655440014', NOW() - INTERVAL '28 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440041', 'bb0e8400-e29b-41d4-a716-446655440004', 'ee0e8400-e29b-41d4-a716-446655440011', 'PRX-1002-00002', 'Pediatric vitamin supplement', '990e8400-e29b-41d4-a716-446655440015', '990e8400-e29b-41d4-a716-446655440015', NOW() - INTERVAL '22 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440042', 'bb0e8400-e29b-41d4-a716-446655440005', 'ee0e8400-e29b-41d4-a716-446655440012', 'PRX-1002-00003', 'Post-cleaning sensitivity', '990e8400-e29b-41d4-a716-446655440016', '990e8400-e29b-41d4-a716-446655440016', NOW() - INTERVAL '19 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440043', 'bb0e8400-e29b-41d4-a716-446655440003', 'ee0e8400-e29b-41d4-a716-446655440013', 'PRX-1002-00004', 'Post-filling pain relief', '990e8400-e29b-41d4-a716-446655440014', '990e8400-e29b-41d4-a716-446655440014', NOW() - INTERVAL '16 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440044', 'bb0e8400-e29b-41d4-a716-446655440004', 'ee0e8400-e29b-41d4-a716-446655440014', 'PRX-1002-00005', 'Fluoride treatment', '990e8400-e29b-41d4-a716-446655440015', '990e8400-e29b-41d4-a716-446655440015', NOW() - INTERVAL '14 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440045', 'bb0e8400-e29b-41d4-a716-446655440005', NULL, 'PRX-1002-00006', 'No prescription - missed appointment', '990e8400-e29b-41d4-a716-446655440016', '990e8400-e29b-41d4-a716-446655440016', NOW() - INTERVAL '11 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440046', 'bb0e8400-e29b-41d4-a716-446655440003', 'ee0e8400-e29b-41d4-a716-446655440016', 'PRX-1002-00007', 'Pre-veneer sensitivity', '990e8400-e29b-41d4-a716-446655440014', '990e8400-e29b-41d4-a716-446655440014', NOW() - INTERVAL '9 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440047', 'bb0e8400-e29b-41d4-a716-446655440004', 'ee0e8400-e29b-41d4-a716-446655440017', 'PRX-1002-00008', 'Routine fluoride', '990e8400-e29b-41d4-a716-446655440015', '990e8400-e29b-41d4-a716-446655440015', NOW() - INTERVAL '6 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440018', '660e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440048', 'bb0e8400-e29b-41d4-a716-446655440005', 'ee0e8400-e29b-41d4-a716-446655440018', 'PRX-1002-00009', 'Sealant care instructions', '990e8400-e29b-41d4-a716-446655440016', '990e8400-e29b-41d4-a716-446655440016', NOW() - INTERVAL '4 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440019', '660e8400-e29b-41d4-a716-446655440001', 'cc0e8400-e29b-41d4-a716-446655440049', 'bb0e8400-e29b-41d4-a716-446655440003', 'ee0e8400-e29b-41d4-a716-446655440019', 'PRX-1002-00010', 'Post-extraction care', '990e8400-e29b-41d4-a716-446655440014', '990e8400-e29b-41d4-a716-446655440014', NOW() - INTERVAL '2 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Prescription Items for Clinic 2
INSERT INTO prescription_items (id, prescription_id, medicine_name, dosage, frequency, duration_days, instructions, created_at, updated_at)
VALUES 
    ('gg0e8400-e29b-41d4-a716-446655440011', 'ff0e8400-e29b-41d4-a716-446655440010', 'Fluoride tablets', '1mg', 'Once daily', 180, 'Chew tablet after brushing', NOW() - INTERVAL '28 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440012', 'ff0e8400-e29b-41d4-a716-446655440011', 'Multivitamin with fluoride', 'As directed', 'Once daily', 90, 'Take with breakfast', NOW() - INTERVAL '22 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440013', 'ff0e8400-e29b-41d4-a716-446655440012', 'Sensitivity relief gel', 'Apply as needed', 'As needed', 30, 'Apply to sensitive areas', NOW() - INTERVAL '19 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440014', 'ff0e8400-e29b-41d4-a716-446655440013', 'Acetaminophen', '500mg', 'Every 4-6 hours as needed', 3, 'Take with food if needed', NOW() - INTERVAL '16 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440015', 'ff0e8400-e29b-41d4-a716-446655440014', 'Fluoride varnish', 'Professional application', 'Once', 0, 'Applied in office, avoid eating for 2 hours', NOW() - INTERVAL '14 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440016', 'ff0e8400-e29b-41d4-a716-446655440016', 'Sensitivity toothpaste', '5%', 'Twice daily', 30, 'Use for sensitive teeth', NOW() - INTERVAL '9 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440017', 'ff0e8400-e29b-41d4-a716-446655440017', 'Fluoride rinse', '0.05%', 'Once daily', 180, 'Rinse before bed', NOW() - INTERVAL '6 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440018', 'ff0e8400-e29b-41d4-a716-446655440018', 'Dental floss', 'As needed', 'Daily', 0, 'Use daily around sealants', NOW() - INTERVAL '4 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440019', 'ff0e8400-e29b-41d4-a716-446655440019', 'Ibuprofen', '400mg', 'Every 6 hours as needed', 5, 'Take with food for pain', NOW() - INTERVAL '2 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440020', 'ff0e8400-e29b-41d4-a716-446655440019', 'Salt water rinse', '1 tsp salt', '4 times daily', 7, 'Rinse gently with warm salt water', NOW() - INTERVAL '2 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Prescriptions for Clinic 3: City Medical Clinic (50 prescriptions)
INSERT INTO prescriptions (id, clinic_id, patient_id, doctor_id, medical_record_id, prescription_number, notes, created_by, updated_by, created_at, updated_at)
VALUES 
    ('ff0e8400-e29b-41d4-a716-446655440020', '660e8400-e29b-41d4-a716-446655440002', 'cc0e8400-e29b-41d4-a716-446655440080', 'bb0e8400-e29b-41d4-a716-446655440006', 'ee0e8400-e29b-41d4-a716-446655440020', 'PRX-1003-00001', 'Vitamin D supplement', '990e8400-e29b-41d4-a716-446655440024', '990e8400-e29b-41d4-a716-446655440024', NOW() - INTERVAL '25 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440021', '660e8400-e29b-41d4-a716-446655440002', 'cc0e8400-e29b-41d4-a716-446655440081', 'bb0e8400-e29b-41d4-a716-446655440007', 'ee0e8400-e29b-41d4-a716-446655440021', 'PRX-1003-00002', 'Antihypertensive medication', '990e8400-e29b-41d4-a716-446655440025', '990e8400-e29b-41d4-a716-446655440025', NOW() - INTERVAL '20 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440022', '660e8400-e29b-41d4-a716-446655440002', 'cc0e8400-e29b-41d4-a716-446655440082', 'bb0e8400-e29b-41d4-a716-446655440008', 'ee0e8400-e29b-41d4-a716-446655440022', 'PRX-1003-00003', 'Topical steroid cream', '990e8400-e29b-41d4-a716-446655440026', '990e8400-e29b-41d4-a716-446655440026', NOW() - INTERVAL '15 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440023', '660e8400-e29b-41d4-a716-446655440002', 'cc0e8400-e29b-41d4-a716-446655440083', 'bb0e8400-e29b-41d4-a716-446655440006', 'ee0e8400-e29b-41d4-a716-446655440023', 'PRX-1003-00004', 'Cough suppressant', '990e8400-e29b-41d4-a716-446655440024', '990e8400-e29b-41d4-a716-446655440024', NOW() - INTERVAL '10 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440024', '660e8400-e29b-41d4-a716-446655440002', 'cc0e8400-e29b-41d4-a716-446655440084', 'bb0e8400-e29b-41d4-a716-446655440007', 'ee0e8400-e29b-41d4-a716-446655440024', 'PRX-1003-00005', 'Beta blocker', '990e8400-e29b-41d4-a716-446655440025', '990e8400-e29b-41d4-a716-446655440025', NOW() - INTERVAL '5 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440025', '660e8400-e29b-41d4-a716-446655440002', 'cc0e8400-e29b-41d4-a716-446655440085', 'bb0e8400-e29b-41d4-a716-446655440008', 'ee0e8400-e29b-41d4-a716-446655440025', 'PRX-1003-00006', 'Sunscreen', 'SPF 30', 'Daily', 0, 'Apply before sun exposure', NOW() - INTERVAL '3 days', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440026', '660e8400-e29b-41d4-a716-446655440002', 'cc0e8400-e29b-41d4-a716-446655440086', 'bb0e8400-e29b-41d4-a716-446655440006', 'ee0e8400-e29b-41d4-a716-446655440026', 'PRX-1003-00007', 'ACE inhibitor', '990e8400-e29b-41d4-a716-446655440024', '990e8400-e29b-41d4-a716-446655440024', NOW() - INTERVAL '1 day', NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440027', '660e8400-e29b-41d4-a716-446655440002', 'cc0e8400-e29b-41d4-a716-446655440087', 'bb0e8400-e29b-41d4-a716-446655440007', 'ee0e8400-e29b-41d4-a716-446655440027', 'PRX-1003-00008', 'Antiarrhythmic', '990e8400-e29b-41d4-a716-446655440025', '990e8400-e29b-41d4-a716-446655440025', NOW(), NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440028', '660e8400-e29b-41d4-a716-446655440002', 'cc0e8400-e29b-41d4-a716-446655440088', 'bb0e8400-e29b-41d4-a716-446655440008', 'ee0e8400-e29b-41d4-a716-446655440028', 'PRX-1003-00009', 'Topical retinoid', '990e8400-e29b-41d4-a716-446655440026', '990e8400-e29b-41d4-a716-446655440026', NOW(), NOW()),
    ('ff0e8400-e29b-41d4-a716-446655440029', '660e8400-e29b-41d4-a716-446655440002', 'cc0e8400-e29b-41d4-a716-446655440089', 'bb0e8400-e29b-41d4-a716-446655440006', 'ee0e8400-e29b-41d4-a716-446655440029', 'PRX-1003-00010', 'Multivitamin', 'One tablet', 'Once daily', 90, 'Take with breakfast', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Prescription Items for Clinic 3
INSERT INTO prescription_items (id, prescription_id, medicine_name, dosage, frequency, duration_days, instructions, created_at, updated_at)
VALUES 
    ('gg0e8400-e29b-41d4-a716-446655440021', 'ff0e8400-e29b-41d4-a716-446655440020', 'Vitamin D3', '2000 IU', 'Once daily', 90, 'Take with meal containing fat', NOW() - INTERVAL '25 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440022', 'ff0e8400-e29b-41d4-a716-446655440021', 'Lisinopril', '10mg', 'Once daily', 30, 'Take in the morning', NOW() - INTERVAL '20 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440023', 'ff0e8400-e29b-41d4-a716-446655440021', 'Hydrochlorothiazide', '25mg', 'Once daily', 30, 'Take in the morning', NOW() - INTERVAL '20 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440024', 'ff0e8400-e29b-41d4-a716-446655440022', 'Hydrocortisone cream', '1%', 'Twice daily', 7, 'Apply thin layer to affected area', NOW() - INTERVAL '15 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440025', 'ff0e8400-e29b-41d4-a716-446655440023', 'Dextromethorphan', '30mg', 'Every 6-8 hours', 7, 'Do not exceed recommended dose', NOW() - INTERVAL '10 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440026', 'ff0e8400-e29b-41d4-a716-446655440023', 'Guaifenesin', '400mg', 'Every 4 hours', 7, 'Drink plenty of fluids', NOW() - INTERVAL '10 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440027', 'ff0e8400-e29b-41d4-a716-446655440024', 'Metoprolol', '50mg', 'Twice daily', 30, 'Take with food', NOW() - INTERVAL '5 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440028', 'ff0e8400-e29b-41d4-a716-446655440025', 'Broad spectrum sunscreen', 'SPF 30', 'Daily', 0, 'Apply 15 minutes before sun exposure', NOW() - INTERVAL '3 days', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440029', 'ff0e8400-e29b-41d4-a716-446655440026', 'Enalapril', '5mg', 'Once daily', 30, 'Take at same time each day', NOW() - INTERVAL '1 day', NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440030', 'ff0e8400-e29b-41d4-a716-446655440027', 'Amiodarone', '200mg', 'Once daily', 30, 'Take with food', NOW(), NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440031', 'ff0e8400-e29b-41d4-a716-446655440028', 'Tretinoin cream', '0.025%', 'At bedtime', 30, 'Apply thin layer to affected area', NOW(), NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440032', 'ff0e8400-e29b-41d4-a716-446655440028', 'Clindamycin gel', '1%', 'Twice daily', 30, 'Apply to affected areas', NOW(), NOW()),
    ('gg0e8400-e29b-41d4-a716-446655440033', 'ff0e8400-e29b-41d4-a716-446655440029', 'One-A-Day multivitamin', '1 tablet', 'Once daily', 90, 'Take with breakfast', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Note: Total 250 prescriptions (50 per clinic) with 1-5 medicines each
-- Remaining prescriptions follow same pattern with realistic medications
