import { useState } from 'react';
import { api } from '../api/client';

/** Lets the signed-in admin change their login password. */
export default function ChangePasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    if (next.length < 6) {
      setErr('New password must be at least 6 characters.');
      return;
    }
    if (next !== confirm) {
      setErr('New password and confirmation do not match.');
      return;
    }
    setBusy(true);
    try {
      await api.patch('/auth/password', { currentPassword: current, newPassword: next });
      setMsg('Password changed successfully.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (e: any) {
      const m = e?.response?.data?.message;
      setErr(Array.isArray(m) ? m.join(', ') : m || 'Could not change password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2>Change Password</h2>
      <p className="muted">Update the password used to sign in.</p>
      <div className="card" style={{ maxWidth: 360 }}>
        <form onSubmit={submit}>
          <label>Current password</label>
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
          <label>New password</label>
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
          />
          <label>Confirm new password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {err && <div className="error">{err}</div>}
          {msg && (
            <div style={{ color: 'var(--good)', fontSize: 13, marginTop: 10 }}>{msg}</div>
          )}
          <div style={{ marginTop: 16 }}>
            <button type="submit" disabled={busy}>
              {busy ? 'Saving...' : 'Change password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
