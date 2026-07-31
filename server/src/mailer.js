const nodemailer = require('nodemailer');

let transporter = null;

// Treat a host with no password as unconfigured, otherwise every send fails
// with a confusing auth error instead of falling back to the console.
const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_PASS);

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Shared hosting frequently serves a certificate that doesn't match
    // mail.<domain>, so allow opting out of strict verification.
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
    logger: process.env.SMTP_DEBUG === 'true',
    debug: process.env.SMTP_DEBUG === 'true',
  });
}

function isSmtpConfigured() {
  return smtpConfigured;
}

// Called once at startup so credential problems surface immediately
// rather than on the first user signup.
async function verifyMailer() {
  if (!transporter) {
    console.log('SMTP not configured — OTP codes will be printed to this console.');
    return;
  }
  try {
    await transporter.verify();
    console.log(`SMTP ready — OTP emails will be sent via ${process.env.SMTP_HOST} as ${process.env.SMTP_USER}`);
  } catch (err) {
    console.error('\nSMTP connection FAILED — OTP emails will not send.');
    console.error(`  ${err.message}\n`);

    const msg = String(err.message).toLowerCase();
    if (msg.includes('self signed') || msg.includes('certificate')) {
      console.error('  This is a certificate mismatch, common on shared hosting.');
      console.error('  Fix: set SMTP_TLS_REJECT_UNAUTHORIZED=false in server/.env');
    } else if (msg.includes('auth') || msg.includes('credentials') || msg.includes('login')) {
      console.error('  Authentication was rejected. Check that:');
      console.error('    • SMTP_USER is the FULL email address (you@yourdomain.com)');
      console.error('    • SMTP_PASS is the mailbox password set in your hosting panel');
    } else if (msg.includes('timeout') || msg.includes('econnrefused') || msg.includes('enotfound')) {
      console.error('  Could not reach the mail server. Check that:');
      console.error('    • SMTP_HOST matches your panel\'s outgoing server exactly');
      console.error('    • SMTP_PORT/SMTP_SECURE pair up (465+true, or 587+false)');
    }
    console.error('');
  }
}

async function sendOtpEmail(email, code) {
  if (!transporter) {
    // No SMTP configured (development) — print the OTP to the server console.
    console.log(`\n========================================`);
    console.log(`  OTP for ${email}: ${code}`);
    console.log(`========================================\n`);
    return { delivered: false };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"ExpenseTracker" <no-reply@expensetracker.app>',
    to: email,
    subject: `${code} is your ExpenseTracker verification code`,
    text: `Your ExpenseTracker verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px;background:#0B0E14;color:#F8FAFC;border-radius:16px">
        <h2 style="color:#34D399;margin:0 0 8px">ExpenseTracker</h2>
        <p>Use this code to verify your email address:</p>
        <div style="font-size:32px;font-weight:800;letter-spacing:8px;background:#161B26;border-radius:12px;padding:16px;text-align:center">${code}</div>
        <p style="color:#94A3B8;font-size:12px;margin-top:16px">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
      </div>`,
  });
  return { delivered: true };
}

module.exports = { sendOtpEmail, verifyMailer, isSmtpConfigured };
