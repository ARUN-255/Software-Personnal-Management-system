import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RequestAccessPage from './pages/RequestAccessPage';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeListPage from './pages/EmployeeListPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import OwnerPage from './pages/OwnerPage';
import AccountPage from './pages/AccountPage';
import AssistantPage from './pages/AssistantPage';
import { AttendancePage, RequestsPage, PayrollPage, DocumentsPage, ReportsPage, NotificationsPage, AuditPage } from './pages/WorkspacePage';
export default function App() {
  return <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/request-access" element={<RequestAccessPage />} />
    <Route element={<Layout role={['ADMIN', 'EMPLOYEE', 'OWNER']} />}>
      <Route path="/account" element={<AccountPage />} />
    </Route>
    <Route element={<Layout role={['ADMIN', 'EMPLOYEE']} />}>
      <Route path="/workspace" element={<Navigate to="/reports" replace />} />
      <Route path="/attendance" element={<AttendancePage />} />
      <Route path="/requests" element={<RequestsPage />} />
      <Route path="/payroll" element={<PayrollPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/assistant" element={<AssistantPage />} />
    </Route>
    <Route element={<Layout role={['ADMIN']} />}>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/employees" element={<EmployeeListPage />} />
      <Route path="/admin/employees/:id" element={<EmployeeDetailPage />} />
      <Route path="/audit" element={<AuditPage />} />
    </Route>
    <Route element={<Layout role={['EMPLOYEE']} />}>
      <Route path="/employee" element={<EmployeeDashboard />} />
      <Route path="/documents" element={<DocumentsPage />} />
    </Route>
    <Route element={<Layout role={['OWNER']} />}>
      <Route path="/owner" element={<OwnerPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
