import { Link } from 'react-router-dom';
import { ArrowRight, Users, CalendarCheck, Wallet, Building2, Plus, Sparkles } from 'lucide-react';
import { api, fileUrl } from '../api/client';
import { currentMonth, money, monthLabel, humanStatus } from '../api/format';
import { useResource } from '../hooks/useResource';
import Topbar from '../components/Topbar';
import PageState from '../components/PageState';
export default function AdminDashboard() {
  const month = currentMonth();
  const resource = useResource(async () => {
    const [people, departments, report, requests] = await Promise.all([api('/admin/employees'), api('/admin/departments'), api(`/workspace/reports?month=${month}`), api('/workspace/requests')]);
    return {
      people,
      departments,
      report,
      pending: requests.filter(request => request.status === 'PENDING')
    };
  }, [month]);
  const data = resource.data;
  return <>
    <Topbar title="Dashboard" subtitle="A clear view of your people and priorities." actions={<Link className="btn" to="/admin/employees?new=1"><Plus size={19} />Add employee</Link>} />
    <div className="content">
      {resource.loading || resource.error ? <PageState {...resource} retry={resource.reload} /> : <>
        <div className="overview-intro">
          <div>
            <span className="eyebrow">TEAM OVERVIEW</span>
            <h2>Good to see you.</h2>
            <p>Here’s what’s happening at Bronzera Labs.</p>
          </div>
          <span className="date-pill">
            {monthLabel(month)}
          </span>
        </div>
        <div className="stats">
          <article>
            <span className="stat-label"><Users size={19} />Employees</span>
            <strong>
              {data.people.totalElements}
            </strong>
            <Link to="/admin/employees">View directory <ArrowRight size={15} /></Link>
          </article>
          <article>
            <span className="stat-label"><CalendarCheck size={19} />Pending requests</span>
            <strong>
              {data.pending.length}
            </strong>
            <Link to="/requests">Review requests <ArrowRight size={15} /></Link>
          </article>
          <article>
            <span className="stat-label"><Wallet size={19} />Published payroll</span>
            <strong>
              {money(data.report.publishedNetPay)}
            </strong>
            <Link to="/payroll">Manage payroll <ArrowRight size={15} /></Link>
          </article>
          <article>
            <span className="stat-label"><Building2 size={19} />Departments</span>
            <strong>
              {data.departments.length}
            </strong>
            <span className="muted">Across your organisation</span>
          </article>
        </div>
        <div className="dashboard-grid">
          <section className="panel">
            <div className="panelhead">
              <h2>Attendance overview</h2>
              <Link className="text-link" to="/reports">View report <ArrowRight size={17} /></Link>
            </div>
            <p className="muted">{monthLabel(month)} · {data.report.recordCount} recorded days</p>
            <div className="attendance-chart">
              {Object.entries(data.report.attendance).map(([status, count]) => <div className="attendance-bar" key={status}>
                <span>
                  {humanStatus(status)}
                </span>
                <progress aria-label={humanStatus(status)} value={count} max={Math.max(data.report.recordCount, 1)} />
                <b>
                  {count}
                </b>
              </div>)}
            </div>
          </section>
          <section className="panel priorities">
            <div className="panelhead">
              <h2>Needs your attention</h2>
              <span className="count-badge">
                {data.pending.length + data.report.missingCertificates.length}
              </span>
            </div>
            <Link to="/requests">
              <span className="card-icon">
                <CalendarCheck size={22} />
              </span>
              <span>
                <b>{data.pending.length} pending requests</b>
                <small>Leave and attendance corrections</small>
              </span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/reports">
              <span className="card-icon">
                <FileIcon />
              </span>
              <span>
                <b>{data.report.missingCertificates.length} missing certificates</b>
                <small>Review and send a reminder</small>
              </span>
              <ArrowRight size={18} />
            </Link>
            <Link className="assistant-shortcut" to="/assistant">
              <Sparkles size={22} />
              <span>
                <b>Need a quick summary?</b>
                <small>Ask your AI assistant</small>
              </span>
              <ArrowRight size={18} />
            </Link>
          </section>
        </div>
        <section className="panel">
          <div className="panelhead">
            <h2>People directory</h2>
            <Link className="text-link" to="/admin/employees">View all employees <ArrowRight size={17} /></Link>
          </div>
          {data.people.content.length ? <div className="people-preview">
            {data.people.content.slice(0, 6).map(employee => <Link to={`/admin/employees/${employee.id}`} className="person-preview" key={employee.id}>
              <span className="avatar">
                {employee.photoPath ? <img src={fileUrl(employee.photoPath)} alt="" /> : employee.fullName[0]}
              </span>
              <div>
                <b>
                  {employee.fullName}
                </b>
                <small>
                  {employee.designation?.title}
                </small>
              </div>
              <ArrowRight size={17} />
            </Link>)}
          </div> : <PageState title="Build your team">Add your first employee to get started.</PageState>}
        </section>
      </>}
    </div>
  </>;
}
function FileIcon() {
  return <Building2 size={22} />;
}
