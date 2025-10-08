import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST || "localhost";
const port = Number(process.env.SMTP_PORT || 2525);
const from = process.env.SMTP_FROM || "se_svc_apps@rit.edu";

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: false,
});

export async function sendEmail({ to, subject, text, html }) {
  if (!to) throw new Error("Email 'to' required");
  const info = await transporter.sendMail({
    from,
    to,
    subject: subject || "(no subject)",
    text,
    html,
  });
  return info;
}
