import { LayoutDashboard, Users, ShieldCheck, LogOut } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function Sidebar() {
  const {
      user,
      logout
    } = useAuth(),
    nav = useNavigate();
  let links = user?.role === 'EMPLOYEE' ? [['/employee', 'My dashboard', LayoutDashboard]] : user?.role === 'OWNER' ? [['/owner', 'Access requests', ShieldCheck]] : [['/admin', 'Dashboard', LayoutDashboard], ['/admin/employees', 'Employees', Users]];
  if (user?.role !== 'OWNER') links.push(['/workspace', 'People workspace', LayoutDashboard]);
  links.push(['/account', 'Account security', ShieldCheck]);
  return <aside className="side">
    <div className="brand">
      <b>Bronzera Labs</b>
      <small>By Arun</small>
    </div>
    <nav>
      {links.map(([to, t, I]) => <NavLink key={to} end to={to}><I /> {t}</NavLink>)}
    </nav>
    <div className="sidefoot">
      <span>
        {user?.username}
      </span>
      <small>
        {user?.role}
      </small>
      <button onClick={async () => {
        await logout();
        nav('/');
      }}><LogOut /> Sign out</button>
    </div>
  </aside>;
}
