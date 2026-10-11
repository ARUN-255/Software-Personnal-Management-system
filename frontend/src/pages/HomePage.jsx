import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, UserRound, Check, CalendarDays, Bot, Users } from 'lucide-react';
export default function HomePage() {
  return <div className="landing">
    <header className="public-header">
      <Link to="/" className="wordmark">Bronzera<span className="wordmark-light">Labs</span></Link>
      <Link className="btn secondary" to="/login">Sign in <ArrowRight size={17} /></Link>
    </header>
    <main className="landing-main">
      <div className="landing-copy">
        <span className="eyebrow">PEOPLE. WORK. SIMPLIFIED.</span>
        <h1>A better place<br />to manage<br /><em>your workday.</em></h1>
        <p>One simple workspace for employee details, attendance and AI assistance.</p>
        <div className="landing-proof">
          <span><Check size={17} />Simple to use</span>
          <span><Check size={17} />Built for your team</span>
        </div>
        <small>Bronzera Labs · By Arun</small>
      </div>
      <section className="entry-panel">
        <span className="eyebrow">LET’S GET STARTED</span>
        <h2>Your workspace awaits.</h2>
        <p>Choose how you’d like to sign in.</p>
        <Link className="role-card" to="/login?role=employee">
          <span className="card-icon">
            <UserRound />
          </span>
          <div>
            <h3>Employee</h3>
            <p>My profile, attendance and AI assistant</p>
          </div>
          <ArrowRight />
        </Link>
        <Link className="role-card" to="/login?role=admin">
          <span className="card-icon">
            <ShieldCheck />
          </span>
          <div>
            <h3>Administrator</h3>
            <p>Manage people and team records</p>
          </div>
          <ArrowRight />
        </Link>
        <div className="entry-bottom">
          <Link to="/request-access">Request admin access</Link>
          <Link to="/login?role=owner">Owner sign in</Link>
        </div>
      </section>
    </main>
    <footer className="landing-footer">
      <span><Users size={18} />People management</span>
      <span><CalendarDays size={18} />Attendance tracking</span>
      <span><Bot size={18} />Bilingual AI assistant</span>
    </footer>
  </div>;
}
