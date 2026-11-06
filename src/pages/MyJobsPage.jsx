// Technician Form – SD "View assigned jobs" and SD "Update job status" (extend: Request spare parts)
import { useState } from 'react';
import Technician from '../classes/Technician';
import ServiceJob, { JOB_STEPS } from '../classes/ServiceJob';
import RepairNote from '../classes/RepairNote';
import { readAll, money } from '../classes/db';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Modal, Field, Badge, useLoad, useAction, Loading, Empty, nameOf } from '../components/ui';

export default function MyJobsPage() {
  const { user, can } = useAuth();
  const techId = user.technician?.technician_id;
  const { data, error, reload } = useLoad(async () => ({ jobs: techId ? await Technician.viewAssignedJobs(techId) : [], customers: await readAll('customer'), products: await readAll('product', {}, 'product_name') }));
  const { act, busy } = useAction();
  const [sel, setSel] = useState(null);
  if (!data) return <Loading error={error} />;
  if (!techId) return <div><PageHeader title="My Jobs" /><Empty text="Your account is not a technician." /></div>;
  const open = async (j) => setSel({ ...j, newStatus: JOB_STEPS[Math.min(JOB_STEPS.indexOf(j.status) + 1, 3)], details: '', charge: 0, spare_id: '', spare_qty: 1, notes: await RepairNote.getByJob(j.job_id) });
  const save = async () => {
    const r = await act(() => ServiceJob.updateStatus(sel.job_id, { status: sel.newStatus, details: sel.details, service_charge: sel.charge, spare: sel.spare_id ? { product_id: sel.spare_id, quantity: sel.spare_qty } : null }),
      x => x.invoice ? `Job updated – service invoice INV-${x.invoice.invoice_id} made for ${money(x.invoice.amount)}` : 'Job updated');
    if (r) { setSel(null); reload(); }
  };
  return (
    <div>
      <PageHeader title="My Jobs" subtitle={`Jobs assigned to ${user.name}`} />
      {data.jobs.length === 0 ? <Empty text="No jobs assigned" /> : (
        <div className="table-container"><table className="table">
          <thead><tr><th>Job</th><th>Date</th><th>Customer</th><th>Product</th><th>Type</th><th>Fault</th><th>Status</th><th></th></tr></thead>
          <tbody>{data.jobs.map(j => <tr key={j.job_id}><td>JOB-{j.job_id}</td><td>{j.request_date}</td><td>{nameOf(data.customers, 'customer_id', j.customer_id, 'name')}</td><td>{nameOf(data.products, 'product_id', j.product_id, 'product_name')}</td>
            <td>{j.job_type}</td><td style={{ fontSize: 12 }}>{j.fault}</td><td><Badge text={j.status} /></td>
            <td>{can('Update job status') && <button className="btn btn-primary btn-sm" onClick={() => open(j)}>Update</button>}</td></tr>)}</tbody>
        </table></div>
      )}
      {sel && (
        <Modal wide title={`Update JOB-${sel.job_id}`} onClose={() => setSel(null)} footer={<><button className="btn btn-outline" onClick={() => setSel(null)}>Cancel</button><button id="job-save" className="btn btn-primary" disabled={busy} onClick={save}>Save</button></>}>
          {sel.notes.length > 0 && <div style={{ fontSize: 12, marginBottom: 10 }}>{sel.notes.map(n => <div key={n.note_id}>• {n.note_date}: {n.details}</div>)}</div>}
          <Field label="New status"><select id="job-status" className="form-select" value={sel.newStatus} onChange={e => setSel({ ...sel, newStatus: e.target.value })}>
            {JOB_STEPS.filter(s => JOB_STEPS.indexOf(s) >= JOB_STEPS.indexOf(sel.status) && s !== 'Pending').map(s => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Repair details *"><textarea id="job-details" className="form-textarea" value={sel.details} onChange={e => setSel({ ...sel, details: e.target.value })} /></Field>
          {sel.newStatus === 'Completed' && <Field label="Service charge (Rs.)" hint="0 for warranty jobs. More than 0 makes a service invoice."><input id="job-charge" type="number" min="0" className="form-input" value={sel.charge} onChange={e => setSel({ ...sel, charge: e.target.value })} /></Field>}
          <div className="form-label">Spare part needed? (optional)</div>
          <div className="form-row-2">
            <select id="job-spare" className="form-select" value={sel.spare_id} onChange={e => setSel({ ...sel, spare_id: e.target.value })}><option value="">— no spare part —</option>{data.products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}</select>
            <input type="number" min="1" className="form-input" value={sel.spare_qty} onChange={e => setSel({ ...sel, spare_qty: e.target.value })} />
          </div>
        </Modal>
      )}
    </div>
  );
}
