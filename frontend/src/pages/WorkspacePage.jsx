import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDownToLine, ArrowRight, CalendarDays, Check, Clock3, FileText, Plus, Printer, Search } from 'lucide-react';
import { api, downloadUrl, fileUrl } from '../api/client';
import { today, currentMonth, monthLabel, money, clockTime, humanStatus } from '../api/format';
import { useAuth } from '../context/AuthContext';
import { useResource } from '../hooks/useResource';
import Topbar from '../components/Topbar';
import PageState from '../components/PageState';
import Modal from '../components/Modal';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
export function MonthFilter({
  month,
  setMonth
}) {
  return <label className="month-filter">
    <CalendarDays size={18} />
    <span className="sr-only">Reporting month</span>
    <input aria-label="Reporting month" type="month" value={month} onChange={event => {
      if (event.target.value) setMonth(event.target.value);
    }} />
  </label>;
}
function EmployeePicker({
  value,
  onChange
}) {
  const [search, setSearch] = useState('');
  const result = useResource(() => api(`/admin/employees?q=${encodeURIComponent(search)}`), [search]);
  const selected = useResource(() => value ? api(`/admin/employees/${value}`) : Promise.resolve(null), [value]);
  const options = result.data?.content || [];
  const employees = selected.data && !options.some(employee => employee.id === selected.data.id) ? [selected.data, ...options] : options;
  return <div className="employee-picker">
    <label className="searchbox">
      <Search size={18} />
      <input aria-label="Search employee" placeholder="Find an employee…" value={search} onChange={event => setSearch(event.target.value)} />
    </label>
    <label>
      <span className="sr-only">Choose employee</span>
      <select aria-label="Choose employee" value={value} onChange={event => onChange(event.target.value)}>
        <option value="">Choose an employee</option>
        {employees.map(employee => <option key={employee.id} value={employee.id}>{employee.fullName} · {employee.employeeCode}</option>)}
      </select>
    </label>
    {result.error && <p className="alert" role="alert">
      {result.error}
    </p>}
  </div>;
}
function useAction(reload) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function perform(action, success) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
      setMessage(success);
      await reload();
      return true;
    } catch (error) {
      setError(error.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return {
    busy,
    message,
    error,
    perform
  };
}
function Feedback({
  error,
  message
}) {
  return <>
    {error && <div className="alert" role="alert">
      {error}
    </div>}
    {message && <div className="success" role="status">
      <Check size={18} />
      {message}
    </div>}
  </>;
}
function ResourceState({
  resource
}) {
  return <PageState loading={resource.loading} error={resource.error} retry={resource.reload} />;
}
export function AttendancePage() {
  const admin = useAuth().user.role === 'ADMIN';
  const [params] = useSearchParams();
  const [employeeId, setEmployeeId] = useState(params.get('employee') || '');
  const [month, setMonth] = useState(currentMonth());
  const [edit, setEdit] = useState(false);
  const resource = useResource(() => admin ? employeeId ? api(`/admin/employees/${employeeId}/attendance`) : Promise.resolve([]) : api('/me/attendance'), [admin, employeeId]);
  const action = useAction(resource.reload);
  const rows = (resource.data || []).filter(row => row.workDate.startsWith(month));
  const current = (resource.data || []).find(row => row.workDate === today());
  const minutes = rows.reduce((total, row) => total + (row.checkedInAt && row.checkedOutAt ? Math.max(0, (new Date(row.checkedOutAt) - new Date(row.checkedInAt)) / 60000) : 0), 0);
  async function save(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (await action.perform(() => api(`/admin/employees/${employeeId}/attendance`, {
      method: 'PUT',
      body: JSON.stringify(values)
    }), 'Attendance saved')) setEdit(false);
  }
  return <>
    <Topbar title="Attendance" subtitle={admin ? 'Review and update daily records.' : 'Your time, at a glance.'} actions={<MonthFilter month={month} setMonth={setMonth} />} />
    <div className="content">
      <Feedback {...action} />
      {admin ? <section className="panel compact">
        <EmployeePicker value={employeeId} onChange={setEmployeeId} />
      </section> : <section className="clock-card">
        <div className="clock-icon">
          <Clock3 size={28} />
        </div>
        <div>
          <span className="eyebrow">TODAY · {today()}</span>
          <h2>
            {current?.checkedOutAt ? 'Your workday is complete' : current?.checkedInAt ? 'You’re checked in' : 'Ready to start your day?'}
          </h2>
          <p>
            {current?.checkedInAt ? `In at ${clockTime(current.checkedInAt)}${current.checkedOutAt ? ` · Out at ${clockTime(current.checkedOutAt)}` : ''}` : 'Check in when you begin work.'}
          </p>
        </div>
        <div className="actions">
          <button className="btn" disabled={action.busy || resource.loading || !!current?.checkedInAt} onClick={() => action.perform(() => api('/me/check-in', {
            method: 'POST'
          }), 'Checked in successfully')}>Check in</button>
          <button className="btn secondary" disabled={action.busy || !current?.checkedInAt || !!current?.checkedOutAt} onClick={() => action.perform(() => api('/me/check-out', {
            method: 'POST'
          }), 'Checked out successfully')}>Check out</button>
        </div>
      </section>}
      {(!admin || employeeId) && <>
        <div className="stats three">
          <article>
            <span>Present days</span>
            <strong>
              {rows.filter(row => row.status === 'PRESENT').length}
            </strong>
          </article>
          <article>
            <span>Recorded days</span>
            <strong>
              {rows.length}
            </strong>
          </article>
          <article>
            <span>Hours worked</span>
            <strong>
              {(minutes / 60).toFixed(1)}
            </strong>
          </article>
        </div>
        <section className="panel">
          <div className="panelhead">
            <div>
              <h2>
                {monthLabel(month)}
              </h2>
              <p>Recorded days only · same-day shifts</p>
            </div>
            {admin ? <button className="btn secondary" onClick={() => setEdit(true)}><Plus size={18} />Add / correct record</button> : <Link className="text-link" to="/requests">Request a correction <ArrowRight size={17} /></Link>}
          </div>
          {resource.loading || resource.error ? <ResourceState resource={resource} /> : <DataTable rows={rows} columns={[{
            key: 'workDate',
            label: 'Date'
          }, {
            key: 'status',
            label: 'Status',
            render: row => <StatusBadge value={row.status} />
          }, {
            key: 'in',
            label: 'Check in',
            render: row => clockTime(row.checkedInAt)
          }, {
            key: 'out',
            label: 'Check out',
            render: row => clockTime(row.checkedOutAt)
          }, {
            key: 'remarks',
            label: 'Notes'
          }]} />}
        </section>
      </>}
      {admin && !employeeId && <PageState title="Choose an employee">Their attendance records will appear here.</PageState>}
    </div>
    {edit && <Modal title="Update attendance" onClose={() => setEdit(false)}>
      <form className="formgrid" onSubmit={save}>
        <Feedback error={action.error} />
        <label>Date<input type="date" name="workDate" max={today()} required /></label>
        <label>Status<select name="status">
            <option>PRESENT</option>
            <option>ABSENT</option>
            <option>HALF_DAY</option>
            <option>HOLIDAY</option>
          </select></label>
        <label className="wide">Notes<textarea name="remarks" maxLength={500} rows={3} /></label>
        <button className="btn wide" disabled={action.busy}>Save attendance</button>
      </form>
    </Modal>}
  </>;
}
export function RequestsPage() {
  const admin = useAuth().user.role === 'ADMIN';
  const resource = useResource(() => api('/workspace/requests'), []);
  const action = useAction(resource.reload);
  const [filter, setFilter] = useState('ALL');
  const [create, setCreate] = useState(false);
  const [review, setReview] = useState(null);
  const [kind, setKind] = useState('LEAVE');
  const requests = (resource.data || []).filter(request => filter === 'ALL' || request.status === filter);
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    values.kind = kind;
    if (kind === 'ATTENDANCE') values.endDate = values.startDate;
    if (await action.perform(() => api('/me/requests', {
      method: 'POST',
      body: JSON.stringify(values)
    }), 'Request submitted for review')) setCreate(false);
  }
  async function decide(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const approve = event.nativeEvent.submitter.value === 'approve';
    if (await action.perform(() => api(`/admin/requests/${review.id}/decision`, {
      method: 'POST',
      body: JSON.stringify({
        approve,
        comment: values.comment
      })
    }), approve ? 'Request approved' : 'Request rejected')) setReview(null);
  }
  return <>
    <Topbar title="Leave & requests" subtitle={admin ? 'Review your team’s requests.' : 'Apply for leave or correct an attendance record.'} actions={!admin && <button className="btn" onClick={() => setCreate(true)}><Plus size={19} />New request</button>} />
    <div className="content">
      <Feedback {...action} />
      <div className="filter-tabs" aria-label="Filter requests">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => <button key={status} className={filter === status ? 'active' : ''} onClick={() => setFilter(status)} aria-pressed={filter === status}>
          {humanStatus(status)}
          <span>
            {(resource.data || []).filter(r => status === 'ALL' || r.status === status).length}
          </span>
        </button>)}
      </div>
      {resource.loading || resource.error ? <ResourceState resource={resource} /> : requests.length ? <section className="request-list">
        {requests.map(request => <article className="panel request-card" key={request.id}>
          <div className="request-icon">
            <CalendarDays />
          </div>
          <div className="request-body">
            <div className="panelhead">
              <h2>
                {request.kind === 'LEAVE' ? 'Leave request' : 'Attendance correction'}
              </h2>
              <StatusBadge value={request.status} />
            </div>
            {admin && <b>
              {request.employee.fullName}
            </b>}
            <p>
              {request.startDate}
              {request.endDate !== request.startDate ? ` → ${request.endDate}` : ''}
              {request.requestedAttendanceStatus ? ` · ${humanStatus(request.requestedAttendanceStatus)}` : ''}
            </p>
            <p className="request-reason">
              {request.reason}
            </p>
            {request.reviewerComment && <div className="review-note">
              <b>Review note</b>
              <p>
                {request.reviewerComment}
              </p>
            </div>}
            {admin && request.status === 'PENDING' && <button className="btn secondary" onClick={() => setReview(request)}>Review request <ArrowRight size={17} /></button>}
          </div>
        </article>)}
      </section> : <PageState title="No requests here">
        {admin ? 'New employee requests will appear here.' : 'Use New request to apply for leave or an attendance correction.'}
      </PageState>}
    </div>
    {create && <Modal title="New request" onClose={() => setCreate(false)}>
      <form className="formgrid" onSubmit={submit}>
        <div className="wide">
          <Feedback error={action.error} />
        </div>
        <label className="wide">Request type<select value={kind} onChange={event => setKind(event.target.value)}>
            <option value="LEAVE">Leave</option>
            <option value="ATTENDANCE">Attendance correction</option>
          </select></label>
        <label>
          {kind === 'LEAVE' ? 'Start date' : 'Attendance date'}
          <input type="date" name="startDate" min={kind === 'LEAVE' ? today() : undefined} max={kind === 'ATTENDANCE' ? today() : undefined} required />
        </label>
        {kind === 'LEAVE' ? <label>End date<input type="date" name="endDate" min={today()} required /></label> : <label>Correct status<select name="requestedAttendanceStatus">
            <option>PRESENT</option>
            <option>ABSENT</option>
            <option>HALF_DAY</option>
            <option>HOLIDAY</option>
          </select></label>}
        <label className="wide">Reason<textarea name="reason" rows={4} maxLength={1000} required /></label>
        <button className="btn wide" disabled={action.busy}>Submit request</button>
      </form>
    </Modal>}
    {review && <Modal title="Review request" onClose={() => setReview(null)}>
      <p>{review.employee.fullName} · {review.startDate}</p>
      <p>
        {review.reason}
      </p>
      <form onSubmit={decide}>
        <Feedback error={action.error} />
        <label>Review comment<textarea name="comment" required maxLength={1000} rows={3} /></label>
        <div className="actions form-actions">
          <button className="btn" value="approve" disabled={action.busy}>Approve</button>
          <button className="btn danger" value="reject" disabled={action.busy}>Reject</button>
        </div>
      </form>
    </Modal>}
  </>;
}
export function PayrollPage() {
  const admin = useAuth().user.role === 'ADMIN';
  const [params] = useSearchParams();
  const [employeeId, setEmployeeId] = useState(params.get('employee') || '');
  const [create, setCreate] = useState(false);
  const resource = useResource(() => admin ? employeeId ? api(`/admin/employees/${employeeId}/payroll`) : Promise.resolve([]) : api('/me/payroll'), [admin, employeeId]);
  const action = useAction(resource.reload);
  async function save(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    values.payPeriod += '-01';
    values.publish = values.publish === 'on';
    if (await action.perform(() => api(`/admin/employees/${employeeId}/payroll`, {
      method: 'POST',
      body: JSON.stringify(values)
    }), 'Payroll saved')) setCreate(false);
  }
  return <>
    <Topbar title="Payroll" subtitle={admin ? 'Manage salary records and publish payslips.' : 'Your salary history and payslips.'} actions={admin && employeeId && <button className="btn" onClick={() => setCreate(true)}><Plus size={19} />Add / update payroll</button>} />
    <div className="content">
      <Feedback {...action} />
      {admin && <section className="panel compact">
        <EmployeePicker value={employeeId} onChange={setEmployeeId} />
      </section>}
      {admin && !employeeId ? <PageState title="Choose an employee">Their payroll history will appear here.</PageState> : resource.loading || resource.error ? <ResourceState resource={resource} /> : !resource.data.length ? <PageState title="No payslips yet">Published salary records will appear here.</PageState> : <div className="payslip-grid">
        {resource.data.map(pay => <article className="panel payslip-card" key={pay.id}>
          <div className="panelhead">
            <span className="card-icon">
              <WalletIcon />
            </span>
            <StatusBadge value={pay.status} />
          </div>
          <h2>
            {monthLabel(pay.payPeriod.slice(0, 7))}
          </h2>
          <span className="muted">Net pay</span>
          <strong className="salary-amount">
            {money(pay.netPay)}
          </strong>
          <dl className="salary-details">
            <div>
              <dt>Basic pay</dt>
              <dd>
                {money(pay.basicPay)}
              </dd>
            </div>
            <div>
              <dt>Allowances</dt>
              <dd>
                {money(pay.allowances)}
              </dd>
            </div>
            <div>
              <dt>Deductions</dt>
              <dd>− {money(pay.deductions)}</dd>
            </div>
          </dl>
          {pay.status === 'PUBLISHED' && <a className="btn secondary full-width" href={downloadUrl(`/workspace/payslips/${pay.id}.pdf`)}><ArrowDownToLine size={18} />Download PDF</a>}
        </article>)}
      </div>}
    </div>
    {create && <Modal title="Add / update payroll" onClose={() => setCreate(false)}>
      <form className="formgrid" onSubmit={save}>
        <div className="wide">
          <Feedback error={action.error} />
        </div>
        <label>Pay period<input name="payPeriod" type="month" defaultValue={currentMonth()} required /></label>
        <label>Basic pay (₹)<input name="basicPay" type="number" min="0" step="0.01" required /></label>
        <label>Allowances (₹)<input name="allowances" type="number" min="0" step="0.01" defaultValue="0" required /></label>
        <label>Deductions (₹)<input name="deductions" type="number" min="0" step="0.01" defaultValue="0" required /></label>
        <label className="checkbox-label wide"><input type="checkbox" name="publish" />Publish payslip for the employee</label>
        <p className="muted wide">Saving the same month updates its existing record.</p>
        <button className="btn wide" disabled={action.busy}>Save payroll</button>
      </form>
    </Modal>}
  </>;
}
function WalletIcon() {
  return <FileText size={22} />;
}
export function DocumentsPage() {
  const resource = useResource(() => api('/me/documents'), []);
  return <>
    <Topbar title="My documents" subtitle="Photos and certificates shared by your administrator." />
    <div className="content">
      {resource.loading || resource.error ? <ResourceState resource={resource} /> : !resource.data.length ? <PageState title="No documents yet">Contact your administrator to add a document.</PageState> : <div className="document-grid">
        {resource.data.map(document => <a key={document.id} className="panel document-card" href={fileUrl(document.id)} target="_blank" rel="noreferrer">
          <FileText size={30} />
          <h2>
            {document.title}
          </h2>
          <p>
            {humanStatus(document.documentType)}
          </p>
          <small>
            {document.originalName}
          </small>
          <span className="text-link">Open document <ArrowRight size={17} /></span>
        </a>)}
      </div>}
    </div>
  </>;
}
export function ReportsPage() {
  const admin = useAuth().user.role === 'ADMIN';
  const [month, setMonth] = useState(currentMonth());
  const resource = useResource(() => api(`/workspace/reports?month=${month}`), [month]);
  const action = useAction(resource.reload);
  const report = resource.data;
  return <>
    <Topbar title="Reports" subtitle="Monthly totals, clearly presented." actions={<MonthFilter month={month} setMonth={setMonth} />} />
    <div className="content">
      <Feedback {...action} />
      {resource.loading || resource.error ? <ResourceState resource={resource} /> : <>
        <div className="stats three">
          <article>
            <span>Recorded attendance</span>
            <strong>
              {report.recordCount}
            </strong>
            <small>
              {monthLabel(month)}
            </small>
          </article>
          <article>
            <span>Hours worked</span>
            <strong>
              {(report.workedMinutes / 60).toFixed(1)}
            </strong>
            <small>Completed clock-in sessions</small>
          </article>
          <article>
            <span>Published net pay</span>
            <strong>
              {money(report.publishedNetPay)}
            </strong>
            <small>{report.payslipCount} payslip(s)</small>
          </article>
        </div>
        <section className="panel">
          <div className="panelhead">
            <h2>Attendance breakdown</h2>
            <div className="actions no-print">
              <button className="btn secondary" onClick={() => window.print()}><Printer size={18} />Print report</button>
              {admin && <a className="btn secondary" href={downloadUrl(`/admin/reports/attendance.csv?month=${month}`)}><ArrowDownToLine size={18} />Export CSV</a>}
            </div>
          </div>
          <p className="muted">Recorded days only. Missing entries are not counted as absences.</p>
          <div className="attendance-chart">
            {Object.entries(report.attendance).map(([status, count]) => <div className="attendance-bar" key={status}>
              <span>
                {humanStatus(status)}
              </span>
              <progress value={count} max={Math.max(report.recordCount, 1)} aria-label={humanStatus(status)} />
              <b>
                {count}
              </b>
            </div>)}
          </div>
        </section>
        {admin && <section className="panel">
          <div className="panelhead">
            <h2>Missing certificates</h2>
            <span className="count-badge">
              {report.missingCertificates.length}
            </span>
          </div>
          {report.missingCertificates.length ? report.missingCertificates.map(employee => <div className="list-row" key={employee.id}>
            <span className="avatar small">
              {employee.name[0]}
            </span>
            <div className="grow">
              <b>
                {employee.name}
              </b>
              <small className="block">
                {employee.code}
              </small>
            </div>
            <button className="btn secondary" disabled={action.busy} onClick={() => action.perform(() => api(`/admin/employees/${employee.id}/certificate-reminder`, {
              method: 'POST'
            }), 'In-app reminder sent')}>Send reminder</button>
          </div>) : <p>All employees have a certificate on file.</p>}
        </section>}
      </>}
    </div>
  </>;
}
export function NotificationsPage() {
  const resource = useResource(() => api('/workspace/notifications'), []);
  const action = useAction(resource.reload);
  return <>
    <Topbar title="Notifications" subtitle="Updates that need your attention." />
    <div className="content narrow">
      <Feedback {...action} />
      {resource.loading || resource.error ? <ResourceState resource={resource} /> : !resource.data.length ? <PageState title="You’re all caught up">New updates will appear here.</PageState> : <section className="panel notification-list">
        {resource.data.map(note => <article className={`notification-row ${note.read ? 'is-read' : ''}`} key={note.id}>
          <span className="notification-dot" />
          <div className="grow">
            <p>
              {note.message}
            </p>
            <small>
              {new Date(note.createdAt).toLocaleString()}
            </small>
          </div>
          {!note.read && <button className="btn text" disabled={action.busy} onClick={() => action.perform(() => api(`/workspace/notifications/${note.id}/read`, {
            method: 'POST'
          }), 'Marked as read')}><Check size={17} />Mark read</button>}
        </article>)}
      </section>}
    </div>
  </>;
}
export function AuditPage() {
  const resource = useResource(() => api('/admin/audit'), []);
  return <>
    <Topbar title="Audit history" subtitle="The latest 100 successful changes." />
    <div className="content">
      <section className="panel">
        {resource.loading || resource.error ? <ResourceState resource={resource} /> : <DataTable rows={resource.data} columns={[{
          key: 'timestamp',
          label: 'When',
          render: row => new Date(row.timestamp).toLocaleString()
        }, {
          key: 'actor',
          label: 'Who',
          render: row => row.actor?.username || 'System'
        }, {
          key: 'action',
          label: 'Action'
        }, {
          key: 'targetId',
          label: 'Location'
        }]} />}
      </section>
    </div>
  </>;
}
