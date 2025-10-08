// emailAdapter.js
const nodemailer = require("nodemailer");

const SMTP_HOST = process.env.SMTP_HOST || "localhost";
const SMTP_PORT = process.env.SMTP_PORT || 2525;
const FROM_ADDRESS = process.env.FROM_EMAIL || "se_svc_apps@rit.edu";

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
});

async function sendEmailByAddress(to, text) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to,
      subject: "SE Portal Notification",
      text,
    });
    return { success: true };
  } catch (err) {
    console.error("Email error:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendEmailByAddress };

