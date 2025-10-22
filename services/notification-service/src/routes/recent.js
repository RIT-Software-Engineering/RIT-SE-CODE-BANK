import { Router } from 'express';
import { getPrisma } from '../db.js';
import { getRecent as getRecentFromStore, clearAll, listKeys } from '../store/notifications.js';
import { getRecent as getRecentFromStoreRaw } from '../store/notifications.js';

const router = Router();
// Simple recent notifications endpoint. Production would be a paginated DB query.
// For dev we read the in-memory store (which notify writes to using username).
// If no stored items and DB isn't configured/has none, return an empty array.
router.get('/:appId/:identifier', async (req, res) => {
	const { appId, identifier } = req.params;
	const { limit = 5, page = 0 } = req.query || {};
	try {
		// Treat identifier as username only (lowercased)
		const username = String(identifier || '').toLowerCase();

		// Check in-memory store first. getRecent returns null when no key exists,
		// or an array (possibly empty) when the key exists.
		try {
			const stored = getRecentFromStore(appId || 'ta-portal', username, Number(limit || 5), Number(page || 0));
			if (Array.isArray(stored)) return res.json(stored);
		} catch (sErr) {
			// ignore and continue
		}

		// Attempt DB query by username if Prisma is configured
		try {
			const prisma = getPrisma();
			if (prisma && prisma.notification) {
				const items = await prisma.notification.findMany({ where: { appId, username }, orderBy: { createdAt: 'desc' }, take: Number(limit) });
				return res.json(items.map((it) => ({ id: String(it.id), title: it.title || '', message: it.body || it.message || '', timestamp: it.createdAt, channel: it.channel || 'email', read: !!it.read })));
			}
		} catch (dbErr) {
			// ignore DB errors and fall through to empty result
			console.warn('recent: db query failed (dev may be DB-less):', dbErr && dbErr.message);
		}

		// No stored items and no DB results -> return empty array (no mocking)
		return res.json([]);
	} catch (e) {
		console.error('recent route error', e && e.message);
		return res.status(500).json({ error: String(e) });
	}
});

export default router;

// Dev-only admin routes to inspect/clear the in-memory store
if (process.env.NODE_ENV !== 'production') {
	router.get('/admin/store', (req, res) => {
		try {
			return res.json({ ok: true, keys: listKeys() });
		} catch (e) {
			return res.status(500).json({ error: String(e) });
		}
	});

	router.post('/admin/store/clear', (req, res) => {
		try {
			clearAll();
			return res.json({ ok: true });
		} catch (e) {
			return res.status(500).json({ error: String(e) });
		}
	});
}

