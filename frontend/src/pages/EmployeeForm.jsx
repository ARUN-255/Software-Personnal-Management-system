import { useEffect, useState } from 'react';
import { api } from '../api/client';
import FormField from '../components/FormField';
import Button from '../components/Button';
export default function EmployeeForm({
  employee,
  onSaved
}) {
  const [f, setF] = useState(employee ? {
      employeeCode: employee.employeeCode,
      username: employee.userAccount.username,
      temporaryPassword: 'Update@123',
      fullName: employee.fullName,
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      dateOfBirth: employee.dateOfBirth || '',
      departmentId: employee.department.id,
      designationId: employee.designation.id,
      joiningDate: employee.joiningDate
    } : {
      employeeCode: '',
      username: '',
      temporaryPassword: '',
      fullName: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      departmentId: '',
      designationId: '',
      joiningDate: ''
    }),
    [refs, setRefs] = useState({
      d: [],
      g: []
    }),
    [err, setErr] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    Promise.all([api('/admin/departments'), api('/admin/designations')]).then(([d, g]) => setRefs({
      d,
      g
    })).catch(error => setErr(error.message));
  }, []);
  const set = (k, v) => setF({
    ...f,
    [k]: v
  });
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await api(employee ? `/admin/employees/${employee.id}` : '/admin/employees', {
        method: employee ? 'PUT' : 'POST',
        body: JSON.stringify(f)
      });
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  return <form className="formgrid" onSubmit={save}>
    {err && <div className="alert wide">
      {err}
    </div>}
    <FormField label="Employee code" required value={f.employeeCode} onChange={e => set('employeeCode', e.target.value)} />
    <FormField label="Full name" required value={f.fullName} onChange={e => set('fullName', e.target.value)} />
    <FormField label="Username" required disabled={!!employee} value={f.username} onChange={e => set('username', e.target.value)} />
    {!employee && <FormField label="Temporary password" required type="password" value={f.temporaryPassword} onChange={e => set('temporaryPassword', e.target.value)} />}
    <FormField label="Email" type="email" value={f.email} onChange={e => set('email', e.target.value)} />
    <FormField label="Phone" value={f.phone} onChange={e => set('phone', e.target.value)} />
    <FormField label="Department">
      <select required value={f.departmentId} onChange={e => set('departmentId', e.target.value)}>
        <option value="">Select</option>
        {refs.d.map(x => <option value={x.id} key={x.id}>
          {x.name}
        </option>)}
      </select>
    </FormField>
    <FormField label="Designation">
      <select required value={f.designationId} onChange={e => set('designationId', e.target.value)}>
        <option value="">Select</option>
        {refs.g.map(x => <option value={x.id} key={x.id}>
          {x.title}
        </option>)}
      </select>
    </FormField>
    <FormField label="Joining date" required type="date" value={f.joiningDate} onChange={e => set('joiningDate', e.target.value)} />
    <FormField label="Date of birth" type="date" value={f.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
    <FormField label="Address">
      <textarea value={f.address} onChange={e => set('address', e.target.value)} />
    </FormField>
    <Button className="wide" disabled={busy}>
      {busy ? 'Saving…' : 'Save employee'}
    </Button>
  </form>;
}
