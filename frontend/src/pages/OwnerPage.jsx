import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Topbar from '../components/Topbar';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
export default function OwnerPage() {
  const [rows, setRows] = useState([]),
    [message, setMessage] = useState(null),
    [busy, setBusy] = useState(false);
  const load = () => api('/owner/admin-access-requests').then(setRows).catch(e => setMessage({
    type: 'error',
    text: e.message
  }));
  useEffect(() => {
    load();
  }, []);
  async function act(x, decision) {
    let tail = '';
    if (decision === 'approve') {
      const username = prompt('Enter a NEW admin username');
      if (!username) return;
      const password = prompt('Enter a temporary password (minimum 8 characters)');
      if (!password) return;
      tail = `?username=${encodeURIComponent(username)}&temporaryPassword=${encodeURIComponent(password)}`;
    }
    setBusy(true);
    setMessage(null);
    try {
      await api(`/owner/admin-access-requests/${x.id}/${decision}${tail}`, {
        method: 'POST'
      });
      setMessage({
        type: 'success',
        text: decision === 'approve' ? 'Admin account created and request approved.' : 'Request rejected.'
      });
      load();
    } catch (e) {
      setMessage({
        type: 'error',
        text: e.message
      });
    } finally {
      setBusy(false);
    }
  }
  return <>
    <Topbar title="Administrator access" subtitle="Review requests and issue credentials." />
    <div className="content">
      {message && <div className={message.type === 'success' ? 'success' : 'alert'}>
        {message.text}
      </div>}
      <section className="panel">
        <DataTable rows={rows} columns={[{
          key: 'fullName',
          label: 'Applicant'
        }, {
          key: 'email',
          label: 'Email'
        }, {
          key: 'reason',
          label: 'Reason'
        }, {
          key: 'status',
          label: 'Status',
          render: x => <StatusBadge value={x.status} />
        }, {
          key: 'actions',
          label: 'Actions',
          render: x => x.status === 'PENDING' ? <div className="actions">
            <Button disabled={busy} onClick={() => act(x, 'approve')}>Approve</Button>
            <Button disabled={busy} variant="danger" onClick={() => act(x, 'reject')}>Reject</Button>
          </div> : '—'
        }]} />
      </section>
    </div>
  </>;
}
