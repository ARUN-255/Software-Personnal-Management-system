import { Link } from 'react-router-dom';
import { ArrowRight, Users, Building2, Plus, Sparkles, CalendarDays } from 'lucide-react';
import { api, fileUrl } from '../api/client';
import { useResource } from '../hooks/useResource';
import Topbar from '../components/Topbar';
import PageState from '../components/PageState';
export default function AdminDashboard() {
  const resource = useResource(async () => {
    const [people, departments] = await Promise.all([api('/admin/employees'), api('/admin/departments')]);
    return {
      people,
      departments
    };
  }, []);
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
        </div>
        <div className="stats">
          <article>
            <span className="stat-label"><Users size={19} />Employees</span>
            <strong>{data.people.totalElements}</strong>
            <Link to="/admin/employees">View directory <ArrowRight size={15} /></Link>
          </article>
          <article>
            <span className="stat-label"><Building2 size={19} />Departments</span>
            <strong>{data.departments.length}</strong>
            <span className="muted">Across your organisation</span>
          </article>
        </div>
        <div className="dashboard-grid">
          <section className="panel priorities">
            <div className="panelhead"><h2>Quick actions</h2></div>
            <Link to="/attendance"><span className="card-icon"><CalendarDays size={22} /></span><span><b>Manage attendance</b><small>View and update attendance records</small></span><ArrowRight size={18} /></Link>
            <Link className="assistant-shortcut" to="/assistant">
              <Sparkles size={22} />
              <span><b>Need a quick summary?</b><small>Ask your AI assistant</small></span>
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
            {data.people.content.slice(0, 6).map(employee => <Link to={'/admin/employees/' + employee.id} className="person-preview" key={employee.id}>
              <span className="avatar">
                {employee.photoPath ? <img src={fileUrl(employee.photoPath)} alt="" /> : employee.fullName[0]}
              </span>
              <div><b>{employee.fullName}</b><small>{employee.designation?.title}</small></div>
              <ArrowRight size={17} />
            </Link>)}
          </div> : <PageState title="Build your team">Add your first employee to get started.</PageState>}
        </section>
      </>}
    </div>
  </>;
}
