import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { Bell, Menu, X, ChevronRight } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
export default function Layout({
  role
}) {
  const {
    user,
    loading
  } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const main = useRef(null);
  const menu = useRef(null);
  const drawer = useRef(null);
  useEffect(() => {
    setOpen(false);
    main.current?.scrollTo(0, 0);
    main.current?.focus({
      preventScroll: true
    });
  }, [location.pathname]);
  useEffect(() => {
    const dialog = drawer.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  if (loading) return <div className="loader" role="status">Opening your workspace…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && !role.includes(user.role)) {
    return <Navigate to={user.role === 'EMPLOYEE' ? '/employee' : user.role === 'OWNER' ? '/owner' : '/admin'} replace />;
  }
  const dashboard = user.role === 'EMPLOYEE' ? '/employee' : user.role === 'OWNER' ? '/owner' : '/admin';
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="app-header">
      <button ref={menu} className="icon-button mobile-menu" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}>
        <Menu />
      </button>
      <Link to={dashboard} className="wordmark"><span className="brand-mark">B<span /></span>Bronzera<span className="wordmark-light">Labs</span></Link>
      <span className="header-divider" />
      <span className="header-workspace">Workspace</span>
      <div className="header-right">
        {user.role !== 'OWNER' && <Link className="icon-button" to="/notifications" aria-label="Notifications">
          <Bell size={21} />
        </Link>}
        <Link to="/account" className="header-account">
          <span className="user-initial">
            {user.username.slice(0, 1).toUpperCase()}
          </span>
          <span className="header-name">
            {user.username}
          </span>
          <ChevronRight size={16} />
        </Link>
      </div>
    </header>
    <div className="app-body">
      <div className="desktop-sidebar">
        <Sidebar />
      </div>
      <main id="main-content" className={`main-content ${location.pathname === '/assistant' ? 'chat-main' : ''}`} ref={main} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
    <dialog ref={drawer} className="navigation-dialog" onCancel={() => setOpen(false)} onClose={() => {
      setOpen(false);
      menu.current?.focus();
    }} onClick={e => {
      if (e.target === e.currentTarget) setOpen(false);
    }}>
      <div className="drawer-heading">
        <b>Navigation</b>
        <button className="icon-button" aria-label="Close navigation" onClick={() => setOpen(false)}>
          <X />
        </button>
      </div>
      <Sidebar onNavigate={() => setOpen(false)} />
    </dialog>
  </div>;
}
