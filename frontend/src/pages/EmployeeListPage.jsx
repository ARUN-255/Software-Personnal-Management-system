import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, fileUrl } from '../api/client';
import { useResource } from '../hooks/useResource';
import Topbar from '../components/Topbar';
import PageState from '../components/PageState';
import EmployeeForm from './EmployeeForm';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
export default function EmployeeListPage() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [add, setAdd] = useState(params.get('new') === '1');
  const resource = useResource(() => api(`/admin/employees?q=${encodeURIComponent(query)}&page=${page}`), [query, page]);
  function close() {
    setAdd(false);
    setParams({}, {
      replace: true
    });
  }
  const columns = [{
    key: 'fullName',
    label: 'Employee',
    render: employee => <Link className="employee-cell" to={`/admin/employees/${employee.id}`}>
    <span className="avatar">
      {employee.photoPath ? <img src={fileUrl(employee.photoPath)} alt="" /> : employee.fullName[0]}
    </span>
    <span>
      <b>
        {employee.fullName}
      </b>
      <small>
        {employee.employeeCode}
      </small>
    </span>
  </Link>
  }, {
    key: 'department',
    label: 'Department',
    render: employee => employee.department?.name || '—'
  }, {
    key: 'designation',
    label: 'Role',
    render: employee => employee.designation?.title || '—'
  }, {
    key: 'status',
    label: 'Status',
    render: employee => <StatusBadge value={employee.employmentStatus} />
  }, {
    key: 'open',
    label: '',
    render: employee => <Link className="text-link" to={`/admin/employees/${employee.id}`} aria-label={`Open ${employee.fullName} profile`}>View profile <ArrowRight size={17} /></Link>
  }];
  return <>
    <Topbar title="Employees" subtitle="Your people, all in one place." actions={<button className="btn" onClick={() => setAdd(true)}><Plus size={19} />Add employee</button>} />
    <div className="content">
      <section className="panel directory-panel">
        <div className="directory-toolbar">
          <label className="searchbox">
            <Search size={20} />
            <input aria-label="Search employees" placeholder="Search name or employee code…" value={query} onChange={event => {
              setQuery(event.target.value);
              setPage(0);
            }} />
          </label>
          <span className="muted">{resource.data?.totalElements ?? '—'} employees</span>
        </div>
        {resource.loading || resource.error ? <PageState {...resource} retry={resource.reload} /> : <>
          <DataTable rows={resource.data.content} columns={columns} />
          <div className="pagination">
            <span>Page {page + 1} of {Math.max(resource.data.totalPages, 1)}</span>
            <div className="actions">
              <button className="btn secondary" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={18} />Previous</button>
              <button className="btn secondary" disabled={page + 1 >= resource.data.totalPages} onClick={() => setPage(page + 1)}>Next<ChevronRight size={18} /></button>
            </div>
          </div>
        </>}
      </section>
    </div>
    {add && <Modal title="Add employee" onClose={close}>
      <EmployeeForm onSaved={() => {
        close();
        resource.reload();
      }} />
    </Modal>}
  </>;
}
