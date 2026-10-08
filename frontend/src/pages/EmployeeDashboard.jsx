import { useEffect, useState } from 'react';
import { api, fileUrl } from '../api/client';
import Topbar from '../components/Topbar';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
export default function EmployeeDashboard() {
  const [x, setX] = useState(),
    [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api('/me'), api('/me/attendance'), api('/me/payroll'), api('/me/documents')]).then(([e, a, p, d]) => setX({
      e,
      a,
      p,
      d
    })).catch(e => setError(e.message));
  }, []);
  if (error) return <div className="loader">
    <div className="alert">
      {error}
    </div>
  </div>;
  if (!x) return <div className="loader">Loading your workspace…</div>;
  let {
    e,
    a,
    p,
    d
  } = x;
  const photo = e.photoPath ? fileUrl(e.photoPath) : null;
  return <>
    <Topbar title={`Welcome, ${e.fullName}`} subtitle="Your personnel information in one place." />
    <div className="content">
      <section className="profile panel">
        <div className="avatar large">
          {photo ? <img src={photo} alt={`${e.fullName} profile`} /> : e.fullName?.[0]}
        </div>
        <div>
          <h2>
            {e.fullName}
          </h2>
          <p>{e.employeeCode} · {e.designation?.title}</p>
          <p>{e.department?.name} · {e.email}</p>
          <p>{e.phone || 'No phone'} · Joined {e.joiningDate}</p>
        </div>
        <StatusBadge value={e.employmentStatus} />
      </section>
      <div className="twocol">
        <section className="panel">
          <h2>Recent attendance</h2>
          <DataTable rows={a} columns={[{
            key: 'workDate',
            label: 'Date'
          }, {
            key: 'status',
            label: 'Status',
            render: r => <StatusBadge value={r.status} />
          }, {
            key: 'remarks',
            label: 'Remarks'
          }]} />
        </section>
        <section className="panel">
          <h2>Published payroll</h2>
          <DataTable rows={p} columns={[{
            key: 'payPeriod',
            label: 'Month'
          }, {
            key: 'basicPay',
            label: 'Basic'
          }, {
            key: 'netPay',
            label: 'Net pay'
          }]} />
        </section>
      </div>
      <section className="panel">
        <h2>My documents</h2>
        <div className="docs">
          {d.map(doc => <a target="_blank" rel="noreferrer" href={fileUrl(doc.id)} key={doc.id}>
            <b>
              {doc.title}
            </b>
            <small>{doc.documentType} · {doc.originalName}</small>
          </a>)}
        </div>
      </section>
    </div>
  </>;
}
