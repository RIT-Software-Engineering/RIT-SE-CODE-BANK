import { useEffect, useState, useRef } from 'react';

// useNotifications - shared hook for notifications popup + full page
// - Replace the mock* functions with real fetch() calls to your backend
// - Expected backend endpoints (per your note):
//   GET  /api/v1/preferences/:appId/:identifier  -> { notifyEmail, notifySlack }
//   PUT  /api/v1/preferences/:appId/:identifier  -> updates and returns new prefs
//   GET  /api/v1/recent/:appId/:identifier      -> [{ id, title, message, timestamp, channel }]

const MOCK_DELAY = 350;

function mockFetchRecent(appId, identifier, limit = 5, page = 0) {
  // Simple deterministic mock data (for demo). In production, call the real API.
  return new Promise((res) => {
    setTimeout(() => {
      const now = Date.now();
      const items = Array.from({ length: Math.min(30, limit || 10) }).map((_, i) => ({
        id: `mock-${page}-${i}`,
        title: `Application Update for Student ${i + page * (limit || 10)}`,
        message: `Status changed to ${i % 3 === 0 ? 'Interview' : i % 3 === 1 ? 'Offer' : 'Rejected'}`,
        timestamp: new Date(now - (i + page * (limit || 10)) * 1000 * 60 * 15).toISOString(),
        channel: i % 2 === 0 ? 'email' : 'slack',
        read: Math.random() > 0.5,
      }));
      res(items);
    }, MOCK_DELAY);
  });
}

function mockFetchPreferences(appId, identifier) {
  return new Promise((res) => {
    setTimeout(() => {
      // attempt to persist in localStorage so toggles survive reload in dev
      try {
        const key = `prefs:${appId || 'default'}:${identifier || 'me'}`;
        const raw = globalThis.localStorage?.getItem(key);
        if (raw) return res(JSON.parse(raw));
        const prefs = { notifyEmail: true, notifySlack: true };
        res(prefs);
      } catch (e) {
        res({ notifyEmail: true, notifySlack: true });
      }
    }, MOCK_DELAY);
  });
}

function mockPutPreferences(appId, identifier, prefs) {
  return new Promise((res) => {
    setTimeout(() => {
      try {
        const key = `prefs:${appId || 'default'}:${identifier || 'me'}`;
        globalThis.localStorage?.setItem(key, JSON.stringify(prefs));
      } catch (e) {
        // ignore
      }
      res(prefs);
    }, MOCK_DELAY);
  });
}

