-- =========================================================
-- VAULTCARE AI - INITIAL SEED DATA FOR POSTGRESQL
-- Target Database: vaultcare_db
-- =========================================================

-- 1. SEED USERS (Patient & Doctor)
INSERT INTO users (id, email, password_hash, full_name, role, phone, location, blood_group, dob, emergency_contact, vault_score, language)
VALUES 
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'snehal@gmail.com',
    '$2a$10$wT3yK0VzP8xZ/9g8h7j6e5d4c3b2a1',
    'Snehal Mundhe',
    'patient',
    '+91 98200 12345',
    'Mumbai, MH',
    'B+',
    '1998-05-14',
    '+91 98200 99999',
    84,
    'en'
),
(
    'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    'ananya@hospital.com',
    '$2a$10$wT3yK0VzP8xZ/9g8h7j6e5d4c3b2a1',
    'Dr. Ananya Sharma',
    'doctor',
    '+91 98111 22233',
    'Apollo Heart Institute, Mumbai',
    'O+',
    '1985-08-22',
    '+91 98111 00000',
    95,
    'en'
) ON CONFLICT (email) DO NOTHING;

-- 2. SEED MEDICAL REPORTS
INSERT INTO reports (id, user_id, name, category, hospital, report_date, status, summary)
VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Complete Blood Count (CBC)',
    'Blood Test',
    'Metro Diagnostic Lab',
    '2026-07-15',
    'Verified',
    'Hemoglobin 14.2 g/dL, WBC 6800 /mcL, Platelets 260K /mcL. Normal hematocrit balance.'
),
(
    '22222222-2222-2222-2222-222222222222',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Lipid Profile & Cholesterol Panel',
    'Blood Test',
    'Apollo Diagnostics',
    '2026-05-12',
    'Verified',
    'Total Cholesterol 188 mg/dL, HDL 56 mg/dL, Fasting Sugar 94 mg/dL. Desirable lipid profile.'
) ON CONFLICT (id) DO NOTHING;

-- 3. SEED REPORT BIOMARKERS
INSERT INTO report_biomarkers (report_id, parameter_name, value, unit, reference_range, status)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Hemoglobin', '14.2', 'g/dL', '12.0 - 16.0', 'Normal'),
('11111111-1111-1111-1111-111111111111', 'WBC Count', '6,800', '/mcL', '4,000 - 11,000', 'Normal'),
('22222222-2222-2222-2222-222222222222', 'Fasting Blood Sugar', '94', 'mg/dL', '70 - 99', 'Optimal'),
('22222222-2222-2222-2222-222222222222', 'Total Cholesterol', '188', 'mg/dL', '< 200', 'Desirable')
ON CONFLICT DO NOTHING;

-- 4. SEED APPOINTMENTS
INSERT INTO appointments (patient_id, doctor_name, specialty, appointment_date, hospital, status)
VALUES 
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Dr. Ananya Sharma', 'Cardiologist', '2026-08-20 10:30:00+05:30', 'Apollo Heart Institute', 'Confirmed')
ON CONFLICT DO NOTHING;
