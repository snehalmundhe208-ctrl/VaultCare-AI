
-- VAULTCARE AI - POSTGRESQL DATABASE SCHEMA (pgAdmin Ready)
-- Database Name: vaultcare_db
-- Description: Complete Relational Schema for VaultCare AI Platform

-- Enable pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'admin')),
    phone VARCHAR(50) DEFAULT '+91 98200 12345',
    location VARCHAR(255) DEFAULT 'Mumbai, MH',
    blood_group VARCHAR(10) DEFAULT 'B+',
    dob DATE DEFAULT '1998-05-14',
    emergency_contact VARCHAR(50) DEFAULT '+91 98200 99999',
    vault_score INT DEFAULT 84,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. MEDICAL REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    hospital VARCHAR(255) NOT NULL,
    report_date DATE NOT NULL,
    file_url TEXT,
    file_name VARCHAR(255),
    file_size VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Verified',
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. REPORT BIOMARKERS TABLE (Extracted Lab Parameters)
CREATE TABLE IF NOT EXISTS report_biomarkers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    parameter_name VARCHAR(255) NOT NULL,
    value VARCHAR(100) NOT NULL,
    unit VARCHAR(50),
    reference_range VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Normal'
);

-- 4. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    doctor_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    hospital VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Confirmed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CONSULTATION CHATS TABLE (VaultCare AI History)
CREATE TABLE IF NOT EXISTS consultation_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES consultation_chats(id) ON DELETE CASCADE,
    sender VARCHAR(20) CHECK (sender IN ('user', 'ai')),
    message_text TEXT NOT NULL,
    confidence_score VARCHAR(20) DEFAULT '98%',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. DOCTOR SHARES TABLE (Encrypted Access Links)
CREATE TABLE IF NOT EXISTS doctor_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    doctor_name VARCHAR(255) NOT NULL,
    access_link TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- INDEXES FOR FAST PERFORMANCE

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_biomarkers_report_id ON report_biomarkers(report_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON consultation_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON chat_messages(chat_id);


-- SEED INITIAL DEMO DATA (Snehal Mundhe Patient Record)


-- Insert Patient User
INSERT INTO users (id, email, password_hash, full_name, role, phone, location, blood_group, dob, emergency_contact, vault_score, language)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'snehal@gmail.com',
    '$2a$10$wT3yK0VzP8xZ/9g8h7j6e5d4c3b2a1', -- Hashed Password
    'Snehal Mundhe',
    'patient',
    '+91 98200 12345',
    'Mumbai, MH',
    'B+',
    '1998-05-14',
    '+91 98200 99999',
    84,
    'en'
) ON CONFLICT (email) DO NOTHING;

-- Insert Medical Reports
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
);

-- Insert Biomarkers
INSERT INTO report_biomarkers (report_id, parameter_name, value, unit, reference_range, status)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Hemoglobin', '14.2', 'g/dL', '12.0 - 16.0', 'Normal'),
('11111111-1111-1111-1111-111111111111', 'WBC Count', '6,800', '/mcL', '4,000 - 11,000', 'Normal'),
('22222222-2222-2222-2222-222222222222', 'Fasting Blood Sugar', '94', 'mg/dL', '70 - 99', 'Optimal'),
('22222222-2222-2222-2222-222222222222', 'Total Cholesterol', '188', 'mg/dL', '< 200', 'Desirable');

-- Insert Sample Appointments
INSERT INTO appointments (patient_id, doctor_name, specialty, appointment_date, hospital, status)
VALUES 
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Dr. Ananya Sharma', 'Cardiologist', '2026-08-20 10:30:00+05:30', 'Apollo Heart Institute', 'Confirmed');

