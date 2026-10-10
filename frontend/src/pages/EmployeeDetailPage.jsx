import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, CalendarDays, Wallet, FileText, Upload, ArrowUpRight } from 'lucide-react';
import { api, fileUrl } from '../api/client';
import { useResource } from '../hooks/useResource';
import Topbar from '../components/Topbar';
import PageState from '../components/PageState';
import Modal from '../components/Modal';
import EmployeeForm from './EmployeeForm';
import StatusBadge from '../components/StatusBadge';
export default function EmployeeDetailPage() {
  const {
    id
  } = useParams();
  const resource = useResource(async () => {
    const [employee, documents] = await Promise.all([api(`/admin/employees/${id}`), api(`/admin/employees/${id}/documents`)]);
    return {
      employee,
      documents
    };
  }, [id]);
  const [edit, setEdit] = useState(false);
  const [upload, setUpload] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const employee = resource.data?.employee;
  async function uploadFile(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(`/admin/employees/${id}/documents`, {
        method: 'POST',
        body: new FormData(event.currentTarget)
      });
      setUpload(false);
      setMessage('File uploaded successfully');
      await resource.reload();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return <>
    <Topbar title="Employee profile" actions={<Link className="btn secondary" to="/admin/employees"><ArrowLeft size={18} />All employees</Link>} />
    <div className="content">
      {message && <div className="success" role="status">
        {message}
      </div>}
      {resource.loading || resource.error ? <PageState {...resource} retry={resource.reload} /> : <>
        <section className="panel profile">
          <span className="avatar large">
            {employee.photoPath ? <img src={fileUrl(employee.photoPath)} alt={employee.fullName} /> : employee.fullName[0]}
          </span>
          <div className="grow">
            <span className="eyebrow">
              {employee.employeeCode}
            </span>
            <h2>
              {employee.fullName}
            </h2>
            <p>{employee.designation?.title} · {employee.department?.name}</p>
            <StatusBadge value={employee.employmentStatus} />
          </div>
          <button className="btn secondary" onClick={() => setEdit(true)}><Pencil size={17} />Edit profile</button>
        </section>
        <div className="profile-shortcuts">
          <Link to={`/attendance?employee=${id}`}>
            <CalendarDays />
            <span>Attendance</span>
            <ArrowUpRight size={19} />
          </Link>
          <Link to={`/payroll?employee=${id}`}>
            <Wallet />
            <span>Payroll & payslips</span>
            <ArrowUpRight size={19} />
          </Link>
          <button onClick={() => setUpload(true)}>
            <Upload />
            <span>Upload a document</span>
            <ArrowUpRight size={19} />
          </button>
        </div>
        <section className="panel">
          <h2>Personal details</h2>
          <dl className="detail-grid">
            {[['Email', employee.email], ['Phone', employee.phone], ['Date of birth', employee.dateOfBirth], ['Joined', employee.joiningDate], ['Address', employee.address], ['Login username', employee.userAccount?.username]].map(([label, value]) => <div key={label}>
              <dt>
                {label}
              </dt>
              <dd>
                {value || 'Not provided'}
              </dd>
            </div>)}
          </dl>
        </section>
        <section className="panel">
          <div className="panelhead">
            <div>
              <h2>Photos & certificates</h2>
              <p>{resource.data.documents.length} document(s)</p>
            </div>
            <button className="btn secondary" onClick={() => setUpload(true)}><Upload size={18} />Upload file</button>
          </div>
          {resource.data.documents.length ? <div className="document-grid">
            {resource.data.documents.map(document => <a className="document-card" key={document.id} target="_blank" rel="noreferrer" href={fileUrl(document.id)}>
              {document.documentType === 'PHOTO' ? <img className="document-thumbnail" src={fileUrl(document.id)} alt={document.title} /> : <FileText size={32} />}
              <b>
                {document.title}
              </b>
              <small>
                {document.originalName}
              </small>
              <span className="text-link">Open file <ArrowUpRight size={16} /></span>
            </a>)}
          </div> : <PageState title="No documents yet">Add a profile photo or certificate.</PageState>}
        </section>
      </>}
    </div>
    {edit && <Modal title="Edit employee" onClose={() => setEdit(false)}>
      <EmployeeForm employee={employee} onSaved={() => {
        setEdit(false);
        setMessage('Employee details saved');
        resource.reload();
      }} />
    </Modal>}
    {upload && <Modal title="Upload photo or certificate" onClose={() => setUpload(false)}>
      <form className="formgrid" onSubmit={uploadFile}>
        {error && <div className="alert wide" role="alert">
          {error}
        </div>}
        <label>File type<select name="type">
            <option value="PHOTO">Profile photo</option>
            <option value="CERTIFICATE">Certificate</option>
          </select></label>
        <label>Title<input name="title" required maxLength={150} /></label>
        <label>Issuer (optional)<input name="issuer" maxLength={150} /></label>
        <label>Issue date (optional)<input name="issueDate" type="date" /></label>
        <label className="wide upload-zone">
          <Upload />
          <b>Choose a file</b>
          <span>JPG, PNG or PDF · up to 5 MB</span>
          <input name="file" type="file" accept="image/jpeg,image/png,application/pdf" required />
        </label>
        <button className="btn wide" disabled={busy}>
          {busy ? 'Uploading…' : 'Upload file'}
        </button>
      </form>
    </Modal>}
  </>;
}
