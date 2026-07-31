const express = require('express');
const bcrypt = require('bcryptjs');
const { prepare: db } = require('../db');
const { sendOtpEmail } = require('../mailer');
const { signToken } = require('../middleware/auth');

const router = express.Router();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const IS_DEV = process.env.NODE_ENV !== 'production';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toPublicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    monthlyBudget: row.monthly_budget === null || row.monthly_budget === undefined
      ? null
      : row.monthly_budget,
  };
}

async function createAndSendOtp(email) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await db('DELETE FROM otps WHERE email = ?').run(email);
  await db('INSERT INTO otps (email, code, expires_at) VALUES (?, ?, ?)').run(
    email,
    code,
    Date.now() + OTP_TTL_MS
  );

  let delivered = false;
  try {
    ({ delivered } = await sendOtpEmail(email, code));
  } catch (err) {
    // The code is already stored, so the account is usable once mail is fixed.
    console.error(`Failed to email OTP to ${email}: ${err.message}`);
    return { delivered: false, mailError: err.message };
  }
  // In development (no SMTP), return the OTP so the app can show it.
  return { delivered, devOtp: !delivered && IS_DEV ? code : undefined };
}

// POST /api/auth/register  { name, email, password }
router.post('/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Enter a valid email address' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await db('SELECT id, verified FROM users WHERE email = ?').get(email);
    if (existing && existing.verified) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    if (existing) {
      await db('UPDATE users SET name = ?, password_hash = ? WHERE id = ?').run(
        name,
        passwordHash,
        existing.id
      );
    } else {
      await db('INSERT INTO users (name, email, password_hash, verified) VALUES (?, ?, ?, 0)').run(
        name,
        email,
        passwordHash
      );
    }

    const { devOtp, mailError } = await createAndSendOtp(email);
    if (mailError) {
      return res.status(502).json({
        error: 'Could not send the verification email. Please check the server email settings.',
      });
    }
    res.json({ message: 'OTP sent to your email', email, devOtp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/verify-otp  { email, code }
router.post('/verify-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();

    const otp = await db('SELECT * FROM otps WHERE email = ? AND code = ?').get(email, code);
    if (!otp) return res.status(400).json({ error: 'Incorrect OTP. Please try again.' });
    if (otp.expires_at < Date.now()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    await db('DELETE FROM otps WHERE email = ?').run(email);
    await db('UPDATE users SET verified = 1 WHERE email = ?').run(email);

    const user = await db('SELECT id, name, email, monthly_budget FROM users WHERE email = ?').get(email);
    if (!user) return res.status(404).json({ error: 'Account not found. Please sign up again.' });

    const token = signToken(user.id);
    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/login  { email, password }
router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    const user = await db('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    if (!user.verified) {
      const { devOtp } = await createAndSendOtp(email);
      return res.status(403).json({
        error: 'Email not verified. We sent you a new OTP.',
        needsVerification: true,
        email,
        devOtp,
      });
    }

    const token = signToken(user.id);
    res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/resend-otp  { email }
router.post('/resend-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await db('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) return res.status(404).json({ error: 'No account found for this email' });

    const { devOtp, mailError } = await createAndSendOtp(email);
    if (mailError) {
      return res.status(502).json({
        error: 'Could not send the verification email. Please check the server email settings.',
      });
    }
    res.json({ message: 'OTP sent to your email', devOtp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
