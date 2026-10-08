import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RequestAccessPage from './pages/RequestAccessPage';
import Layout from './components/Layout';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeListPage from './pages/EmployeeListPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import OwnerPage from './pages/OwnerPage';
export default function App() {
  return <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/request-access" element={<RequestAccessPage />} />
    <Route element={<Layout role={['ADMIN']} />}>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/employees" element={<EmployeeListPage />} />
      <Route path="/admin/employees/:id" element={<EmployeeDetailPage />} />
    </Route>
    <Route element={<Layout role={['EMPLOYEE']} />}>
      <Route path="/employee" element={<EmployeeDashboard />} />
    </Route>
    <Route element={<Layout role={['OWNER']} />}>
      <Route path="/owner" element={<OwnerPage />} />
    </Route>
  </Routes>;
}
