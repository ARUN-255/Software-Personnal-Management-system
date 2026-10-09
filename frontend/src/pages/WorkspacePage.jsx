import { useEffect, useState } from 'react';
import { api, downloadUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Topbar from '../components/Topbar';
import '../styles/workspace.css';

const localDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value || 0);
const time = value => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

export default function WorkspacePage() {
  const { user } = useAuth();
  const admin = user.role === 'ADMIN';
  const [tab, setTab] = useState('reports');
  const [month, setMonth] = useState(localDate().slice(0, 7));
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const [report, requests, notifications, status, attendance, payroll, audit] = await Promise.all([
      api(`/workspace/reports?month=${month}`), api('/workspace/requests'), api('/workspace/notifications'),
      api('/workspace/assistant/status'), admin ? [] : api('/me/attendance'), admin ? [] : api('/me/payroll'),
      admin ? api('/admin/audit') : [],
    ]);
    setData({ report, requests, notifications, status, attendance, payroll, audit });
  }
  useEffect(() => { let active = true; setData(null); setError(''); load().catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [month]);

  async function perform(action, success) {
    setBusy(true); setError(''); setMessage('');
    try { await action(); setMessage(success); await load(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  const tabs = [['reports', 'Monthly overview'], ['requests', admin ? 'Review requests' : 'Leave & corrections'],
    ['assistant', 'AI assistant'], ['notifications', 'Notifications'], ...(admin ? [['audit', 'Audit history']] : [['payslips', 'Payslips']])];

  return <>
    <Topbar title="People workspace" subtitle="Attendance, requests and insights in one place." />
    <div className="content workspace">
      <div className="workspace-toolbar no-print">
        <nav aria-label="Workspace sections">{tabs.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</nav>
        <label>Reporting month<input aria-label="Reporting month" type="month" value={month} onChange={e => { if (e.target.value) setMonth(e.target.value); }} /></label>
      </div>
      {error && <div className="alert" role="alert">{error}</div>}
      {message && <div className="success" role="status">{message}</div>}
      {!data ? <section className="panel">{error ? <button onClick={() => perform(async () => {}, 'Refreshed')}>Retry</button> : 'Loading workspace…'}</section> : <>
        {tab === 'reports' && <>
          <div className="workspace-stats">
            <article><span>Recorded attendance</span><strong>{data.report.recordCount}</strong><small>{month}</small></article>
            <article><span>Checked-in working hours</span><strong>{(data.report.workedMinutes / 60).toFixed(1)}</strong><small>Completed check-in/out sessions</small></article>
            <article><span>Published net pay</span><strong>{money(data.report.publishedNetPay)}</strong><small>{data.report.payslipCount} payslip(s)</small></article>
          </div>
          <section className="panel">
            <h2>Attendance breakdown</h2>
            <p>Counts include recorded days only. Missing records are not automatically absences.</p>
            {Object.entries(data.report.attendance).map(([status, count]) => <div className="attendance-bar" key={status}>
              <span>{status.replace('_', ' ')}</span><progress aria-label={status} value={count} max={Math.max(data.report.recordCount, 1)} /><b>{count}</b>
            </div>)}
            <div className="workspace-actions no-print">
              <button onClick={() => window.print()}>Print / save report as PDF</button>
              {admin && <a href={downloadUrl(`/admin/reports/attendance.csv?month=${month}`)}>Download attendance CSV</a>}
            </div>
          </section>
          {!admin && <section className="panel">
            <h2>Today's attendance</h2><p>One check-in and check-out each calendar day, using the organisation's time zone. Overnight shifts require an admin correction.</p>
            <div className="workspace-actions">
              <button disabled={busy || !!data.attendance.find(r => r.workDate === localDate())?.checkedInAt} onClick={() => perform(() => api('/me/check-in', { method: 'POST' }), 'Checked in successfully')}>Check in</button>
              <button disabled={busy || !data.attendance.find(r => r.workDate === localDate())?.checkedInAt || !!data.attendance.find(r => r.workDate === localDate())?.checkedOutAt} onClick={() => perform(() => api('/me/check-out', { method: 'POST' }), 'Checked out successfully')}>Check out</button>
            </div>
            <div className="workspace-table"><table><thead><tr><th>Date</th><th>Status</th><th>In</th><th>Out</th></tr></thead><tbody>
              {data.attendance.filter(r => r.workDate.startsWith(month)).map(r => <tr key={r.id}><td>{r.workDate}</td><td>{r.status}</td><td>{time(r.checkedInAt)}</td><td>{time(r.checkedOutAt)}</td></tr>)}
            </tbody></table></div>
          </section>}
          {admin && <section className="panel"><h2>Missing certificates</h2><p>Employees with no certificate on file. Requirements should be confirmed by an administrator.</p>
            {data.report.missingCertificates.length === 0 ? <p>No missing certificates.</p> : data.report.missingCertificates.map(employee => <div className="workspace-row" key={employee.id}>
              <span>{employee.name} <small>{employee.code}</small></span>
              <button disabled={busy} onClick={() => perform(() => api(`/admin/employees/${employee.id}/certificate-reminder`, { method: 'POST' }), 'In-app reminder sent')}>Send reminder</button>
            </div>)}
          </section>}
        </>}
        {tab === 'requests' && <Requests admin={admin} requests={data.requests} busy={busy} perform={perform} />}
        {tab === 'assistant' && <Assistant configured={data.status.configured} month={month} admin={admin} />}
        {tab === 'notifications' && <section className="panel"><h2>Notifications</h2>
          {!data.notifications.length && <p>You're all caught up. Approval decisions, payslips and reminders will appear here.</p>}
          {data.notifications.map(note => <div key={note.id} className={`workspace-row ${note.read ? 'read' : ''}`}><div><p>{note.message}</p><small>{new Date(note.createdAt).toLocaleString()}</small></div>
            {!note.read && <button disabled={busy} onClick={() => perform(() => api(`/workspace/notifications/${note.id}/read`, { method: 'POST' }), 'Marked as read')}>Mark read</button>}
          </div>)}
        </section>}
        {tab === 'payslips' && <section className="panel"><h2>Published payslips</h2><p>Download a PDF showing salary components and deductions.</p>
          {!data.payroll.length && <p>No published payslips yet.</p>}
          {data.payroll.map(pay => <div className="workspace-row" key={pay.id}><div><b>{pay.payPeriod.slice(0, 7)}</b><p>Basic {money(pay.basicPay)} + allowances {money(pay.allowances)} − deductions {money(pay.deductions)}</p><strong>Net {money(pay.netPay)}</strong></div><a href={downloadUrl(`/workspace/payslips/${pay.id}.pdf`)}>Download PDF</a></div>)}
        </section>}
        {tab === 'audit' && admin && <section className="panel"><h2>Recent audit history</h2><p>Latest 100 successful write operations. Passwords, prompts and request bodies are excluded.</p><div className="workspace-table"><table><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Target</th></tr></thead><tbody>
          {data.audit.map(event => <tr key={event.id}><td>{new Date(event.timestamp).toLocaleString()}</td><td>{event.actor?.username || 'System'}</td><td>{event.action}</td><td>{event.targetId}</td></tr>)}
        </tbody></table></div></section>}
      </>}
    </div>
  </>;
}

function Requests({ admin, requests, busy, perform }) {
  const [kind, setKind] = useState('LEAVE');
  const [comments, setComments] = useState({});
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    values.kind = kind;
    if (kind === 'ATTENDANCE') values.endDate = values.startDate;
    await perform(() => api('/me/requests', { method: 'POST', body: JSON.stringify(values) }), 'Request submitted for review');
  }
  return <>
    {!admin && <section className="panel"><h2>New request</h2><form className="workspace-form" onSubmit={submit}>
      <label>Request type<select value={kind} onChange={e => setKind(e.target.value)}><option value="LEAVE">Leave</option><option value="ATTENDANCE">Attendance correction</option></select></label>
      <label>{kind === 'LEAVE' ? 'Start date' : 'Attendance date'}<input type="date" name="startDate" min={kind === 'LEAVE' ? localDate() : undefined} max={kind === 'ATTENDANCE' ? localDate() : undefined} required /></label>
      {kind === 'LEAVE' ? <label>End date<input type="date" name="endDate" min={localDate()} required /></label> : <label>Correct status<select name="requestedAttendanceStatus"><option>PRESENT</option><option>ABSENT</option><option>HALF_DAY</option><option>HOLIDAY</option></select></label>}
      <label className="wide">Reason<textarea name="reason" maxLength={1000} required rows={3} /></label>
      <button disabled={busy} type="submit">Submit request</button>
    </form><p>Approved leave is recorded separately; it does not automatically deduct salary or rewrite attendance.</p></section>}
    <section className="panel"><h2>{admin ? 'Review employee requests' : 'My requests'}</h2>
      {!requests.length && <p>No requests yet.</p>}
      {requests.map(request => <article className="request-card" key={request.id}>
        <div className="workspace-row"><strong>{admin ? `${request.employee.fullName} · ` : ''}{request.kind === 'LEAVE' ? 'Leave' : 'Attendance correction'}</strong><span className="request-status">{request.status}</span></div>
        <p>{request.startDate} — {request.endDate}{request.kind === 'ATTENDANCE' ? ` · ${request.requestedAttendanceStatus}` : ''}</p><p>{request.reason}</p>
        {request.reviewerComment && <p><b>Reviewer:</b> {request.reviewerComment}</p>}
        {admin && request.status === 'PENDING' && <div className="review-controls"><label>Review comment<input maxLength={1000} value={comments[request.id] || ''} onChange={e => setComments({ ...comments, [request.id]: e.target.value })} /></label>
          {[true, false].map(approve => <button key={String(approve)} disabled={busy || !comments[request.id]?.trim()} onClick={() => perform(() => api(`/admin/requests/${request.id}/decision`, { method: 'POST', body: JSON.stringify({ approve, comment: comments[request.id] }) }), approve ? 'Request approved' : 'Request rejected')}>{approve ? 'Approve' : 'Reject'}</button>)}
        </div>}
      </article>)}
    </section>
  </>;
}

function Assistant({ configured, month, admin }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setAnswer(''); setError(''); }, [month]);
  async function ask(event) {
    event.preventDefault(); setBusy(true); setError(''); setAnswer('');
    try { const result = await api('/workspace/assistant', { method: 'POST', body: JSON.stringify({ question, month }) }); setAnswer(result.answer); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <section className="panel assistant-panel"><h2>Personnel assistant</h2>
    <p>{admin ? 'Ask about aggregate attendance and published payroll, or draft a reminder.' : 'Ask about your recorded attendance, worked hours and published salary components.'}</p>
    <p className="ai-notice">When you ask a question, your question and the permitted report for {month} are sent to Google Gemini. Responses may contain mistakes; verify them against the records. The assistant cannot change data.</p>
    {!configured && <div className="alert">AI is not connected yet. The backend needs its Gemini API key and model setting.</div>}
    <div className="workspace-actions">{(admin ? ['Summarize attendance this month.', 'Draft a polite missing-certificate reminder.'] : ['Summarize my attendance this month.', 'Explain the components of my payslip.']).map(sample => <button key={sample} onClick={() => setQuestion(sample)}>{sample}</button>)}</div>
    <form onSubmit={ask}><label htmlFor="question">Your question</label><textarea id="question" value={question} onChange={e => setQuestion(e.target.value)} maxLength={2000} required rows={4} /><button disabled={!configured || busy || !question.trim()}>{busy ? 'Preparing answer…' : 'Ask assistant'}</button></form>
    {error && <div className="alert" role="alert">{error}</div>}
    {answer && <article className="assistant-answer" aria-live="polite">{answer}</article>}
  </section>;
}
