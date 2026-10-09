import { useState } from 'react';
import { api } from '../api/client';
import Topbar from '../components/Topbar';
import '../styles/workspace.css';

export default function AccountPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function change(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setMessage(''); setError('');
    if (values.newPassword !== values.confirmPassword) { setError('The new passwords do not match'); return; }
    setBusy(true);
    try { await api('/auth/change-password', { method: 'POST', body: JSON.stringify(values) }); form.reset(); setMessage('Password changed successfully'); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <><Topbar title="Account security" subtitle="Keep your login details up to date." /><div className="content workspace"><section className="panel">
    <h2>Change password</h2>{message && <div className="success">{message}</div>}{error && <div className="alert">{error}</div>}
    <form className="workspace-form" onSubmit={change}>
      <label>Current password<input type="password" name="currentPassword" autoComplete="current-password" required /></label>
      <label>New password<input type="password" name="newPassword" autoComplete="new-password" minLength={12} required /></label>
      <label>Confirm new password<input type="password" name="confirmPassword" autoComplete="new-password" minLength={12} required /></label>
      <button disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
    </form><p>Use at least 12 characters. Cloud API keys belong in your backend configuration, not in this form.</p>
  </section></div></>;
}
