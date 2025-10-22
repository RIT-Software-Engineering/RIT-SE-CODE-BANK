import { Router } from "express";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { fileURLToPath } from "url";
import { sendEmail } from "../channels/email.js";
import { resolveDmChannel, sendSlackMessage } from "../channels/slack.js";
import { addNotification } from '../store/notifications.js';
import { getPrisma } from '../db.js';

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

function loadTemplate(event, name, appId) {
  // Prefer app-scoped templates if provided: templates/<app>/<event>/<name>.hbs
  if (appId) {
    const appTplPath = path.join(TPL_ROOT, appId, event, `${name}.hbs`);
    if (fs.existsSync(appTplPath)) {
      if (process.env.DEBUG_NOTIFY) console.debug(`[notify] using template ${appTplPath}`);
      return Handlebars.compile(fs.readFileSync(appTplPath, "utf8"));
    }
  }

  const tplPath = path.join(TPL_ROOT, event, `${name}.hbs`);
  if (fs.existsSync(tplPath)) {
    if (process.env.DEBUG_NOTIFY) console.debug(`[notify] using template ${tplPath}`);
    return Handlebars.compile(fs.readFileSync(tplPath, "utf8"));
  }
  if (process.env.DEBUG_NOTIFY) {
    const tried = [];
    if (appId) tried.push(path.join(TPL_ROOT, appId, event, `${name}.hbs`));
    tried.push(path.join(TPL_ROOT, event, `${name}.hbs`));
    console.debug(`[notify] template not found; tried: ${tried.join(' ; ')}`);
  }

  // Final fallback: search templates tree for any file named `${name}.hbs`.
  // This helps when callers send slightly different event tokens but the
  // app-scoped templates exist somewhere under the templates directory.
  try {
    const candidate = findTemplateByName(name + ".hbs", appId);
    if (candidate) {
      if (process.env.DEBUG_NOTIFY) console.debug(`[notify] found fallback template ${candidate}`);
      return Handlebars.compile(fs.readFileSync(candidate, "utf8"));
    }
  } catch (e) {
    if (process.env.DEBUG_NOTIFY) console.debug('[notify] fallback search failed', e && e.message);
  }

  return null;
}

// Recursively search TPL_ROOT (optionally scoped to appId) for a file named `filename`.
function findTemplateByName(filename, appId) {
  const startDirs = [];
  if (appId) startDirs.push(path.join(TPL_ROOT, appId));
  startDirs.push(TPL_ROOT);

  for (const d of startDirs) {
    if (!fs.existsSync(d)) continue;
    const stack = [d];
    while (stack.length) {
      const cur = stack.pop();
      const items = fs.readdirSync(cur, { withFileTypes: true });
      for (const it of items) {
        const p = path.join(cur, it.name);
        if (it.isDirectory()) stack.push(p);
        else if (it.isFile() && it.name.toLowerCase() === filename.toLowerCase()) return p;
      }
    }
  }
  return null;
}

// Best-effort: find a template path given a compiled template function by searching
// for files with the same filename under the templates tree. This is only used
// for debug reporting; compiled functions themselves don't retain original path.
function findTemplatePathForCompiled(compiledFn) {
  // compiledFn is a function; we can't introspect its origin reliably, so just
  // return null here — the more accurate template paths are logged earlier when
  // the template is loaded. Keep this function in case we add metadata later.
  return null;
}

