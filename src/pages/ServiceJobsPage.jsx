// Service Job Form – SD "Register service request" and SD "Assign technician to service job"
import { useState } from 'react';
import ServiceJob from '../classes/ServiceJob';
import Technician from '../classes/Technician';
import RepairNote from '../classes/RepairNote';
import InvoiceView from '../components/InvoiceView';
import { readAll, money } from '../classes/db';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Modal, Field, Badge, useLoad, useAction, Loading, Empty, nameOf } from '../components/ui';

export default function ServiceJobsPage() {
  const { can } = useAuth();
  const { data, error, reload } = useLoad(async () => ({ jobs: (await ServiceJob.getAll()).reverse(), customers: await readAll('customer', {}, 'name'), products: await readAll('product', {}, 'product_name'), techs: await Technician.getAll() }));
  const { act, busy } = useAction();
  const [f, setF] = useState({ customer_id: '', product_id: '', job_type: 'Repair', fault: '' });
  const [assign, setAssign] = useState(null);
  const [registered, setRegistered] = useState(null);
  const [st, setSt] = useState('');
  const [detail, setDetail] = useState(null);
  const [view, setView] = useState(null);
  if (!data) return <Loading error={error} />;
  const openDetail = async (j) => {
    const d = await act(async () => ({ j, notes: await RepairNote.getByJob(j.job_id), spares: await readAll('spare_part_request', { job_id: j.job_id }, 'request_id'), invoice: (await readAll('invoice', { job_id: j.job_id }))[0] }));
    if (d) setDetail(d);
  };
  const list = data.jobs.filter(j => !st || j.status === st);
  const register = async () => { const j = await act(() => ServiceJob.register(f), r => `Job JOB-${r.job_id} registered`); if (j) { setRegistered(j.job_id); setF({ customer_id: '', product_id: '', job_type: 'Repair', fault: '' }); reload(); } };
  const doAssign = async () => { if (await act(() => ServiceJob.assignTechnician(assign.job_id, assign.technician_id), 'Technician assigned')) { setAssign(null); reload(); } };
  const available = data.techs.filter(t => t.is_available);
  return (
    <div>
      <PageHeader title="Service Jobs" subtitle="Pending → Assigned → In Progress → Completed" />
      {can('Register service request') && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="chart-title">Register a service request</div>
          <div className="form-row-3">
            <Field label="Customer *"><select id="sj-customer" className="form-select" value={f.customer_id} onChange={e => setF({ ...f, customer_id: e.target.value })}><option value="">— choose —</option>{data.customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.name} ({c.phone})</option>)}</select></Field>
            <Field label="Product *"><select id="sj-product" className="form-select" value={f.product_id} onChange={e => setF({ ...f, product_id: e.target.value })}><option value="">— choose —</option>{data.products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}</select></Field>
            <Field label="Job type"><select id="sj-type" className="form-select" value={f.job_type} onChange={e => setF({ ...f, job_type: e.target.value })}><option>Repair</option><option>Installation</option><option>Maintenance</option></select></Field>
          </div>
          <Field label="Fault *"><input id="sj-fault" className="form-input" value={f.fault} onChange={e => setF({ ...f, fault: e.target.value })} /></Field>
          <button id="sj-register" className="btn btn-primary" disabled={busy} onClick={register}>Register job</button>
          {registered && <span className="text-success" style={{ marginLeft: 12 }}>Job number: JOB-{registered}</span>}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {['', 'Pending', 'Assigned', 'In Progress', 'Completed'].map(s => <button key={s} className={`btn btn-sm ${st === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSt(s)}>{s || 'All'} ({data.jobs.filter(j => !s || j.status === s).length})</button>)}
      </div>
      <div className="table-container"><table className="table">
        <thead><tr><th>Job</th><th>Date</th><th>Customer</th><th>Product</th><th>Type</th><th>Fault</th><th>Technician</th><th>Status</th><th></th></tr></thead>
        <tbody>{list.map(j => (
          <tr key={j.job_id}><td>JOB-{j.job_id}</td><td>{j.request_date}</td><td>{nameOf(data.customers, 'customer_id', j.customer_id, 'name')}</td><td>{nameOf(data.products, 'product_id', j.product_id, 'product_name')}</td>
            <td>{j.job_type}</td><td style={{ fontSize: 12 }}>{j.fault}</td><td>{j.technician_id ? nameOf(data.techs, 'technician_id', j.technician_id, 'name') : '—'}</td><td><Badge text={j.status} /></td>
            <td className="table-action-cell"><button className="btn btn-ghost btn-sm" onClick={() => openDetail(j)}>Details</button>
              {can('Assign technician to service job') && j.status === 'Pending' && <button className="btn btn-primary btn-sm" onClick={() => setAssign({ job_id: j.job_id, technician_id: available[0]?.technician_id || '' })}>Assign</button>}</td></tr>
        ))}</tbody>
      </table></div>
      {assign && (
        <Modal title={`Assign technician – JOB-${assign.job_id}`} onClose={() => setAssign(null)} footer={<><button className="btn btn-outline" onClick={() => setAssign(null)}>Cancel</button><button id="sj-assign" className="btn btn-primary" disabled={busy} onClick={doAssign}>Assign</button></>}>
          <Field label="Technician"><select id="sj-tech" className="form-select" value={assign.technician_id} onChange={e => setAssign({ ...assign, technician_id: e.target.value })}>
            <option value="">— choose —</option>{data.techs.map(t => <option key={t.technician_id} value={t.technician_id} disabled={!t.is_available}>{t.name} – {t.specialisations.join(', ')}{t.is_available ? '' : ' (busy)'}</option>)}</select></Field>
        </Modal>
      )}
      {detail && (
        <Modal wide title={`JOB-${detail.j.job_id} – ${detail.j.status}`} onClose={() => setDetail(null)}>
          <table className="table" style={{ marginBottom: 10 }}><tbody>
            <tr><td>Customer</td><td>{nameOf(data.customers, 'customer_id', detail.j.customer_id, 'name')}</td><td>Product</td><td>{nameOf(data.products, 'product_id', detail.j.product_id, 'product_name')}</td></tr>
            <tr><td>Job type</td><td>{detail.j.job_type}</td><td>Technician</td><td>{detail.j.technician_id ? nameOf(data.techs, 'technician_id', detail.j.technician_id, 'name') : '—'}</td></tr>
            <tr><td>Registered</td><td>{detail.j.request_date}</td><td>Completed</td><td>{detail.j.completed_date || '—'}</td></tr>
            <tr><td>Fault</td><td colSpan={3}>{detail.j.fault}</td></tr>
            <tr><td>Service charge</td><td>{money(detail.j.service_charge)}</td><td>Invoice</td><td>{detail.invoice ? <button className="btn btn-ghost btn-sm" onClick={() => setView(detail.invoice.invoice_id)}>INV-{detail.invoice.invoice_id} ({detail.invoice.status})</button> : '—'}</td></tr>
          </tbody></table>
          <div className="chart-title" style={{ fontSize: 14 }}>Repair notes</div>
          {detail.notes.length === 0 ? <Empty text="No repair notes yet" /> : detail.notes.map(n => <div key={n.note_id} style={{ fontSize: 13 }}>• {n.note_date}: {n.details}</div>)}
          {detail.spares.length > 0 && (<>
            <div className="chart-title" style={{ fontSize: 14, marginTop: 12 }}>Spare parts</div>
            <table className="table"><tbody>{detail.spares.map(r => <tr key={r.request_id}><td>SPR-{r.request_id}</td><td>{nameOf(data.products, 'product_id', r.product_id, 'product_name')}</td><td>× {r.quantity}</td><td><Badge text={r.status} /></td></tr>)}</tbody></table>
          </>)}
        </Modal>
      )}
      {view && <InvoiceView invoiceId={view} onClose={() => setView(null)} />}
    </div>
  );
}
