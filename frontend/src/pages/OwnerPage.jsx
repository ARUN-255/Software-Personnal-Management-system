import { useState } from 'react';
import { api } from '../api/client';
import { useResource } from '../hooks/useResource';
import Topbar from '../components/Topbar';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import PageState from '../components/PageState';
import Modal from '../components/Modal';
export default function OwnerPage() {
  const resource = useResource(() => api('/owner/admin-access-requests'), []);
  const [review, setReview] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function decide(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const credentials = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api(`/owner/admin-access-requests/${review.request.id}/${review.decision}`, {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      setMessage(review.decision === 'approve' ? 'Admin account created' : 'Request rejected');
      setReview(null);
      resource.reload();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return <>
    <Topbar title="Access requests" subtitle="Approve administrator access to your organisation." />
    <div className="content">
      {message && <div className="success" role="status">
        {message}
      </div>}
      <section className="panel">
        {resource.loading || resource.error ? <PageState {...resource} retry={resource.reload} /> : <DataTable rows={resource.data} columns={[{
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
          render: row => <StatusBadge value={row.status} />
        }, {
          key: 'actions',
          label: 'Review',
          render: row => row.status === 'PENDING' ? <div className="actions">
            <button className="btn secondary" onClick={() => {
              setError('');
              setReview({
                request: row,
                decision: 'approve'
              });
            }}>Approve</button>
            <button className="btn text" onClick={() => {
              setError('');
              setReview({
                request: row,
                decision: 'reject'
              });
            }}>Reject</button>
          </div> : 'Reviewed'
        }]} />}
      </section>
    </div>
    {review && <Modal title={review.decision === 'approve' ? 'Create admin access' : 'Reject request'} onClose={() => setReview(null)}>
      <p>{review.request.fullName} · {review.request.email}</p>
      <form className="formgrid" onSubmit={decide}>
        {error && <div className="alert wide" role="alert">
          {error}
        </div>}
        {review.decision === 'approve' ? <>
          <label className="wide">Admin username<input name="username" autoComplete="off" required /></label>
          <label className="wide">Temporary password<input name="temporaryPassword" type="password" minLength={8} maxLength={72} autoComplete="new-password" required /></label>
        </> : <p className="wide">This applicant will not receive an administrator account.</p>}
        <button className="btn wide" disabled={busy}>
          {review.decision === 'approve' ? 'Create account & approve' : 'Confirm rejection'}
        </button>
      </form>
    </Modal>}
  </>;
}
