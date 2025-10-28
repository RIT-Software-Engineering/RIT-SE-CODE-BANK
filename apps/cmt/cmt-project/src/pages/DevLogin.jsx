import { useState } from 'react';

export default function DevLogin() {
  const [email, setEmail] = useState('');
  const [role, setRole]   = useState('student'); // professor | ta | student | admin
  const [err, setErr]     = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    try {
      const resp = await fetch('http://localhost:5000/dev/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, role })
      });
      if (!resp.ok) throw new Error('Login failed');
      // After login, decide where to send them based on role
      const next = roleRouteMap[role] || '/app';
      window.location.assign(next);
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div style={{maxWidth: 420, margin: '4rem auto', fontFamily: 'system-ui'}}>
      <h1>Temporary Login</h1>
      <p style={{opacity:.7}}>Dev-only screen (will be replaced by Shibboleth in production).</p>
      <form onSubmit={onSubmit}>
        <label>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} required style={{width:'100%',margin:'6px 0'}} />
        <label>Role</label>
        <select value={role} onChange={e=>setRole(e.target.value)} style={{width:'100%',margin:'6px 0'}}>
          <option value="student">Student</option>
          <option value="ta">TA</option>
          <option value="professor">Professor</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" style={{marginTop:12}}>Login</button>
        {err && <div style={{color:'crimson', marginTop:8}}>{err}</div>}
      </form>
    </div>
  );
}

const roleRouteMap = {
  student: '/student',
  ta: '/ta',
  professor: '/professor',
  admin: '/admin'
};
