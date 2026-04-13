import * as nodemailer from "nodemailer";

// lazy transporter: build on first use so environment variables (loaded by dotenv)
// are respected even if modules were imported before dotenv.config() ran.
let transporter = null;
function getTransport() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST || "localhost";
  const port = Number(process.env.SMTP_PORT || 2525);
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: false
  });
  return transporter;
}

/**
 * sendEmail options:
 * - to, subject, text, html
 * - attachCidLogo: boolean (optional) - attach local image and reference as cid:rit_logo_cid
 */
export async function sendEmail({ to, subject, text, html, attachCidLogo = false }) {
  if (!to) throw new Error("Email 'to' required");

  console.log("Sending Email: ",subject);

  const attachments = [];
  // If configured, attach a logo image as a CID so templates can reference cid:rit_logo_cid
  const cidPath = process.env.CID_LOGO_PATH || null;
  if (attachCidLogo && cidPath) {
    try {
      // include as attachment with content-id rit_logo_cid
      attachments.push({
        filename: 'rit-logo.png',
        path: cidPath,
        cid: 'rit_logo_cid',
      });
    } catch (e) {
      // continue without attachment
      console.warn('CID logo attach failed:', e.message);
    }
  }

  const from = process.env.SMTP_FROM || "se_svc_apps@rit.edu";
  const info = await getTransport().sendMail({
    from,
    to,
    subject: subject || "(no subject)",
    text,
    html,
    attachments: attachments.length ? attachments : undefined,
  });
  return info;
}

