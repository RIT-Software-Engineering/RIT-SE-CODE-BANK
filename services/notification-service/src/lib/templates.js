import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TPL_ROOT = path.join(__dirname, '..', 'templates');

/**
 * Registers all Handlebars partials from the templates/partials directory.
 * Called before each template render to ensure changes take effect without server restart.
 * Partials are reusable template fragments like headers and footers.
 */
function registerPartials() {
  try {
    const partialDir = path.join(TPL_ROOT, 'partials');
    if (!fs.existsSync(partialDir)) return;
    for (const file of fs.readdirSync(partialDir)) {
      if (!file.endsWith('.hbs')) continue;
      const name = path.basename(file, '.hbs');
      const tpl = fs.readFileSync(path.join(partialDir, file), 'utf8');
      Handlebars.registerPartial(name, tpl);
    }
  } catch (_) {}
}

/**
 * Generates a default email subject line based on role and context.
 * For candidates: "Application Update: [Job] → [Status]"
 * For employers/admins: "[Person] → [Status] ([Job])"
 * 
 * @param {string} role - Recipient role (candidate, employer, admin)
 * @param {Object} context - Notification context with item and status info
 * @returns {string} Generated subject line
 */
export function defaultSubject(role, context) {
  const ctx = context || {};
  const job = (ctx.item && ctx.item.title) || 'Position';
  const status = (ctx.status && ctx.status.new) || 'Update';
  if ((role || '').toLowerCase() === 'candidate' || (role || '').toLowerCase() === 'applicant') {
    return `Application Update: ${job} → ${status}`;
  }
  const person = (ctx.recipient && ctx.recipient.name) || 'Candidate';
  return `${person} → ${status} (${job})`;
}

/**
 * Loads and compiles a Handlebars template for a specific event and template name.
 * Searches for templates in this order:
 * 1. App-specific: templates/{appId}/{event}/{name}.hbs
 * 2. Generic: templates/{event}/{name}.hbs
 * 
 * @param {string} event - Event name (normalized to lowercase)
 * @param {string} name - Template file name (e.g., "candidate_email", "employer_slack")
 * @param {string} appId - Application identifier (e.g., "ta-portal")
 * @returns {Function|null} Compiled Handlebars template function or null if not found
 */
export function loadTemplate(event, name, appId) {
  // Ensure partials are up to date before compiling a template.
  registerPartials();
  const key = String(event || '').trim().toLowerCase();
  if (!key || !name) return null;
  // Prefer app-scoped path, fallback to generic
  const attempts = [];
  if (appId) attempts.push(path.join(TPL_ROOT, appId, key, `${name}.hbs`));
  attempts.push(path.join(TPL_ROOT, key, `${name}.hbs`));
  for (const p of attempts) {
    if (fs.existsSync(p)) {
      return Handlebars.compile(fs.readFileSync(p, 'utf8'));
    }
  }
  return null;
}

/**
 * Loads a template for a specific role with fallback chain.
 * Attempts to load templates in this order:
 * 1. Role-specific: {role}_{kind} (e.g., "candidate_email")
 * 2. Applicant fallback: "candidate_{kind}" (if role is "applicant")
 * 3. Generic: {kind} (e.g., "email")
 * 
 * Admin role has special handling: tries "admin_{kind}" then generic "{kind}".
 * 
 * @param {string} event - Event name
 * @param {string} role - Recipient role (candidate, employer, admin, applicant)
 * @param {string} kind - Template kind (email or slack)
 * @param {string} appId - Application identifier
 * @returns {Function|null} Compiled template function or null if not found
 */
export function loadTemplateForRole(event, role, kind, appId) {
  const r = String(role || 'recipient').toLowerCase();
  // Admin should only use explicit admin templates or generic kind
  if (r === 'admin') {
    return loadTemplate(event, `admin_${kind}`, appId) || loadTemplate(event, kind, appId);
  }
  // Candidate/applicant aliasing
  const chain = [
    `${r}_${kind}`,
    ...(r === 'applicant' ? [`candidate_${kind}`] : []),
    kind,
  ];
  for (const name of chain) {
    const tpl = loadTemplate(event, name, appId);
    if (tpl) return tpl;
  }
  return null;
}

/**
 * Renders an email notification using Handlebars templates.
 * Returns HTML and/or text content for the email body.
 * 
 * @param {Object} params - Rendering parameters
 * @param {string} params.event - Event name
 * @param {string} params.role - Recipient role
 * @param {string} params.appId - Application identifier
 * @param {Object} params.context - Template context data
 * @param {string} params.fallbackMessage - Plain text fallback if template not found
 * @returns {Object} Object with html and/or text properties
 */
export function renderEmail({ event, role, appId, context, fallbackMessage }) {
  const tpl = loadTemplateForRole(event, role, 'email', appId);
  if (!tpl) return { html: fallbackMessage ? `<div>${escapeHtml(fallbackMessage)}</div>` : undefined, text: fallbackMessage || undefined };
  const rendered = tpl({ ...(context || {}) });
  if (typeof rendered === 'string' && rendered.includes('</')) {
    return { html: rendered };
  }
  return { html: `<div style="white-space:pre-wrap">${escapeHtml(String(rendered))}</div>` };
}

/**
 * Renders a Slack notification using Handlebars templates.
 * Returns plain text formatted for Slack messages.
 * 
 * @param {Object} params - Rendering parameters
 * @param {string} params.event - Event name
 * @param {string} params.role - Recipient role
 * @param {string} params.appId - Application identifier
 * @param {Object} params.context - Template context data
 * @param {string} params.fallbackText - Plain text fallback if template not found
 * @returns {Object} Object with text property containing Slack message
 */
export function renderSlack({ event, role, appId, context, fallbackText }) {
  const tpl = loadTemplateForRole(event, role, 'slack', appId);
  if (!tpl) return { text: fallbackText || '' };
  const rendered = tpl({ ...(context || {}) });
  return { text: String(rendered) };
}

/**
 * Escapes special HTML characters to prevent XSS attacks.
 * Used when rendering plain text fallbacks in HTML emails.
 * 
 * @param {string} str - String to escape
 * @returns {string} HTML-safe string
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