export default function useNotifications({ appId = 'ta-portal', identifier = 'current-user' } = {}) {
  // API base for ta-portal server. In dev your server runs on 3300; the Next.js UI runs on 3000.
  // Set NEXT_PUBLIC_BACKEND_URL in your .env (e.g. https://localhost:3300) to override.
  const API_BASE = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_BACKEND_URL) || 'https://localhost:3300';
  const [recent, setRecent] = useState([]); // recent 5 for popup
  const [history, setHistory] = useState([]); // full history
  const [prefs, setPrefs] = useState({ notifyEmail: true, notifySlack: true });
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [page, setPage] = useState(0);
  const inFlightUpdate = useRef(false);

  useEffect(() => {
    // Skip API calls if no valid identifier
    if (!identifier || identifier === '__skip__') {
      return;
    }
    loadPreferences();
    // loadRecent(); // Disabled - notification history feature removed
  }, [appId, identifier]);



  async function loadPreferences() {
    setLoadingPrefs(true);
    try {
      try {
  const r = await fetch(`${API_BASE}/api/notifications/preferences/${encodeURIComponent(appId)}/${encodeURIComponent(identifier)}`);
        if (!r.ok) throw new Error(`status ${r.status}`);
        const json = await r.json();
        setPrefs(json);
      } catch (e) {
        // fallback to mock for dev/offline
        // warn to make it obvious in console when the proxy is unreachable
        // (helps distinguish CORS vs network vs server errors)
        // eslint-disable-next-line no-console
        console.warn('useNotifications: failed to load preferences from', `${API_BASE}/api/notifications/preferences/${appId}/${identifier}`, e?.message || e);
        const json = await mockFetchPreferences(appId, identifier);
        setPrefs(json);
      }
    } finally {
      setLoadingPrefs(false);
    }
  }

  async function updatePreferences(patch) {
    // optimistic update: apply locally then send PUT
    if (inFlightUpdate.current) {
      // queueing not implemented - for demo we'll ignore concurrent requests
    }
    inFlightUpdate.current = true;
  const next = { ...prefs, ...patch };
  setPrefs(next);
    try {
      try {
    // Only send toggles to the backend; contact fields are managed server-side.
    const body = { notifyEmail: !!next.notifyEmail, notifySlack: !!next.notifySlack };
    const r = await fetch(`${API_BASE}/api/notifications/preferences/${encodeURIComponent(appId)}/${encodeURIComponent(identifier)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!r.ok) throw new Error(`status ${r.status}`);
        const resp = await r.json();
        // notification-service returns { ok: true, preference: { ... } }
        const canonical = resp.preference || resp;
        setPrefs(canonical);
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('notifications:preferences:updated', { detail: { identifier, prefs: canonical } }));
          }
        } catch (err) {
          /* ignore */
        }
        return resp.preference || resp;
      } catch (e) {
        // fallback to mock and return
        // eslint-disable-next-line no-console
        console.warn('useNotifications: failed to update preferences via', `${API_BASE}/api/notifications/preferences/${appId}/${identifier}`, e?.message || e);
        const resp = await mockPutPreferences(appId, identifier, next);
        setPrefs(resp);
        try {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('notifications:preferences:updated', { detail: { identifier, prefs: resp } }));
          }
        } catch (err) {
          /* ignore */
        }
        return resp;
      }
    } catch (e) {
      // rollback on error
      await loadPreferences();
      throw e;
    } finally {
      inFlightUpdate.current = false;
    }
  }

  async function loadRecent(limit = 5) {
    setLoadingRecent(true);
    try {
      try {
  const r = await fetch(`${API_BASE}/api/notifications/recent/${encodeURIComponent(appId)}/${encodeURIComponent(identifier)}?limit=${encodeURIComponent(limit)}&page=0`);
        if (!r.ok) throw new Error(`status ${r.status}`);
        const items = await r.json();
        setRecent((items && Array.isArray(items) ? items.slice(0, limit) : []));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('useNotifications: failed to load recent from', `${API_BASE}/api/notifications/recent/${appId}/${identifier}`, e?.message || e);
        const items = await mockFetchRecent(appId, identifier, limit, 0);
        setRecent(items.slice(0, limit));
      }
    } finally {
      setLoadingRecent(false);
    }
  }

  async function loadHistory(pageToLoad = 0, pageSize = 20, filters = {}, search = '') {
    setLoadingHistory(true);
    try {
      try {
        const r = await fetch(`${API_BASE}/api/notifications/recent/${encodeURIComponent(appId)}/${encodeURIComponent(identifier)}?limit=${encodeURIComponent(pageSize)}&page=${encodeURIComponent(pageToLoad)}`);
        if (!r.ok) throw new Error(`status ${r.status}`);
        const items = await r.json();
        if (pageToLoad === 0) setHistory(items);
        else setHistory((prev) => [...prev, ...items]);
        setPage(pageToLoad);
        return items;
      } catch (e) {
        // fallback to mock for dev/offline
        // eslint-disable-next-line no-console
        console.warn('useNotifications: failed to load history from', `${API_BASE}/api/notifications/recent/${appId}/${identifier}`, e?.message || e);
        const items = await mockFetchRecent(appId, identifier, pageSize, pageToLoad);
        if (pageToLoad === 0) setHistory(items);
        else setHistory((prev) => [...prev, ...items]);
        setPage(pageToLoad);
        return items;
      }
    } finally {
      setLoadingHistory(false);
    }
  }

  return {
    recent,
    history,
    prefs,
    loadingPrefs,
    loadingRecent,
    loadingHistory,
    loadRecent,
    loadHistory,
    loadPreferences,
    updatePreferences,
    page,
  };
}
