import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TPL_ROOT = path.join(__dirname, '..', 'templates');

// Helper to (re)register partials from disk. We call this on each render so
// template/branding changes take effect immediately without restarting.
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
  workflow_action_completed: 'application_status_changed',
};

function normalizeEventKey(raw) {
  const s = String(raw || '').trim().toLowerCase();
  const base = s.split(/[\s:/|]+/)[0];
  return EVENT_ALIAS_MAP[s] || EVENT_ALIAS_MAP[base] || s;
}

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

export function loadTemplate(event, name, appId) {
  // Ensure partials are up to date before compiling a template.
  registerPartials();
  const key = normalizeEventKey(event);
  if (!key || !name) return null;
  // Prefer app-scoped path
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

export function renderEmail({ event, role, appId, context, fallbackMessage }) {
  const tpl = loadTemplateForRole(event, role, 'email', appId);
  if (!tpl) return { html: fallbackMessage ? `<div>${escapeHtml(fallbackMessage)}</div>` : undefined, text: fallbackMessage || undefined };
  const rendered = tpl({ ...(context || {}) });
  if (typeof rendered === 'string' && rendered.includes('</')) {
    return { html: rendered };
  }
  return { html: `<div style="white-space:pre-wrap">${escapeHtml(String(rendered))}</div>` };
}

export function renderSlack({ event, role, appId, context, fallbackText }) {
  const tpl = loadTemplateForRole(event, role, 'slack', appId);
  if (!tpl) return { text: fallbackText || '' };
  const rendered = tpl({ ...(context || {}) });
  return { text: String(rendered) };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export { normalizeEventKey };
