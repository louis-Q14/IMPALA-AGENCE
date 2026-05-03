const crypto = require("crypto");

/**
 * Generate a cryptographically secure 64-char hex token for email verification.
 */
function generateEmailToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Build HTML email template with a given body content.
 */
function buildEmailHtml(frontendUrl, bodyContent) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">IMPALA-AGENCE</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Plateforme multi-services</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              ${bodyContent}
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                &copy; ${new Date().getFullYear()} IMPALA-AGENCE &middot;
                <a href="${frontendUrl}" style="color:#7c3aed;text-decoration:none;">impala-agence.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send an email using Resend API (preferred) or nodemailer (fallback).
 * Falls back to console log in dev mode.
 */
async function sendEmail({ to, subject, html, text }) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM || "IMPALA-AGENCE <noreply@impala-agence.com>";

  // --- Priority 1: Resend API ---
  if (resendKey && resendKey.startsWith("re_")) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: fromAddress, to, subject, html, text }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Resend API error ${res.status}: ${JSON.stringify(err)}`);
    }
    return;
  }

  // --- Priority 2: SMTP via nodemailer ---
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_PORT === "465",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({ from: fromAddress, to, subject, html, text });
    return;
  }

  // --- Dev mode: log to console ---
  console.log(`\n[EMAIL DEV MODE] ──────────────────────────────────────`);
  console.log(`  To      : ${to}`);
  console.log(`  Subject : ${subject}`);
  console.log(`  Content : ${text}`);
  console.log(`────────────────────────────────────────────────────────\n`);
}

/**
 * Send a 6-digit OTP code to the user's email for account verification.
 */
async function sendOTPEmail(email, fullName, otp) {
  const frontendUrl = process.env.FRONTEND_URL || "https://impala-agence.com";

  const bodyContent = `
    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Bonjour ${fullName} 👋</h2>
    <p style="margin:0 0 20px;color:#6b7280;font-size:15px;line-height:1.6;">
      Voici votre code de v&eacute;rification IMPALA-AGENCE.<br/>Saisissez-le dans l&apos;application pour activer votre compte.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <div style="display:inline-block;background:#f3f0ff;border:2px solid #7c3aed;border-radius:12px;padding:20px 40px;">
        <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#7c3aed;font-family:monospace;">${otp}</span>
      </div>
    </div>
    <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;text-align:center;">
      Ce code est valable <strong>10 minutes</strong>.
    </p>
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
      Si vous n&apos;avez pas cr&eacute;&eacute; ce compte, ignorez cet email.
    </p>`;

  await sendEmail({
    to: email,
    subject: `${otp} — Votre code de vérification IMPALA-AGENCE`,
    html: buildEmailHtml(frontendUrl, bodyContent),
    text: `Bonjour ${fullName},\n\nVotre code de vérification IMPALA-AGENCE : ${otp}\n\nValide 10 minutes.\n\n— IMPALA-AGENCE`,
  });
}

/**
 * Send an email verification link (for email address confirmation).
 */
async function sendVerificationEmail(email, fullName, token) {
  const frontendUrl = process.env.FRONTEND_URL || "https://impala-agence.com";
  const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

  const bodyContent = `
    <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Bonjour ${fullName} 👋</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
      Merci de vous &ecirc;tre inscrit(e) sur IMPALA-AGENCE.<br/>
      Cliquez sur le bouton ci-dessous pour v&eacute;rifier votre adresse email et activer votre compte.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${verifyUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;">
        ✅ V&eacute;rifier mon email
      </a>
    </div>
    <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;text-align:center;">
      Ce lien est valable <strong>24 heures</strong>.
    </p>
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
      Si vous n&apos;avez pas cr&eacute;&eacute; ce compte, ignorez cet email.
    </p>`;

  await sendEmail({
    to: email,
    subject: "Vérifiez votre adresse email — IMPALA-AGENCE",
    html: buildEmailHtml(frontendUrl, bodyContent),
    text: `Bonjour ${fullName},\n\nVérifiez votre email en cliquant sur ce lien (valable 24h) :\n${verifyUrl}\n\nSi vous n'avez pas créé ce compte, ignorez cet email.\n\n— IMPALA-AGENCE`,
  });
}

module.exports = { generateEmailToken, sendOTPEmail, sendVerificationEmail };

