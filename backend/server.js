const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Razorpay SDK Configuration
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TPhnZafPBvwuwk';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '0CRWHM382ADLlzWxIgb13N3r';

const razorpay = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

// PostgreSQL Connection Pool
const poolConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'vaultcare_db',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(poolConfig);

// Initialize Tables on Startup
const initDatabase = async () => {
  try {
    // Try creating uuid extension if supported
    try {
      await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    } catch (e) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        role TEXT DEFAULT 'patient',
        phone TEXT,
        location TEXT,
        blood_group TEXT,
        dob TEXT,
        emergency_contact TEXT,
        language TEXT DEFAULT 'en',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        name TEXT NOT NULL,
        category TEXT,
        hospital TEXT,
        report_date DATE,
        file_url TEXT,
        file_name TEXT,
        file_size TEXT,
        summary TEXT,
        parameters JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.family_vaults (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        created_by TEXT NOT NULL,
        creator_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.family_vault_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vault_id UUID NOT NULL REFERENCES public.family_vaults(id) ON DELETE CASCADE,
        user_email TEXT NOT NULL,
        user_name TEXT,
        relationship_tag TEXT NOT NULL DEFAULT 'Other',
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS public.family_access_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        vault_id UUID NOT NULL REFERENCES public.family_vaults(id) ON DELETE CASCADE,
        owner_email TEXT NOT NULL,
        viewer_email TEXT NOT NULL,
        data_type TEXT NOT NULL CHECK (data_type IN ('reports', 'prescriptions', 'appointments', 'history')),
        is_active BOOLEAN DEFAULT FALSE,
        granted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        revoked_at TIMESTAMP WITH TIME ZONE
      );

      -- 5. Appointments Table (PostgreSQL Isolated Storage)
      CREATE TABLE IF NOT EXISTS public.appointments (
        id TEXT PRIMARY KEY,
        patient_email TEXT NOT NULL,
        patient_name TEXT,
        patient_id TEXT,
        doctor_email TEXT NOT NULL,
        doctor_name TEXT NOT NULL,
        doctor_specialty TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        type TEXT DEFAULT 'online',
        status TEXT DEFAULT 'Pending',
        fee_paid NUMERIC DEFAULT 0,
        location TEXT,
        meet_url TEXT,
        prescription JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );

      -- 6. Emergency Medical Access Logs Table
      CREATE TABLE IF NOT EXISTS public.emergency_access_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_id TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        patient_email TEXT NOT NULL,
        doctor_email TEXT NOT NULL,
        doctor_name TEXT NOT NULL,
        blood_group TEXT,
        gender TEXT,
        emergency_contact TEXT,
        allergies TEXT,
        vitals JSONB,
        summary TEXT,
        reports_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
      );
    `);

    // Ensure all columns exist in reports & appointments
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;');
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS vault_score INT DEFAULT 84;');
      await pool.query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT \'[]\'::jsonb;');
      await pool.query('ALTER TABLE family_vaults ADD COLUMN IF NOT EXISTS creator_name TEXT;');
      await pool.query('ALTER TABLE appointments ALTER COLUMN id TYPE TEXT;');
      try { await pool.query('ALTER TABLE appointments ALTER COLUMN patient_id TYPE TEXT;'); } catch (e) {}
      try { await pool.query('ALTER TABLE appointments ALTER COLUMN doctor_id TYPE TEXT;'); } catch (e) {}
      try { await pool.query('ALTER TABLE appointments ALTER COLUMN specialty DROP NOT NULL;'); } catch (e) {}
      try { await pool.query('ALTER TABLE appointments ALTER COLUMN hospital DROP NOT NULL;'); } catch (e) {}
      try { await pool.query('ALTER TABLE appointments ALTER COLUMN doctor_id DROP NOT NULL;'); } catch (e) {}
      try { await pool.query('ALTER TABLE appointments ALTER COLUMN patient_id DROP NOT NULL;'); } catch (e) {}
      try { await pool.query('ALTER TABLE appointments ALTER COLUMN appointment_date DROP NOT NULL;'); } catch (e) {}
      try { await pool.query('ALTER TABLE appointments ALTER COLUMN appointment_time DROP NOT NULL;'); } catch (e) {}
      try { await pool.query('ALTER TABLE appointments ALTER COLUMN consultation_type DROP NOT NULL;'); } catch (e) {}
      await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_email TEXT;');
      await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_name TEXT;');
      await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_email TEXT;');
      await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_name TEXT;');
      await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS doctor_specialty TEXT;');
      await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS date TEXT;');
      await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS time TEXT;');
      await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS type TEXT DEFAULT \'online\';');
      await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'Pending\';');
      await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS fee_paid NUMERIC DEFAULT 0;');
      await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS location TEXT;');
      await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS meet_url TEXT;');
      await pool.query('ALTER TABLE appointments ADD COLUMN IF NOT EXISTS prescription JSONB;');
    } catch (e) {
      console.error('ALTER TABLE error:', e.message);
    }

    console.log('VaultCare PostgreSQL Database Tables Verified & Initialized');
  } catch (err) {
    console.error('PostgreSQL Table Init Warning:', err.message);
  }
};
initDatabase();

// Normalization Mappers for Frontend CamelCase & SnakeCase Compatibility
const mapMember = (m) => ({
  id: m.id,
  vaultId: m.vault_id || m.vaultId,
  vault_id: m.vault_id || m.vaultId,
  userEmail: m.user_email || m.userEmail,
  user_email: m.user_email || m.userEmail,
  userName: m.user_name || m.userName || (m.user_email || '').split('@')[0],
  user_name: m.user_name || m.userName || (m.user_email || '').split('@')[0],
  relationshipTag: m.relationship_tag || m.relationshipTag || 'Family Member',
  relationship_tag: m.relationship_tag || m.relationshipTag || 'Family Member',
  status: m.status,
  joinedAt: m.joined_at || m.joinedAt,
  joined_at: m.joined_at || m.joinedAt,
  vaultName: m.vault_name || m.vaultName,
  createdBy: m.created_by || m.createdBy
});

const mapVault = (v) => ({
  id: v.id,
  name: v.name,
  createdBy: v.created_by || v.createdBy,
  created_by: v.created_by || v.createdBy,
  creatorName: v.creator_name || v.creatorName || (v.created_by || '').split('@')[0],
  creator_name: v.creator_name || v.creatorName || (v.created_by || '').split('@')[0],
  createdAt: v.created_at || v.createdAt,
  created_at: v.created_at || v.createdAt
});

const mapPermission = (p) => ({
  id: p.id,
  vaultId: p.vault_id || p.vaultId,
  vault_id: p.vault_id || p.vaultId,
  ownerEmail: p.owner_email || p.ownerEmail,
  owner_email: p.owner_email || p.ownerEmail,
  viewerEmail: p.viewer_email || p.viewerEmail,
  viewer_email: p.viewer_email || p.viewerEmail,
  dataType: p.data_type || p.dataType,
  data_type: p.data_type || p.dataType,
  isActive: p.is_active !== undefined ? p.is_active : p.isActive,
  is_active: p.is_active !== undefined ? p.is_active : p.isActive,
  grantedAt: p.granted_at || p.grantedAt,
  granted_at: p.granted_at || p.grantedAt,
  revokedAt: p.revoked_at || p.revokedAt,
  revoked_at: p.revoked_at || p.revokedAt
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'OK', message: 'VaultCare PostgreSQL connected!', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});
const bcrypt = require('bcryptjs');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory OTP store: { email: { code, expiresAt } }
const otpStore = new Map();

// SEND OTP via Resend
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const lowerEmail = email.toLowerCase().trim();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(lowerEmail, { code: otpCode, expiresAt });

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: lowerEmail,
      subject: 'VaultCare AI - Your Verification Code',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color:#1a1a1a;">VaultCare AI</h2>
          <p>Your verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #C9A574;">${otpCode}</div>
          <p style="color:#666; font-size: 13px;">This code expires in 5 minutes. If you didn't request this, ignore this email.</p>
        </div>
      `
    });

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Send OTP Error:', err);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
});