// Helper to try role aliases when resolving role-specific templates
function loadTemplateForRole(event, role, kind, appId) {
  // kind is 'email' or 'slack', role like 'candidate' or 'applicant' or 'employer'
  const aliases = {
    candidate: ["candidate"],
    applicant: ["candidate"],
    employer: ["employer"],
    admin: ["admin"],
  };
  // try exact role name first
  const directTpl = loadTemplate(event, `${role}_${kind}`, appId) || loadTemplate(event, `${role}_${kind}`, null);
  if (directTpl) return directTpl;
  // Special-case admin: do NOT fall back to other role templates. If an admin-specific
  // template isn't found, fall back to the generic '<kind>' template only. This prevents
  // admins from accidentally receiving employer/candidate templates when those exist.
  if (role === 'admin') {
    if (process.env.DEBUG_NOTIFY) console.debug(`[notify] no admin-specific template found for event='${event}', kind='${kind}'; falling back to generic '${kind}' template`);
    return loadTemplate(event, kind, appId) || loadTemplate(event, kind, null);
  }

  // then try aliases (if any)
  const tryNames = (aliases[role] || []).filter((n) => n !== role);
  for (const rname of tryNames) {
    const tpl = loadTemplate(event, `${rname}_${kind}`, appId) || loadTemplate(event, `${rname}_${kind}`, null);
    if (tpl) {
      if (process.env.DEBUG_NOTIFY) console.debug(`[notify] alias matched role='${role}' -> '${rname}_${kind}'`);
      return tpl;
    }
  }
  // fall back to generic '<kind>' template
  return loadTemplate(event, kind, appId);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeAppId(name) {
  if (!name) return null;
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

// Simple default subjects per role (fallback if no template exists)
// Prefer 'candidate' naming but accept older 'applicant' keys for compatibility
function defaultSubject(role, context) {
  const job = context?.job_title || "Position";
  const status = context?.new_status || "Update";
  // treat applicant and candidate roles equivalently; prefer 'candidate'
  if (role === "candidate" || role === "applicant")
    return `Application Update: ${job} → ${status}`;

  // prefer candidate_name/candidateName, fall back to applicant variants
  const person =
    context?.candidate_name || context?.candidateName ||
    context?.applicant_name || context?.applicantName ||
    "Candidate";
  return `${person} → ${status} (${job})`;
}

// Expose normalizeContext and cleanName for testing and reuse
function cleanName(n) {
  if (!n) return n;
  let s = String(n).trim();
  // remove stray commas
  s = s.replace(/\s*,\s*/g, ' ');
  // collapse multiple spaces
  s = s.replace(/\s+/g, ' ');
  // NOTE: Previously we collapsed duplicated single-letter initials (e.g., "Ben G G" -> "Ben G").
  // That behavior was removed to preserve the original name as-is after trimming/normalization.
  return s;
}

function normalizeContext(ctx) {
  const out = { ...(ctx || {}) };
  // course / class aliases -> course_name
  out.course_name = out.course_name || out.course || out.class || out.class_name || out.courseName;
  // job title aliases
  out.job_title = out.job_title || out.jobTitle || out.position || out.role_title;
  // professor / hiring manager aliases
  out.professor = out.professor || out.hiring_manager || out.hiringManager || out.instructor || out.prof;
  out.hiring_manager = out.hiring_manager || out.hiringManager || out.professor || out.instructor;
  // candidate/applicant name normalization
  out.candidate_name = out.candidate_name || out.candidateName || out.applicant_name || out.applicantName;
  out.candidate_name = cleanName(out.candidate_name);
  // app_link aliases
  out.app_link = out.app_link || out.application_url || out.application_link || out.applicationUrl || out.appUrl;
  // common email alias fields used for role inference
  out.candidate_email = out.candidate_email || out.candidateEmail || out.candidate_email_address || out.candidateEmailAddress;
  out.instructor_email = out.instructor_email || out.instructorEmail || out.instructor_email_address || out.instructorEmailAddress || out.instructor;
  return out;
}

// POST /send
// {
//   "event": "application_status_changed",
//   "context": {...},
//   "recipients": [{ "role":"candidate","email":"..." }, { "role":"employer","email":"...", "slack":"@prof" }]
// }
router.post("/", async (req, res) => {
  const { event, context = {}, recipients = [] } = req.body || {};
  // Normalize common event aliases to a canonical template folder name so
  // templates are found even when callers use older or different event names
  // (e.g. TA-Portal historically sent 'APPLICATION_RECEIVED').
  const EVENT_ALIAS_MAP = {
    application_received: 'application_status_changed',
    application_status_changed: 'application_status_changed',
    moved_to_interview: 'application_status_changed',
    status_changed: 'application_status_changed',
    rejected: 'application_status_changed',
    accepted_offer: 'application_status_changed',
    declined_offer: 'application_status_changed',
    hired: 'application_status_changed',
    applied: 'application_status_changed',
  };
  const rawEvent = event || '';
  const normalizedEventKey = String(rawEvent).trim().toLowerCase();
  // Some callers include extra context in the event string (for example:
  // "APPLICATION_RECEIVED :: Ben Griffin -> Update (Position)").
  // Extract a base token (the first meaningful chunk) and try mapping that
  // as well so templates are still resolved correctly.
  const baseEvent = String(normalizedEventKey).split(/[\s:\/|]+/)[0];
  const eventForTemplates = EVENT_ALIAS_MAP[normalizedEventKey] || EVENT_ALIAS_MAP[baseEvent] || normalizedEventKey;
  // Normalize context aliases using the shared helper
  const normContext = normalizeContext(context);

  // If recipients were provided without a role, try to infer common roles
  // from the context so templates like candidate_email / employer_email are used
  // instead of falling back to the raw-JSON view.
  const inferRoleFromEmail = (email) => {
    if (!email) return null;
    const e = String(email).trim().toLowerCase();
    const candidateEmails = [normContext.candidate_email, normContext.candidateEmail, normContext.candidate_email_address].filter(Boolean).map(s => String(s).toLowerCase());
    const instructorEmails = [normContext.instructorEmail, normContext.instructor_email, normContext.instructor_email_address, normContext.instructor].filter(Boolean).map(s => String(s).toLowerCase());
    if (candidateEmails.includes(e)) return 'candidate';
    if (instructorEmails.includes(e)) return 'employer';
    return null;
  };

  const normalizedRecipients = (recipients || []).map((r) => {
    // keep existing role if provided
    if (r && r.role) return r;
    const inferred = inferRoleFromEmail(r && (r.email || r.slack));
    return { ...(r || {}), role: inferred || (r && r.role) || undefined };
  });
  if (!event || !Array.isArray(recipients)) {
    return res.status(400).json({ error: "event and recipients[] required" });
  }

  const results = [];
  for (const r of normalizedRecipients) {
    // normalize role so aliases and template lookup are case-insensitive
    const role = String(r.role || "recipient").toLowerCase();
    const appId = req.body.appId || normalizeAppId(normContext?.appName) || null;

    // optional debug logging (set DEBUG_NOTIFY=1 to enable)
    if (process.env.DEBUG_NOTIFY) {
      console.debug(`[notify] recipient=${r.email||r.slack||'<unknown>'} role=${role} appId=${appId}`);
    }

    // --- EMAIL ---
    if (r.email) {
      // Try app-specific templates first (if an appId was derived), then global
      const emailTpl = (appId && loadTemplateForRole(eventForTemplates, role, 'email', appId)) || loadTemplateForRole(eventForTemplates, role, 'email', null);
  const subject = (normContext.subject_overrides?.[role]) || defaultSubject(role, normContext);

      let renderedText = undefined;
      let renderedHtml = undefined;
      if (emailTpl) {
  const rendered = emailTpl({ ...normContext, recipient: r });
        if (typeof rendered === "string") {
          // If template returned HTML (contains a closing tag) treat as HTML
          if (rendered.includes("</")) {
            renderedHtml = rendered;
            // avoid sending a huge plain-text alternative that could be displayed instead
            renderedText = undefined;
          } else {
            // Template produced plain text; wrap it in simple HTML and do not include large text body
            renderedHtml = `<div style="font-family:Arial,Helvetica,sans-serif;color:#222;line-height:1.4;white-space:pre-wrap;">${escapeHtml(rendered)}</div>`;
            renderedText = undefined;
          }
        }
      } else {
        // No template at all — send a readable HTML view of the context instead of raw JSON
  const pretty = escapeHtml(JSON.stringify(normContext, null, 2));
        renderedHtml = `<div style="font-family:Arial,Helvetica,sans-serif;color:#222;line-height:1.4;"><p>Notification</p><pre style="white-space:pre-wrap;background:#f7f7f7;padding:8px;border-radius:4px;">${pretty}</pre></div>`;
        // set a short plain-text summary instead of whole JSON so text-only clients get a useful subject/summary
        renderedText = `Notification: ${defaultSubject(role, context)}`;
      }

      const info = await sendEmail({
        to: r.email,
        subject,
        text: renderedText || undefined,
        html: renderedHtml || undefined,
        // request CID logo attach if CID_LOGO_PATH is configured
        attachCidLogo: true,
      });
      const resultObj = { type: "email", to: r.email, messageId: info.messageId };
      if (process.env.DEBUG_NOTIFY && emailTpl) {
        // try to surface which template file was used (best-effort)
        try {
          const tplPath = findTemplatePathForCompiled(emailTpl);
          if (tplPath) resultObj.templateUsed = tplPath;
        } catch (e) { /* ignore */ }
      }
      results.push(resultObj);
      // record into in-memory recent store for dev - prefer username as the canonical identifier
      try { addNotification(appId || 'ta-portal', r.username || r.email || r.slack || 'unknown', { title: subject, message: renderedText || renderedHtml || '', channel: 'email' }); } catch (e) { /* ignore */ }
      // persist notification to DB when Prisma is available (do not block or fail send)
      try {
        const prisma = getPrisma();
        if (prisma && prisma.notification) {
          await prisma.notification.create({ data: { appId: appId || 'ta-portal', username: (r.username || r.email || r.slack || 'unknown'), title: subject, message: renderedText || renderedHtml || '', channel: 'email' } });
        }
      } catch (dbErr) {
        // non-fatal: DB may be unconfigured in dev
        if (process.env.DEBUG_NOTIFY) console.warn('notify: failed to persist email notification', dbErr && dbErr.message);
      }
    }

    // --- SLACK ---
    if (r.slack || r.email) {
      try {
        // choose a slack template if present (try app-specific then global), else fallback to simple text
        const slackTpl = (appId && loadTemplateForRole(eventForTemplates, role, 'slack', appId)) || loadTemplateForRole(eventForTemplates, role, 'slack', null);
        let slackText = `Event: ${event} :: ${defaultSubject(role, normContext)}`;
        if (slackTpl) {
          slackText = slackTpl({ ...normContext, recipient: r });
        }

        // resolve channel only if a slack destination is desired
        const dest = r.slack || null;
        if (dest || process.env.SLACK_BOT_TOKEN) {
          const channelId = dest && (dest.startsWith("C") || dest.startsWith("D"))
            ? dest
            : await resolveDmChannel({ slack: dest, email: r.email });
          // Provide both text and a mrkdwn section block so formatting is preserved in DMs
          const blocks = [{ type: 'section', text: { type: 'mrkdwn', text: slackText } }];
          const resp = await sendSlackMessage({ channel: channelId, text: slackText, blocks });
          results.push({ type: "slack", channel: channelId, ts: resp.ts });
          try { addNotification(appId || 'ta-portal', r.username || r.email || r.slack || 'unknown', { title: `Slack: ${defaultSubject(role, normContext)}`, message: slackText, channel: 'slack' }); } catch (e) { /* ignore */ }
          // persist slack notification to DB when Prisma is available
          try {
            const prisma = getPrisma();
            if (prisma && prisma.notification) {
              await prisma.notification.create({ data: { appId: appId || 'ta-portal', username: (r.username || r.email || r.slack || 'unknown'), title: `Slack: ${defaultSubject(role, normContext)}`, message: slackText, channel: 'slack' } });
            }
          } catch (dbErr) {
            if (process.env.DEBUG_NOTIFY) console.warn('notify: failed to persist slack notification', dbErr && dbErr.message);
          }
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

// Expose helpers for unit tests and reuse
export {
  loadTemplate,
  loadTemplateForRole,
  escapeHtml,
  normalizeAppId,
  defaultSubject,
  normalizeContext,
  cleanName,
};

