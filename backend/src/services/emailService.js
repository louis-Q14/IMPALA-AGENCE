const nodemailer = require("nodemailer");
const crypto = require("crypto");

/**
 * Generate a cryptographically secure 64-char hex token for email verification.
 */
function generateEmailToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Send an email verification link.
 * In development mode (no SMTP credentials set), logs to console instead.
 */
async function sendVerificationEmail(email, fullName, token) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

  const isConfigured =
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_HOST !== "smtp.example.com";

  if (!isConfigured) {
    console.log(`\n[EMAIL DEV MODE] ──────────────────────────────────────`);
    console.log(`  To      : ${email}`);
    console.log(`  Name    : ${fullName}`);
    console.log(`  Link    : ${verifyUrl}`);
    console.log(`────────────────────────────────────────────────────────\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const fromAddress =
    process.env.SMTP_FROM || `"IMPALA-AGENCE" <noreply@impala-agence.com>`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vérifiez votre email</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">IMPALA-AGENCE</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Plateforme multi-services</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">Bonjour ${fullName} 👋</h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                Merci de vous être inscrit(e) sur IMPALA-AGENCE.<br/>
                Cliquez sur le bouton ci-dessous pour vérifier votre adresse email et activer votre compte.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${verifyUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.2px;">
                  ✅ Vérifier mon email
                </a>
              </div>
              <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;text-align:center;">
                Ce lien est valable <strong>24 heures</strong>.
              </p>
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                Si vous n'avez pas créé ce compte, ignorez cet email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                © ${new Date().getFullYear()} IMPALA-AGENCE · 
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

  await transporter.sendMail({
    from: fromAddress,
    to: email,
    subject: "Vérifiez votre adresse email — IMPALA-AGENCE",
    html,
    text: `Bonjour ${fullName},\n\nVérifiez votre email en cliquant sur ce lien (valable 24h) :\n${verifyUrl}\n\nSi vous n'avez pas créé ce compte, ignorez cet email.\n\n— IMPALA-AGENCE`,
  });
}

module.exports = { generateEmailToken, sendVerificationEmail };