// VERIFY OTP
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  const lowerEmail = email.toLowerCase().trim();
  const record = otpStore.get(lowerEmail);

  if (!record) {
    return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(lowerEmail);
    return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
  }
  if (record.code !== otp) {
    return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
  }

  otpStore.delete(lowerEmail); // one-time use
  res.json({ success: true, message: 'OTP verified successfully' });
});
// SIGNUP - create new user in PostgreSQL
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password and full name are required' });
    }
    const lowerEmail = email.toLowerCase().trim();

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [lowerEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role, phone, location, blood_group, dob, emergency_contact, vault_score, language`,
      [lowerEmail, passwordHash, full_name, role || 'patient']
    );

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN - verify credentials against PostgreSQL
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const lowerEmail = email.toLowerCase().trim();

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [lowerEmail]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Account not found. Please sign up first.' });
    }

    const dbUser = rows[0];
    const isValid = await bcrypt.compare(password, dbUser.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    delete dbUser.password_hash; // never send hash to frontend
    res.json({ success: true, user: dbUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET user profile
app.get('/api/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update user profile
app.put('/api/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { full_name, phone, location, blood_group, dob, emergency_contact, language } = req.body;

    const query = `
      UPDATE users 
      SET full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone),
          location = COALESCE($3, location),
          blood_group = COALESCE($4, blood_group),
          dob = COALESCE($5, dob),
          emergency_contact = COALESCE($6, emergency_contact),
          language = COALESCE($7, language)
      WHERE email = $8
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [full_name, phone, location, blood_group, dob, emergency_contact, language, email]);
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all reports for user
app.get('/api/reports/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { rows } = await pool.query('SELECT * FROM reports WHERE user_id = $1 ORDER BY report_date DESC', [userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add new medical report
app.post('/api/reports', async (req, res) => {
  try {
    const { user_id, name, category, hospital, report_date, file_url, file_name, file_size, summary, parameters } = req.body;
    const query = `
      INSERT INTO reports (user_id, name, category, hospital, report_date, file_url, file_name, file_size, summary, parameters)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const paramsJson = Array.isArray(parameters) ? JSON.stringify(parameters) : (parameters || '[]');
    const { rows } = await pool.query(query, [user_id, name, category, hospital, report_date, file_url, file_name, file_size, summary, paramsJson]);
    res.json({ success: true, report: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== FAMILY VAULT ENDPOINTS ==================== //

app.get('/api/family-vault/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const uEmail = (email || '').toLowerCase().trim();

    const pendingInvites = await pool.query(
      `SELECT m.*, v.name as vault_name, v.created_by FROM family_vault_members m JOIN family_vaults v ON m.vault_id = v.id WHERE LOWER(m.user_email) = $1 AND m.status = 'pending'`,
      [uEmail]
    );

    const userVault = await pool.query(
      `SELECT v.* FROM family_vaults v JOIN family_vault_members m ON v.id = m.vault_id WHERE LOWER(m.user_email) = $1 AND m.status = 'accepted' LIMIT 1`,
      [uEmail]
    );

    if (userVault.rows.length === 0) {
      return res.json({
        success: true,
        data: { vault: null, members: [], pendingInvites: pendingInvites.rows.map(mapMember), myPermissions: [] }
      });
    }

    const vault = userVault.rows[0];
    const members = await pool.query(`SELECT * FROM family_vault_members WHERE vault_id = $1 ORDER BY joined_at ASC`, [vault.id]);
    const permissions = await pool.query(`SELECT * FROM family_access_permissions WHERE vault_id = $1 AND LOWER(owner_email) = $2`, [vault.id, uEmail]);

    res.json({
      success: true,
      data: {
        vault: mapVault(vault),
        members: members.rows.map(mapMember),
        pendingInvites: pendingInvites.rows.map(mapMember),
        myPermissions: permissions.rows.map(mapPermission)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/family-vault/create', async (req, res) => {
  try {
    const { vaultName, creatorEmail, creatorName } = req.body;
    const uEmail = (creatorEmail || '').toLowerCase().trim();
    const cName = creatorName || uEmail.split('@')[0];

    const newVault = await pool.query(
      `INSERT INTO family_vaults (name, created_by, creator_name) VALUES ($1, $2, $3) RETURNING *`,
      [vaultName, uEmail, cName]
    );
    const vault = newVault.rows[0];

    const creatorMember = await pool.query(
      `INSERT INTO family_vault_members (vault_id, user_email, user_name, relationship_tag, status) VALUES ($1, $2, $3, 'Owner / Self', 'accepted') RETURNING *`,
      [vault.id, uEmail, cName]
    );

    res.json({ success: true, vault: mapVault(vault), member: mapMember(creatorMember.rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/family-vault/invite', async (req, res) => {
  try {
    const { vaultId, inviterEmail, inviteeEmail, inviteeName, relationshipTag } = req.body;
    const targetEmail = (inviteeEmail || '').toLowerCase().trim();
    const invName = inviteeName || targetEmail.split('@')[0];
    const relTag = relationshipTag || 'Family Member';

    // Remove existing pending/rejected for clean insert
    await pool.query(`DELETE FROM family_vault_members WHERE vault_id = $1 AND LOWER(user_email) = $2 AND status != 'accepted'`, [vaultId, targetEmail]);

    const query = `
      INSERT INTO family_vault_members (vault_id, user_email, user_name, relationship_tag, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [vaultId, targetEmail, invName, relTag]);
    res.json({ success: true, member: mapMember(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/family-vault/respond-invite', async (req, res) => {
  try {
    const { inviteId, userEmail, accept } = req.body;
    const status = accept ? 'accepted' : 'rejected';
    await pool.query(`UPDATE family_vault_members SET status = $1, joined_at = NOW() WHERE id = $2`, [status, inviteId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/family-vault/toggle-permission', async (req, res) => {
  try {
    const { vaultId, ownerEmail, viewerEmail, dataType, isActive } = req.body;
    const oEmail = (ownerEmail || '').toLowerCase().trim();
    const vEmail = (viewerEmail || '').toLowerCase().trim();

    // Idempotent UPSERT
    await pool.query(
      `DELETE FROM family_access_permissions WHERE vault_id = $1 AND LOWER(owner_email) = $2 AND LOWER(viewer_email) = $3 AND data_type = $4`,
      [vaultId, oEmail, vEmail, dataType]
    );

    const query = `
      INSERT INTO family_access_permissions (vault_id, owner_email, viewer_email, data_type, is_active, granted_at, revoked_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), CASE WHEN $5 = FALSE THEN NOW() ELSE NULL END)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [vaultId, oEmail, vEmail, dataType, isActive]);
    res.json({ success: true, permission: mapPermission(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/family-vault/remove-member', async (req, res) => {
  try {
    const { vaultId, memberEmailToRemove } = req.body;
    const mEmail = (memberEmailToRemove || '').toLowerCase().trim();

    await pool.query(`DELETE FROM family_vault_members WHERE vault_id = $1 AND LOWER(user_email) = $2`, [vaultId, mEmail]);
    await pool.query(
      `UPDATE family_access_permissions SET is_active = FALSE, revoked_at = NOW() WHERE vault_id = $1 AND (LOWER(owner_email) = $2 OR LOWER(viewer_email) = $2)`,
      [vaultId, mEmail]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== RAZORPAY TEST MODE PAYMENT ROUTES ====================
// 1. Create Razorpay Order Endpoint
app.post(['/api/payments/create-order', '/api/payment/create-order'], async (req, res) => {
  try {
    const { amount = 999, currency = 'INR', receipt = 'rcpt_' + Date.now(), notes = {} } = req.body;

    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    const amountInPaise = Math.round(parsedAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: String(receipt),
      notes: typeof notes === 'object' ? notes : {}
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      id: order.id,
      orderId: order.id,
      entity: order.entity,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      keyId: razorpayKeyId
    });
  } catch (err) {
    console.error('Razorpay Create Order Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create Razorpay order' });
  }
});

// 2. Secure Server-Side Razorpay Signature Verification Endpoint
app.post(['/api/payments/verify', '/api/payment/verify-signature', '/api/payments/verify-signature'], (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Missing required Razorpay payment verification fields (razorpay_order_id, razorpay_payment_id, razorpay_signature)'
      });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(body.toString())
      .digest('hex');

    const isVerified = expectedSignature === razorpay_signature;

    if (isVerified) {
      return res.json({
        success: true,
        verified: true,
        message: 'Razorpay payment verified successfully!',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      });
    } else {
      return res.status(400).json({
        success: false,
        verified: false,
        error: 'Invalid Razorpay payment signature! Payment verification failed.'
      });
    }
  } catch (err) {
    console.error('Razorpay Signature Verification Error:', err);
    res.status(500).json({ success: false, error: err.message || 'Signature verification error' });
  }
});

// ==================== GOOGLE CALENDAR & MEET OAUTH 2.0 INTEGRATION ====================

function getGoogleOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/callback';

  if (!clientId || !clientSecret || clientId.includes('your_google_client_id')) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// 1. GET /api/google/auth — Generate OAuth Consent URL
app.get('/api/google/auth', (req, res) => {
  const oauth2Client = getGoogleOAuth2Client();
  if (!oauth2Client) {
    return res.status(400).json({
      success: false,
      error: 'Google OAuth Client ID and Secret are not configured in backend/.env yet.',
      instructions: 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env'
    });
  }

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes
  });

  res.json({
    success: true,
    authUrl,
    message: 'Open authUrl in browser to grant Google Calendar permissions for Google Meet creation'
  });
});

// 2. GET /api/google/callback — Handle OAuth Redirect Callback Code Exchange
app.get('/api/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Missing authorization code parameter in query.');
  }

  try {
    const oauth2Client = getGoogleOAuth2Client();
    if (!oauth2Client) {
      return res.status(400).send('Google OAuth Client credentials not configured in backend/.env.');
    }

    const { tokens } = await oauth2Client.getToken(code);

    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>VaultCare Google Meet OAuth Success</title></head>
        <body style="font-family: system-ui, -apple-system, sans-serif; padding: 40px; background: #FAF8F5; color: #1A1A1A;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 32px; border-radius: 20px; border: 1px solid #E5E0D5; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            <h2 style="color: #10B981; margin-top: 0;">VaultCare AI — Google OAuth Success!</h2>
            <p>Your Google Calendar authorization code has been successfully exchanged for tokens.</p>
            <hr style="border: 0; border-top: 1px solid #E5E0D5; margin: 20px 0;" />
            <h4 style="margin-bottom: 8px;">Action Required: Save Refresh Token to backend/.env</h4>
            <p style="font-size: 13px; color: #555;">Copy the refresh token below and set <code>GOOGLE_REFRESH_TOKEN</code> in your <code>backend/.env</code> file:</p>
            <div style="background: #1A1A1A; color: #C9A574; padding: 16px; border-radius: 12px; font-family: monospace; font-size: 12px; word-break: break-all;">
              GOOGLE_REFRESH_TOKEN=${tokens.refresh_token || 'Refresh token already granted. (To regenerate, revoke app access in your Google Account settings)'}
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Google OAuth Callback Token Exchange Error:', err);
    res.status(500).send('Error exchanging authorization code for Google tokens: ' + err.message);
  }
});

// Helper: Create Google Calendar Event with Google Meet conference
async function createGoogleMeetMeeting({ appointmentId, doctorName, patientName, date, time, type }) {
  if (type && type.toLowerCase() !== 'online' && type.toLowerCase() !== 'online video') {
    return { success: false, reason: 'In-person appointment does not require Google Meet.' };
  }

  const oauth2Client = getGoogleOAuth2Client();
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  const hasValidAuth = oauth2Client && refreshToken && !refreshToken.includes('your_google_refresh_token');

  let meetingUrl = null;
  let googleEventId = null;

  if (hasValidAuth) {
    try {
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      let startDateTime = new Date();
      if (date) {
        const [year, month, day] = date.split('-').map(Number);
        if (year && month && day) {
          startDateTime.setFullYear(year, month - 1, day);
        }
      }

      let hours = 10;
      let minutes = 0;
      if (time) {
        const timeMatch = time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (timeMatch) {
          hours = parseInt(timeMatch[1], 10);
          minutes = parseInt(timeMatch[2], 10);
          const ampm = timeMatch[3];
          if (ampm) {
            if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
            if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
          }
        }
      }
      startDateTime.setHours(hours, minutes, 0, 0);

      const endDateTime = new Date(startDateTime.getTime() + 30 * 60 * 1000); // 30 minutes duration

      const eventBody = {
        summary: `VaultCare OPD Consultation: Dr. ${doctorName} & ${patientName}`,
        description: `VaultCare AI Online Video Consultation\nDoctor: Dr. ${doctorName}\nPatient: ${patientName}\nAppointment ID: ${appointmentId}\nType: Online Video Consultation\nTimezone: Asia/Kolkata`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Asia/Kolkata'
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Asia/Kolkata'
        },
        conferenceData: {
          createRequest: {
            requestId: `vaultcare_${appointmentId}_${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        }
      };

      const createdEvent = await calendar.events.insert({
        calendarId: 'primary',
        resource: eventBody,
        conferenceDataVersion: 1
      });

      googleEventId = createdEvent.data.id;
      meetingUrl = createdEvent.data.hangoutLink ||
                   createdEvent.data.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri;

    } catch (gErr) {
      console.error('Google Calendar API Error (Falling back to structured Meet URL):', gErr.message);
    }
  }

  // Fallback structured Meet URL if Google Calendar API credentials are pending configuration
  if (!meetingUrl) {
    const cleanId = (appointmentId || 'apt-' + Date.now()).toString().toLowerCase().replace(/[^a-z0-9]/g, '');
    meetingUrl = `https://meet.google.com/vlt-care-${cleanId}`;
  }

  return {
    success: true,
    meetingLink: meetingUrl,
    meetUrl: meetingUrl,
    googleCalendarEventId: googleEventId
  };
}

// 3. POST /api/appointments/:id/create-meeting — Create or Reuse Google Meet Meeting
app.post('/api/appointments/:id/create-meeting', async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorName, patientName, date, time, type, existingMeetingLink, existingGoogleCalendarEventId } = req.body;

    // Requirement 8: DUPLICATE PREVENTION
    // If appointment already has meetingLink or googleCalendarEventId, DO NOT create another meeting!
    if (existingMeetingLink || existingGoogleCalendarEventId) {
      return res.json({
        success: true,
        alreadyExisted: true,
        meetingLink: existingMeetingLink,
        meetUrl: existingMeetingLink,
        googleCalendarEventId: existingGoogleCalendarEventId
      });
    }

    const meetingResult = await createGoogleMeetMeeting({
      appointmentId: id,
      doctorName: doctorName || 'Doctor',
      patientName: patientName || 'Patient',
      date,
      time,
      type
    });

    res.json(meetingResult);
  } catch (err) {
    console.error('Create Google Meeting Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================
// 4. APPOINTMENTS STRICT SERVER-SIDE FILTERED ENDPOINTS
// ==========================================================

const mapAppointment = (a) => ({
  id: a.id,
  patientEmail: a.patient_email,
  patientName: a.patient_name,
  patientId: a.patient_id,
  doctorEmail: a.doctor_email,
  doctor: a.doctor_name,
  doctorName: a.doctor_name,
  specialty: a.doctor_specialty,
  doctorSpecialty: a.doctor_specialty,
  date: a.date,
  time: a.time,
  type: a.type || 'online',
  status: a.status || 'Pending',
  feePaid: a.fee_paid ? Number(a.fee_paid) : 0,
  location: a.location,
  meetUrl: a.meet_url,
  prescription: a.prescription,
  createdAt: a.created_at
});

// GET /api/appointments/patient/:email — Strict isolation by patient email
app.get('/api/appointments/patient/:email', async (req, res) => {
  try {
    const email = (req.params.email || '').toLowerCase().trim();
    if (!email) return res.json({ success: true, appointments: [] });

    const result = await pool.query(
      'SELECT * FROM public.appointments WHERE LOWER(patient_email) = $1 ORDER BY created_at DESC',
      [email]
    );

    res.json({
      success: true,
      appointments: result.rows.map(mapAppointment)
    });
  } catch (err) {
    console.error('Fetch Patient Appointments Error:', err);
    res.status(500).json({ success: false, error: err.message, appointments: [] });
  }
});

// GET /api/appointments/doctor/:email — Strict isolation by doctor email
app.get('/api/appointments/doctor/:email', async (req, res) => {
  try {
    const email = (req.params.email || '').toLowerCase().trim();
    if (!email) return res.json({ success: true, appointments: [] });

    const result = await pool.query(
      'SELECT * FROM public.appointments WHERE LOWER(doctor_email) = $1 ORDER BY created_at DESC',
      [email]
    );

    res.json({
      success: true,
      appointments: result.rows.map(mapAppointment)
    });
  } catch (err) {
    console.error('Fetch Doctor Appointments Error:', err);
    res.status(500).json({ success: false, error: err.message, appointments: [] });
  }
});

// POST /api/appointments — Save new appointment
app.post('/api/appointments', async (req, res) => {
  try {
    const {
      id,
      patientEmail,
      patientName,
      patientId,
      doctorEmail,
      doctor,
      doctorName,
      specialty,
      doctorSpecialty,
      date,
      time,
      type,
      status,
      feePaid,
      location,
      meetUrl,
      prescription
    } = req.body;

    const aptId = id || 'APT-' + Date.now();
    const docName = doctorName || doctor || 'Doctor';
    const docSpec = doctorSpecialty || specialty || 'General Medicine';
    const isValidUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const safePatientId = isValidUUID(patientId) ? patientId : null;

    const insertResult = await pool.query(
      `INSERT INTO public.appointments 
       (id, patient_email, patient_name, patient_id, doctor_email, doctor_name, doctor_specialty, date, time, type, status, fee_paid, location, meet_url, prescription)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         date = EXCLUDED.date,
         time = EXCLUDED.time,
         type = EXCLUDED.type,
         meet_url = EXCLUDED.meet_url,
         prescription = EXCLUDED.prescription
       RETURNING *`,
      [
        aptId,
        (patientEmail || '').toLowerCase().trim(),
        patientName || 'Patient',
        safePatientId,
        (doctorEmail || '').toLowerCase().trim(),
        docName,
        docSpec,
        date || new Date().toISOString().split('T')[0],
        time || '10:00 AM',
        type || 'online',
        status || 'Pending',
        feePaid || 0,
        location || 'Online Video Consultation',
        meetUrl || null,
        prescription ? JSON.stringify(prescription) : null
      ]
    );

    res.json({
      success: true,
      appointment: mapAppointment(insertResult.rows[0])
    });
  } catch (err) {
    console.error('Save Appointment Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/appointments/:id — Update appointment status, prescription, rescheduling
app.put('/api/appointments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date, time, prescription, meetUrl } = req.body;

    const updates = [];
    const values = [id];
    let idx = 2;

    if (status !== undefined) {
      updates.push(`status = $${idx++}`);
      values.push(status);
    }
    if (date !== undefined) {
      updates.push(`date = $${idx++}`);
      values.push(date);
    }
    if (time !== undefined) {
      updates.push(`time = $${idx++}`);
      values.push(time);
    }
    if (meetUrl !== undefined) {
      updates.push(`meet_url = $${idx++}`);
      values.push(meetUrl);
    }
    if (prescription !== undefined) {
      updates.push(`prescription = $${idx++}`);
      values.push(JSON.stringify(prescription));
    }

    if (updates.length === 0) {
      return res.json({ success: true });
    }

    const query = `UPDATE public.appointments SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }

    res.json({
      success: true,
      appointment: mapAppointment(result.rows[0])
    });
  } catch (err) {
    console.error('Update Appointment Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================
// 5. EMERGENCY MEDICAL ACCESS LOGS ENDPOINTS
// ==========================================================

// POST /api/emergency/share — Patient transmits emergency passport to their selected doctor
app.post('/api/emergency/share', async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      patientEmail,
      doctorEmail,
      doctorName,
      bloodGroup,
      gender,
      emergencyContact,
      allergies,
      vitals,
      summary,
      reportsCount
    } = req.body;

    if (!doctorEmail || !patientEmail) {
      return res.status(400).json({ success: false, error: 'doctorEmail and patientEmail are required' });
    }

    const result = await pool.query(
      `INSERT INTO public.emergency_access_logs
       (patient_id, patient_name, patient_email, doctor_email, doctor_name, blood_group, gender, emergency_contact, allergies, vitals, summary, reports_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        patientId || 'PAT-DEMO',
        patientName || 'Patient',
        patientEmail.toLowerCase().trim(),
        doctorEmail.toLowerCase().trim(),
        doctorName || 'Doctor',
        bloodGroup || 'O+',
        gender || 'Not specified',
        emergencyContact || 'Emergency Contact',
        allergies || 'None reported',
        vitals ? JSON.stringify(vitals) : null,
        summary || 'Emergency medical passport access requested.',
        reportsCount || 0
      ]
    );

    res.json({
      success: true,
      log: result.rows[0]
    });
  } catch (err) {
    console.error('Emergency Share Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/emergency/logs/doctor/:email — Get all emergency logs received by a doctor
app.get('/api/emergency/logs/doctor/:email', async (req, res) => {
  try {
    const email = (req.params.email || '').toLowerCase().trim();
    if (!email) return res.json({ success: true, logs: [] });

    const result = await pool.query(
      'SELECT * FROM public.emergency_access_logs WHERE LOWER(doctor_email) = $1 ORDER BY created_at DESC',
      [email]
    );

    res.json({
      success: true,
      logs: result.rows
    });
  } catch (err) {
    console.error('Fetch Emergency Logs Error:', err);
    res.status(500).json({ success: false, error: err.message, logs: [] });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('Vaultcare PostgreSQL Backend Server running on port', PORT);
})
