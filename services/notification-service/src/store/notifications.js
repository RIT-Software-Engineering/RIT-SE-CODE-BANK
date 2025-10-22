// Simple in-memory notifications store for development usage.
// Stored as Map<key, Array<notification>> where key === `${appId}:${identifier}`
const store = new Map();

function buildKey(appId, identifier) {
  return `${appId}:${String(identifier || '').toLowerCase()}`;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function addNotification(appId, identifier, notif) {
  if (!appId || !identifier) return;
  const key = buildKey(appId, identifier);
  const list = store.get(key) || [];
  const entry = { id: notif.id || makeId(), title: notif.title || '', message: notif.message || '', timestamp: notif.timestamp || new Date().toISOString(), channel: notif.channel || 'email', read: !!notif.read };
  list.unshift(entry);
  // keep sane cap
  store.set(key, list.slice(0, 200));
}

function getRecent(appId, identifier, limit = 5, page = 0) {
  if (!appId || !identifier) return null;
  const key = buildKey(appId, identifier);
  const list = store.get(key);
  // If the key does not exist at all, return null so callers can decide to
  // fall back to DB or mocks. If the list exists but the requested page is
  // beyond its length, return an empty array (honor pagination semantics).
  if (!list) return null;
  const start = page * limit;
  return list.slice(start, start + limit);
}

function clearAll() {
  store.clear();
}

function listKeys() {
  return Array.from(store.keys());
}

export { addNotification, getRecent, clearAll, listKeys };
