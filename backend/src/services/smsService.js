const crypto = require("crypto");

/**
 * Normalize a phone number to E.164 format.
 * e.g. "+243 812 345 678" → "+243812345678"
 *      "0812345678"       → "+243812345678"  (assumes Congo)
 */
function normalizePhone(phone) {
  if (!phone) return null;
  let n = phone.replace(/[\s\-\(\)\.]/g, "");
  if (n.startsWith("00")) n = "+" + n.slice(2);
  if (!n.startsWith("+")) n = "+243" + n.replace(/^0/, "");
  return n;
}

/**
 * Mask a phone number for display.
 * e.g. "+243812345678" → "+243 *** *** 678"
 */
function maskPhone(phone) {
  if (!phone || phone.length < 6) return phone;
  const normalized = normalizePhone(phone) || phone;
  const prefix = normalized.slice(0, 4);
  const suffix = normalized.slice(-3);
  return `${prefix} *** *** ${suffix}`;
}

/**
 * Generate a cryptographically secure 6-digit OTP.
 */
function generateOTP() {
  return String(crypto.randomInt(100000, 999999));
}

/**
 * Send an SMS message.
 * In development mode (no Twilio credentials set), logs to console instead.
 */
async function sendSMS(to, message) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  const isConfigured =
    sid && token && from &&
    !sid.startsWith("ACxxxxxxxx") &&
    sid !== "your_twilio_account_sid";

  if (!isConfigured) {
    console.log(`\n[SMS DEV MODE] ──────────────────────────`);
    console.log(`  To:      ${to}`);
    console.log(`  Message: ${message}`);
    console.log(`────────────────────────────────────────\n`);
    return;
  }

  const twilio = require("twilio")(sid, token);
  await twilio.messages.create({ body: message, from, to });
}

module.exports = { sendSMS, generateOTP, normalizePhone, maskPhone };
