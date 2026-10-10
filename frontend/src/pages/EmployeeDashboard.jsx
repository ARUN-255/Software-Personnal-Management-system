import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Clock3, FolderOpen, Wallet, Sparkles } from 'lucide-react';
import { api, fileUrl } from '../api/client';
import { currentMonth, money, today, clockTime } from '../api/format';
import { useResource } from '../hooks/useResource';
import Topbar from '../components/Topbar';
import PageState from '../components/PageState';
import StatusBadge from '../components/StatusBadge';
export default function EmployeeDashboard() {
  const resource = useResource(async () => {
    const [employee, report, requests, attendance, documents] = await Promise.all([api('/me'), api(`/workspace/reports?month=${currentMonth()}`), api('/workspace/requests'), api('/me/attendance'), api('/me/documents')]);
    return {
      employee,
      report,
      requests,
      attendance,
      documents
    };
  }, []);
  const data = resource.data;
  const current = data?.attendance.find(row => row.workDate === today());
  return <>
    <Topbar title="My dashboard" subtitle="Everything you need for your workday." />
    <div className="content">
      {resource.loading || resource.error ? <PageState {...resource} retry={resource.reload} /> : <>
        <section className="panel profile">
          <span className="avatar large">
            {data.employee.photoPath ? <img src={fileUrl(data.employee.photoPath)} alt={`${data.employee.fullName} profile`} /> : data.employee.fullName[0]}
          </span>
          <div className="grow">
            <span className="eyebrow">WELCOME BACK</span>
            <h2>
              {data.employee.fullName}
            </h2>
            <p>{data.employee.designation?.title} · {data.employee.department?.name}</p>
            <span className="muted">
              {data.employee.employeeCode}
            </span>
          </div>
          <StatusBadge value={data.employee.employmentStatus} />
        </section>
        <div className="stats three">
          <article>
            <span className="stat-label"><CalendarCheck size={19} />Days present</span>
            <strong>
              {data.report.attendance.PRESENT}
            </strong>
            <Link to="/attendance">View attendance <ArrowRight size={15} /></Link>
          </article>
          <article>
            <span className="stat-label"><Wallet size={19} />Published net pay</span>
            <strong>
              {money(data.report.publishedNetPay)}
            </strong>
            <Link to="/payroll">View payslips <ArrowRight size={15} /></Link>
          </article>
          <article>
            <span className="stat-label"><FolderOpen size={19} />My documents</span>
            <strong>
              {data.documents.length}
            </strong>
            <Link to="/documents">Open documents <ArrowRight size={15} /></Link>
          </article>
        </div>
        <div className="dashboard-grid">
          <section className="panel">
            <div className="panelhead">
              <h2>Your workday</h2>
              <Clock3 size={22} />
            </div>
            <p className="workday-status">
              {current?.checkedOutAt ? 'Finished for today' : current?.checkedInAt ? 'You’re checked in' : 'Not checked in yet'}
            </p>
            <p>
              {current?.checkedInAt ? `Check in ${clockTime(current.checkedInAt)} · Check out ${clockTime(current.checkedOutAt)}` : 'Start your day from the Attendance page.'}
            </p>
            <Link className="btn" to="/attendance">Open attendance <ArrowRight size={18} /></Link>
          </section>
          <section className="panel">
            <div className="panelhead">
              <h2>My requests</h2>
              <Link className="text-link" to="/requests">View all <ArrowRight size={17} /></Link>
            </div>
            {data.requests.length ? data.requests.slice(0, 3).map(request => <div className="list-row" key={request.id}>
              <div className="grow">
                <b>
                  {request.kind === 'LEAVE' ? 'Leave' : 'Attendance correction'}
                </b>
                <small className="block">
                  {request.startDate}
                </small>
              </div>
              <StatusBadge value={request.status} />
            </div>) : <p>No requests yet.</p>}
            <Link className="btn secondary" to="/requests">New request</Link>
          </section>
        </div>
        <Link to="/assistant" className="assistant-banner">
          <span className="assistant-emblem">
            <Sparkles />
          </span>
          <div>
            <h2>A little help, whenever you need it.</h2>
            <p>Get a clear explanation of your attendance or payslip.</p>
          </div>
          <ArrowRight />
        </Link>
        <section className="panel">
          <h2>My details</h2>
          <dl className="detail-grid">
            <div>
              <dt>Email</dt>
              <dd>
                {data.employee.email || 'Not provided'}
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                {data.employee.phone || 'Not provided'}
              </dd>
            </div>
            <div>
              <dt>Joined</dt>
              <dd>
                {data.employee.joiningDate || 'Not provided'}
              </dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>
                {data.employee.address || 'Not provided'}
              </dd>
            </div>
          </dl>
        </section>
      </>}
    </div>
  </>;
}
