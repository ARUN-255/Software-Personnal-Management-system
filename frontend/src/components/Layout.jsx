import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
export default function Layout({
  role
}) {
  const {
    user,
    loading
  } = useAuth();
  if (loading) return <div className="loader">Loading workspace…</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && !role.includes(user.role)) return <Navigate to={user.role === 'EMPLOYEE' ? '/employee' : user.role === 'OWNER' ? '/owner' : '/admin'} />;
  return <div className="shell">
    <Sidebar />
    <main>
      <Outlet />
    </main>
  </div>;
}
