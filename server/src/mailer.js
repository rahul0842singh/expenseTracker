const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// Resend is preferred when configured: it sends over HTTPS, so it works on
// hosts like Render that block outbound SMTP ports. SMTP is kept as a
// fallback for local development or hosts that don't block it.
const resendConfigured = Boolean(process.env.RESEND_API_KEY);
const resend = resendConfigured ? new Resend(process.env.RESEND_API_KEY) : null;

let transporter = null;
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

function isMailConfigured() {
  return resendConfigured || smtpConfigured;
}

// Called once at startup so credential/connection problems surface
// immediately rather than on the first user signup.
async function verifyMailer() {
  if (resendConfigured) {
    console.log(
      `Resend configured — OTP emails will be sent via Resend as ${
        process.env.RESEND_FROM || 'ExpenseTracker <onboarding@resend.dev>'
      }`
    );
    if (!process.env.RESEND_FROM) {
      console.log(
        '  Using the Resend sandbox address — this can only email your own Resend account.'
      );
      console.log(
        '  Verify your domain in Resend, then set RESEND_FROM to send to real users.'
      );
    }
    return;
  }

  if (!transporter) {
    console.log('No email provider configured — OTP codes will be printed to this console.');
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
      console.error('    • Your host allows outbound SMTP at all — many free hosts block it');
      console.error('      (set RESEND_API_KEY instead to send over HTTPS, which is never blocked)');
    }
    console.error('');
  }
}

function otpEmailContent(code) {
  return {
    subject: `${code} is your ExpenseTracker verification code`,
    text: `Your ExpenseTracker verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px;background:#0B0E14;color:#F8FAFC;border-radius:16px">
        <h2 style="color:#34D399;margin:0 0 8px">ExpenseTracker</h2>
        <p>Use this code to verify your email address:</p>
        <div style="font-size:32px;font-weight:800;letter-spacing:8px;background:#161B26;border-radius:12px;padding:16px;text-align:center">${code}</div>
        <p style="color:#94A3B8;font-size:12px;margin-top:16px">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
      </div>`,
  };
}

async function sendOtpEmail(email, code) {
  const { subject, text, html } = otpEmailContent(code);

  if (resendConfigured) {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'ExpenseTracker <onboarding@resend.dev>',
      to: email,
      subject,
      text,
      html,
    });
    if (error) throw new Error(error.message || 'Resend rejected the email');
    return { delivered: true };
  }

  if (!transporter) {
    // No email provider configured (development) — print the OTP instead.
    console.log(`\n========================================`);
    console.log(`  OTP for ${email}: ${code}`);
    console.log(`========================================\n`);
    return { delivered: false };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"ExpenseTracker" <no-reply@expensetracker.app>',
    to: email,
    subject,
    text,
    html,
  });
  return { delivered: true };
}

module.exports = { sendOtpEmail, verifyMailer, isMailConfigured };
