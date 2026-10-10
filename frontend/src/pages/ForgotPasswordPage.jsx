import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
export default function ForgotPasswordPage() {
  const {
    tamil
  } = useLanguage();
  const [step, setStep] = useState('request');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function requestCode(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api('/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({
          username,
          email
        })
      });
      setMessage(result.message);
      setStep('confirm');
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function confirm(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (values.newPassword !== values.confirmPassword) {
      setError(tamil ? 'புதிய கடவுச்சொற்கள் பொருந்தவில்லை' : 'The new passwords do not match');
      setBusy(false);
      return;
    }
    try {
      await api('/auth/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({
          username,
          code: values.code,
          newPassword: values.newPassword
        })
      });
      navigate('/login', {
        replace: true
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return <div className="auth">
    <div className="auth-brand">Bronzera Labs</div>
    <section className="authcard">
      <Link to="/login" className="back">
        <ArrowLeft size={18} />
        {tamil ? 'உள்நுழைவுக்குத் திரும்பு' : 'Back to sign in'}
      </Link>
      <span className="eyebrow">
        {tamil ? 'கணக்கு மீட்பு' : 'ACCOUNT RECOVERY'}
      </span>
      <h1>
        {tamil ? 'கடவுச்சொல்லை மீட்டமைக்கவும்.' : 'Reset your password.'}
      </h1>
      <p>
        {step === 'request' ? tamil ? 'உங்கள் பயனர்பெயரும் பதிவு செய்யப்பட்ட மின்னஞ்சலும் உள்ளிடவும்.' : 'Enter your username and registered email.' : tamil ? 'மின்னஞ்சலில் வந்த 6 இலக்கக் குறியீட்டை உள்ளிடவும்.' : 'Enter the six-digit code sent to your email.'}
      </p>
      {message && <div className="success" role="status">
        {message}
      </div>}
      {error && <div className="alert" role="alert">
        {error}
      </div>}
      {step === 'request' ? <form onSubmit={requestCode}>
        <label>
          {tamil ? 'பயனர்பெயர்' : 'Username'}
          <input value={username} onChange={event => setUsername(event.target.value)} required />
        </label>
        <label>
          {tamil ? 'மின்னஞ்சல்' : 'Email'}
          <input type="email" value={email} onChange={event => setEmail(event.target.value)} required />
        </label>
        <button className="btn full-width" disabled={busy}>
          {busy ? '…' : tamil ? 'குறியீட்டை அனுப்பு' : 'Send reset code'}
        </button>
      </form> : <form onSubmit={confirm}>
        <label>
          {tamil ? '6 இலக்கக் குறியீடு' : 'Six-digit code'}
          <input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required />
        </label>
        <label>
          {tamil ? 'புதிய கடவுச்சொல்' : 'New password'}
          <input name="newPassword" type="password" minLength={12} required />
        </label>
        <label>
          {tamil ? 'புதிய கடவுச்சொல்லை உறுதிப்படுத்து' : 'Confirm new password'}
          <input name="confirmPassword" type="password" minLength={12} required />
        </label>
        <button className="btn full-width" disabled={busy}>
          {busy ? '…' : tamil ? 'கடவுச்சொல்லை மாற்று' : 'Reset password'}
        </button>
      </form>}
    </section>
  </div>;
}
