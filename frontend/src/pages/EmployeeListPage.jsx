import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fileUrl } from '../api/client';
import Topbar from '../components/Topbar';
import Button from '../components/Button';
import EmployeeForm from './EmployeeForm';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
export default function EmployeeListPage() {
  const [rows, setRows] = useState([]),
    [q, setQ] = useState(''),
    [add, setAdd] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api('/admin/employees?q=' + encodeURIComponent(q));
      setRows(Array.isArray(result?.content) ? result.content : []);
    } catch (e) {
      setRows([]);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [q]);
  useEffect(() => {
    load();
  }, [load]);
  const columns = [{
    key: 'photo',
    label: 'Photo',
    render: x => <div className="avatar list-photo">
    {x.photoPath ? <img src={fileUrl(x.photoPath)} alt={x.fullName} /> : x.fullName?.[0] || '?'}
  </div>
  }, {
    key: 'fullName',
    label: 'Employee',
    render: x => <Link to={`/admin/employees/${x.id}`}>
    <b>
      {x.fullName || 'Unnamed employee'}
    </b>
    <small className="block">{x.employeeCode || '—'} · {x.email || 'No email'}</small>
  </Link>
  }, {
    key: 'department',
    label: 'Department',
    render: x => x.department?.name || '—'
  }, {
    key: 'designation',
    label: 'Designation',
    render: x => x.designation?.title || '—'
  }, {
    key: 'employmentStatus',
    label: 'Status',
    render: x => <StatusBadge value={x.employmentStatus || 'UNKNOWN'} />
  }, {
    key: 'manage',
    label: 'Manage',
    render: x => <Link className="btn secondary" to={`/admin/employees/${x.id}`}>Open profile</Link>
  }];
  return <>
    <Topbar title="Employees" subtitle="Create accounts and manage personnel records." actions={<Button onClick={() => setAdd(true)}>+ Add employee</Button>} />
    <div className="content">
      <input className="search" placeholder="Search by name or employee code" value={q} onChange={e => setQ(e.target.value)} />
      {error && <div className="alert">
        {error}
      </div>}
      <section className="panel">
        {loading ? <div className="empty">Loading employees…</div> : <DataTable rows={rows} columns={columns} />}
      </section>
    </div>
    {add && <Modal title="Add employee" onClose={() => setAdd(false)}>
      <EmployeeForm onSaved={() => {
        setAdd(false);
        load();
      }} />
    </Modal>}
  </>;
}
