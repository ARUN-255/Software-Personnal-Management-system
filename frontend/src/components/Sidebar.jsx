import { LayoutDashboard, Users, CalendarDays, CalendarCheck, Wallet, FolderOpen, MessageSquare, Bell, ChartNoAxesCombined, ShieldCheck, Settings, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
  const admin = user.role === 'ADMIN';
  const owner = user.role === 'OWNER';
  const links = owner ? [['/owner', 'Access requests', ShieldCheck]] : [[admin ? '/admin' : '/employee', 'Dashboard', LayoutDashboard], ...(admin ? [['/admin/employees', 'Employees', Users]] : []), ['/attendance', 'Attendance', CalendarDays], ['/requests', 'Leave & requests', CalendarCheck], ['/payroll', 'Payroll', Wallet], ...(!admin ? [['/documents', 'My documents', FolderOpen]] : []), ['/reports', 'Reports', ChartNoAxesCombined], ['/assistant', 'AI assistant', MessageSquare]];
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
    <div className="sidebar-label">YOUR WORKSPACE</div>
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
        {!owner && <NavLink to="/notifications" onClick={onNavigate}><Bell size={20} />Notifications</NavLink>}
        {admin && <NavLink to="/audit" onClick={onNavigate}><ShieldCheck size={20} />Audit history</NavLink>}
        <NavLink to="/account" onClick={onNavigate}><Settings size={20} />Account settings</NavLink>
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
