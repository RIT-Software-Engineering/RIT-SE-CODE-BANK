import * as nodemailer from "nodemailer";

// lazy transporter: build on first use so environment variables (loaded by dotenv)
// are respected even if modules were imported before dotenv.config() ran.
let transporter = null;
function getTransport() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST || "localhost";
  const port = Number(process.env.SMTP_PORT || 2525);
  transporter = nodemailer.createTransport({
    name: "notification-service",
    host,
    port,
    secure: false,
    tls: {rejectUnauthorized: false}
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

// This is a simple send to many function, where we will loop over the recipiants,
// and send the same message to all of them
// I have the limit set to 50 for now, but once I figure out the rate limit we can change this value
export async function sendEmailToMany({ recipients, subject, text, html, attachCidLogo = false }){
    const limit = 50;
    if (!recipients || recipients.length === 0) throw new Error("No recipients provided");
    if (recipients.length > limit) throw new Error(`The recipienats exceed the set limit of ${limit}`);

    const results = [];

    for(const recipient of recipients){
        try{
            const info = await sendEmail({ to: recipient, subject, text, html, attachCidLogo });
            results.push({ recipient, success: true, info });
        }catch (err){
            results.push({recipient, success: false, error: err.message});
        }

        await new Promise(res => setTimeout(res, 500));
    }

    return results;
}
