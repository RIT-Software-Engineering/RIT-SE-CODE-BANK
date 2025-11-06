import { useState } from 'react';

const API = import.meta?.env?.VITE_API_BASE ?? 'http://localhost:5000';

export default function DevLogin() {
  const [id, setId] = useState('faculty@rit.edu'); // uid or email
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      // send uid OR email + password (server accepts either)
      const body = id.includes('@') ? { email: id, password } : { uid: id, password };

      const resp = await fetch(`${API}/dev/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const data = await safeJson(resp);
        throw new Error(data?.error || `Login failed (${resp.status})`);
      }

      // Option A: use response to route immediately
      // const { me } = await resp.json();

      // Option B (safer): read canonical claims from /api/me
      const meResp = await fetch(`${API}/api/me`, { credentials: 'include' });
      const { me } = meResp.ok ? await meResp.json() : { me: null };
      const next = pickLanding(me);
      window.location.assign(next);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '4rem auto', fontFamily: 'system-ui' }}>
      <h1>Temporary Login</h1>
      <p style={{ opacity: .7, marginTop: 4 }}>
        Dev-only screen (prod will use Shibboleth SSO). Enter a test user’s <b>UID or Email</b> and password from <code>dev-users.json</code>.
      </p>

      <form onSubmit={onSubmit}>
        <label>UID or Email</label>
        <input
          value={id}
          onChange={e => setId(e.target.value)}
          required
          autoComplete="username"
          style={{ width: '100%', margin: '6px 0' }}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          style={{ width: '100%', margin: '6px 0' }}
        />

        <button type="submit" disabled={busy} style={{ marginTop: 12 }}>
          {busy ? 'Signing in…' : 'Login'}
        </button>

        {err && <div style={{ color: 'crimson', marginTop: 8 }}>{err}</div>}
      </form>
    </div>
  );
}

function pickLanding(me) {
  const affs = (me?.affiliations || []).map(String);
  if (affs.includes('Faculty')) return '/professor';
  if (affs.includes('TA'))      return '/ta';
  if (affs.includes('Student')) return '/student';
  if (affs.includes('Employee'))return '/staff';
  return '/';
}

async function safeJson(resp) {
  try { return await resp.json(); } catch { return null; }
}

