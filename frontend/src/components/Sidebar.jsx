import { LayoutDashboard, Users, CalendarDays, CalendarCheck, Wallet, FolderOpen, MessageSquare, Bell, ChartNoAxesCombined, ShieldCheck, Settings, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
export default function Sidebar({
  onNavigate
}) {
  const {
    user,
    logout
  } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const {
    tamil
  } = useLanguage();
  const admin = user.role === 'ADMIN';
  const owner = user.role === 'OWNER';
  const labels = tamil ? {
    access: 'அணுகல் கோரிக்கைகள்',
    dashboard: 'முகப்பு',
    employees: 'ஊழியர்கள்',
    attendance: 'வருகைப் பதிவு',
    requests: 'விடுப்பு & கோரிக்கைகள்',
    payroll: 'சம்பளம்',
    documents: 'எனது ஆவணங்கள்',
    reports: 'அறிக்கைகள்',
    assistant: 'AI உதவியாளர்'
  } : {
    access: 'Access requests',
    dashboard: 'Dashboard',
    employees: 'Employees',
    attendance: 'Attendance',
    requests: 'Leave & requests',
    payroll: 'Payroll',
    documents: 'My documents',
    reports: 'Reports',
    assistant: 'AI assistant'
  };
  const links = owner ? [['/owner', labels.access, ShieldCheck]] : [[admin ? '/admin' : '/employee', labels.dashboard, LayoutDashboard], ...(admin ? [['/admin/employees', labels.employees, Users]] : []), ['/attendance', labels.attendance, CalendarDays], ['/requests', labels.requests, CalendarCheck], ['/payroll', labels.payroll, Wallet], ...(!admin ? [['/documents', labels.documents, FolderOpen]] : []), ['/reports', labels.reports, ChartNoAxesCombined], ['/assistant', labels.assistant, MessageSquare]];
  async function signOut() {
    setBusy(true);
    try {
      await logout();
      navigate('/');
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  return <aside className="sidebar">
    <div className="sidebar-label">
      {tamil ? 'உங்கள் பணியிடம்' : 'YOUR WORKSPACE'}
    </div>
    <nav aria-label="Main navigation">
      {links.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/admin' || to === '/employee'} onClick={onNavigate}>
        <Icon size={20} />
        <span>
          {label}
        </span>
        {to === '/assistant' && <span className="tiny-badge" aria-hidden="true">AI</span>}
      </NavLink>)}
    </nav>
    <div className="sidebar-bottom">
      <nav aria-label="Account navigation">
        {!owner && <NavLink to="/notifications" onClick={onNavigate}>
          <Bell size={20} />
          {tamil ? 'அறிவிப்புகள்' : 'Notifications'}
        </NavLink>}
        {admin && <NavLink to="/audit" onClick={onNavigate}>
          <ShieldCheck size={20} />
          {tamil ? 'தணிக்கை வரலாறு' : 'Audit history'}
        </NavLink>}
        <NavLink to="/account" onClick={onNavigate}>
          <Settings size={20} />
          {tamil ? 'கணக்கு அமைப்புகள்' : 'Account settings'}
        </NavLink>
      </nav>
      {error && <p className="alert" role="alert">
        {error}
      </p>}
      <div className="sidebar-user">
        <span className="user-initial">
          {user.username[0].toUpperCase()}
        </span>
        <div>
          <b>
            {user.username}
          </b>
          <small>
            {user.role === 'ADMIN' ? 'Administrator' : user.role === 'OWNER' ? 'Owner' : 'Employee'}
          </small>
        </div>
        <button className="icon-button" aria-label="Sign out" title="Sign out" disabled={busy} onClick={signOut}>
          <LogOut size={19} />
        </button>
      </div>
      <span className="byline">Bronzera Labs · By Arun</span>
    </div>
  </aside>;
}
