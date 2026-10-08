import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import FormField from '../components/FormField';
import Button from '../components/Button';
export default function RequestAccessPage() {
  const [f, setF] = useState({
      fullName: '',
      email: '',
      reason: ''
    }),
    [done, setDone] = useState(false),
    [err, setErr] = useState('');
  async function go(e) {
    e.preventDefault();
    try {
      await api('/admin-access-requests', {
        method: 'POST',
        body: JSON.stringify(f)
      });
      setDone(true);
    } catch (e) {
      setErr(e.message);
    }
  }
  return <div className="auth">
    <form className="authcard" onSubmit={go}>
      <Link to="/" className="back">← Home</Link>
      <span className="eyebrow">ADMIN ACCESS</span>
      <h1>Send a request</h1>
      {done ? <div className="success">Request submitted. The system owner will review it.</div> : <>
        {err && <div className="alert">
          {err}
        </div>}
        <FormField label="Full name" value={f.fullName} onChange={e => setF({
          ...f,
          fullName: e.target.value
        })} />
        <FormField label="Email" type="email" value={f.email} onChange={e => setF({
          ...f,
          email: e.target.value
        })} />
        <FormField label="Reason">
          <textarea rows="4" value={f.reason} onChange={e => setF({
            ...f,
            reason: e.target.value
          })} />
        </FormField>
        <Button>Submit request</Button>
      </>}
    </form>
  </div>;
}
