import { Router } from "express";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { fileURLToPath } from "url";
import { sendEmail } from "../channels/email.js";
import { resolveDmChannel, sendSlackMessage } from "../channels/slack.js";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TPL_ROOT = path.join(__dirname, "..", "templates");

// --- Register partials ---
const partialDir = path.join(TPL_ROOT, "partials");
if (fs.existsSync(partialDir)) {
  for (const file of fs.readdirSync(partialDir)) {
    const name = path.basename(file, ".hbs");
    const tpl = fs.readFileSync(path.join(partialDir, file), "utf8");
    Handlebars.registerPartial(name, tpl);
  }
}

function loadTemplate(event, name) {
  const tplPath = path.join(TPL_ROOT, event, `${name}.hbs`);
  if (fs.existsSync(tplPath)) {
    return Handlebars.compile(fs.readFileSync(tplPath, "utf8"));
  }
  return null;
}

// Simple default subjects per role (fallback if no template exists)
function defaultSubject(role, context) {
  const job = context?.job_title || "Position";
  const status = context?.new_status || "Update";
  if (role === "applicant") return `Application Update: ${job} → ${status}`;
  return `${context?.applicant_name || "Candidate"} → ${status} (${job})`;
}

// POST /send
// {
//   "event": "application_status_changed",
//   "context": {...},
//   "recipients": [{ "role":"applicant","email":"..." }, { "role":"employer","email":"...", "slack":"@prof" }]
// }
router.post("/", async (req, res) => {
  const { event, context = {}, recipients = [] } = req.body || {};
  if (!event || !Array.isArray(recipients)) {
    return res.status(400).json({ error: "event and recipients[] required" });
  }

  const results = [];
  for (const r of recipients) {
    const role = r.role || "recipient";

    // --- EMAIL ---
    if (r.email) {
      const emailTpl =
        loadTemplate(event, `${role}_email`) ||
        loadTemplate(event, "email");
      const subject =
        (emailTpl && (context.subject_overrides?.[role])) ||
        defaultSubject(role, context);

      let renderedText = null;
      let renderedHtml = null;
      if (emailTpl) {
        const rendered = emailTpl({ ...context, recipient: r });
        // If template returns HTML-like content, send as HTML; else text
        if (typeof rendered === "string" && rendered.includes("</")) {
          renderedHtml = rendered;
        } else {
          renderedText = rendered;
        }
      } else {
        renderedText = `Notification: ${JSON.stringify(context, null, 2)}`;
      }

      const info = await sendEmail({
        to: r.email,
        subject,
        text: renderedText || undefined,
        html: renderedHtml || undefined,
      });
      results.push({ type: "email", to: r.email, messageId: info.messageId });
    }

    // --- SLACK ---
    if (r.slack || r.email) {
      try {
        // choose a slack template if present; else fallback to simple text
        const slackTpl =
          loadTemplate(event, `${role}_slack`) ||
          loadTemplate(event, "slack");
        let slackText = `Event: ${event} :: ${defaultSubject(role, context)}`;
        if (slackTpl) {
          slackText = slackTpl({ ...context, recipient: r });
        }

        // resolve channel only if a slack destination is desired
        const dest = r.slack || null;
        if (dest || process.env.SLACK_BOT_TOKEN) {
          const channelId = dest && (dest.startsWith("C") || dest.startsWith("D"))
            ? dest
            : await resolveDmChannel({ slack: dest, email: r.email });
          const resp = await sendSlackMessage({ channel: channelId, text: slackText });
          results.push({ type: "slack", channel: channelId, ts: resp.ts });
        }
      } catch (e) {
        // it's okay if slack isn't configured or fails; don't block emails
        results.push({ type: "slack", error: String(e) });
      }
    }
  }

  return res.json({ ok: true, results });
});

export default router;
