import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
export default function LoginPage() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const {
    login
  } = useAuth();
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(form);
      navigate(user.role === 'EMPLOYEE' ? '/employee' : user.role === 'OWNER' ? '/owner' : '/admin');
    } catch (error) {
      setError(error.message);
      setBusy(false);
    }
  }
  return <div className="auth">
    <div className="auth-brand"><span className="brand-mark">B<span /></span>Bronzera Labs</div>
    <section className="authcard">
      <Link to="/" className="back"><ArrowLeft size={18} />Back to home</Link>
      <span className="eyebrow">{params.get('role') || 'WORKSPACE'} SIGN IN</span>
      <h1>Welcome back.</h1>
      <p>Sign in to your workspace.</p>
      <form onSubmit={submit}>
        {error && <div className="alert" role="alert">
          {error}
        </div>}
        <label>Username<input autoComplete="username" required value={form.username} onChange={event => setForm({
            ...form,
            username: event.target.value
          })} /></label>
        <label htmlFor="password">Password</label>
        <div className="password-field">
          <input id="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required value={form.password} onChange={event => setForm({
            ...form,
            password: event.target.value
          })} />
          <button type="button" className="icon-button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>
            {visible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <button className="btn full-width" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
          <ArrowRight size={18} />
        </button>
      </form>
      <p className="auth-help">Need login details? Contact your administrator.</p>
    </section>
    <span className="auth-byline">By Arun</span>
  </div>;
}
