import { Router } from "express";
import { getPrisma, ensurePrisma } from "../db.js";

const router = Router();

function normalizeEmail(e) {
  return (e || "").trim().toLowerCase();
}

// Resolve identifier: if it contains '@' treat as email, otherwise username
function isEmail(identifier) {
  return identifier && identifier.includes("@");
}

// GET /api/v1/preferences/:appId/:identifier
router.get("/:appId/:identifier", async (req, res) => {
  const { appId, identifier } = req.params;
  try {
    // Try database first
    try {
      const prisma = getPrisma();
      let pref = null;
      if (isEmail(identifier)) {
        const email = normalizeEmail(identifier);
        pref = await prisma.notificationPreference.findUnique({
          where: { appId_userEmail: { appId, userEmail: email } },
        });
      } else {
        // look up by username
        pref = await prisma.notificationPreference.findFirst({
          where: { appId, username: identifier },
        });
      }
      if (!pref) {
        // return defaults
        return res.json({ notifyEmail: true, notifySlack: false });
      }
      return res.json({ notifyEmail: pref.notifyEmail, notifySlack: pref.notifySlack, username: pref.username, userEmail: pref.userEmail });
    } catch (dbErr) {
      // DB unavailable — use in-memory fallback
      console.warn('Preferences DB unavailable, using in-memory fallback:', dbErr.message);
      const key = `${appId}:${normalizeEmail(identifier)}`;
      if (inMemoryPrefs.has(key)) {
        return res.json(inMemoryPrefs.get(key));
      }
      // if identifier was a username, try username-keyed entry
      if (!isEmail(identifier)) {
        for (const [k, v] of inMemoryPrefs.entries()) {
          if (k.startsWith(`${appId}:`) && v.username === identifier) return res.json(v);
        }
      }
      return res.json({ notifyEmail: true, notifySlack: false });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
});

// PUT /api/v1/preferences/:appId/:identifier
router.put("/:appId/:identifier", async (req, res) => {
  const { appId, identifier } = req.params;
  const { userEmail, username, notifyEmail, notifySlack } = req.body || {};
  try {
    // Try DB upsert; if DB not available, use in-memory store
    try {
      const prisma = getPrisma();
      let emailToUse = null;
      if (userEmail) {
        emailToUse = normalizeEmail(userEmail);
      } else if (isEmail(identifier)) {
        emailToUse = normalizeEmail(identifier);
      }

      if (!emailToUse) {
        // If only username provided, try to lookup existing row; else require email
        if (!username && !identifier) {
          return res.status(400).json({ error: "userEmail or username/identifier required" });
        }
        // If identifier is username, try to find existing mapping
        if (!isEmail(identifier)) {
          const existing = await prisma.notificationPreference.findFirst({ where: { appId, username: identifier } });
          if (existing && existing.userEmail) emailToUse = existing.userEmail;
        }
        if (!emailToUse && username) {
          // try find by provided username
          const existing = await prisma.notificationPreference.findFirst({ where: { appId, username } });
          if (existing && existing.userEmail) emailToUse = existing.userEmail;
        }
      }

      if (!emailToUse) {
        return res.status(400).json({ error: "userEmail is required for upsert to canonicalize identity" });
      }

      const upserted = await prisma.notificationPreference.upsert({
        where: { appId_userEmail: { appId, userEmail: emailToUse } },
        create: { appId, userEmail: emailToUse, username: username || identifier, notifyEmail: notifyEmail ?? true, notifySlack: notifySlack ?? false },
        update: { username: username || identifier, notifyEmail: notifyEmail ?? true, notifySlack: notifySlack ?? false },
      });

      return res.json({ ok: true, preference: { notifyEmail: upserted.notifyEmail, notifySlack: upserted.notifySlack, userEmail: upserted.userEmail, username: upserted.username } });
    } catch (dbErr) {
      console.warn('Preferences DB unavailable, using in-memory fallback:', dbErr.message);
      // Determine canonical email
      let emailToUse = userEmail ? normalizeEmail(userEmail) : (isEmail(identifier) ? normalizeEmail(identifier) : null);
      if (!emailToUse && !isEmail(identifier)) {
        // Try find by username in in-memory store
        for (const [k, v] of inMemoryPrefs.entries()) {
          if (k.startsWith(`${appId}:`) && v.username === identifier) {
            emailToUse = v.userEmail;
            break;
          }
        }
      }
      if (!emailToUse && username) {
        for (const [k, v] of inMemoryPrefs.entries()) {
          if (k.startsWith(`${appId}:`) && v.username === username) {
            emailToUse = v.userEmail;
            break;
          }
        }
      }
      if (!emailToUse && !username && !isEmail(identifier)) {
        return res.status(400).json({ error: 'userEmail is required for upsert to canonicalize identity' });
      }
      if (!emailToUse && username) emailToUse = normalizeEmail(username + '@example.invalid');
      if (!emailToUse && isEmail(identifier)) emailToUse = normalizeEmail(identifier);

      const prefObj = { notifyEmail: notifyEmail ?? true, notifySlack: notifySlack ?? false, userEmail: emailToUse, username: username || identifier };
      const key = `${appId}:${emailToUse}`;
      inMemoryPrefs.set(key, prefObj);
      return res.json({ ok: true, preference: prefObj });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
});

// In-memory fallback store used when DB is unavailable (map key: `${appId}:${userEmail}`)
const inMemoryPrefs = new Map();

export default router;
