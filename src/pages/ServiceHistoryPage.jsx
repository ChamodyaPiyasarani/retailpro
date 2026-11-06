// Technician Form – SD "View service history"
import { useState } from 'react';
import ServiceJob from '../classes/ServiceJob';
import { readAll, money } from '../classes/db';
import { PageHeader, Field, Badge, useLoad, useAction, Loading, Empty, nameOf } from '../components/ui';

export default function ServiceHistoryPage() {
  const { data, error } = useLoad(async () => ({ customers: await readAll('customer', {}, 'name'), products: await readAll('product', {}, 'product_name') }));
  const { act } = useAction();
  const [f, setF] = useState({ product_id: '', customer_id: '' });
  const [rows, setRows] = useState(null);
  if (!data) return <Loading error={error} />;
  const view = async () => { const r = await act(() => ServiceJob.viewHistory(f)); if (r) setRows(r); };
  return (
    <div>
      <PageHeader title="Service History" subtitle="Past jobs of a product or a customer, with the repair notes" />
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-row-3">
          <Field label="Product"><select id="sh-product" className="form-select" value={f.product_id} onChange={e => setF({ ...f, product_id: e.target.value })}><option value="">— any —</option>{data.products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}</select></Field>
          <Field label="Customer"><select id="sh-customer" className="form-select" value={f.customer_id} onChange={e => setF({ ...f, customer_id: e.target.value })}><option value="">— any —</option>{data.customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.name}</option>)}</select></Field>
          <div className="form-group" style={{ alignSelf: 'flex-end' }}><button id="sh-view" className="btn btn-primary" disabled={!f.product_id && !f.customer_id} onClick={view}>View history</button></div>
        </div>
      </div>
      {rows && (rows.length === 0 ? <Empty text="No service history" /> : rows.map(j => (
        <div key={j.job_id} className="card" style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><b>JOB-{j.job_id}</b> <Badge text={j.status} /> <span>{j.request_date}</span>
            <span>{nameOf(data.customers, 'customer_id', j.customer_id, 'name')}</span> – <span>{nameOf(data.products, 'product_id', j.product_id, 'product_name')}</span>
            {Number(j.service_charge) > 0 && <span>charge {money(j.service_charge)}</span>}</div>
          <div style={{ fontSize: 13, margin: '6px 0' }}>{j.job_type}: {j.fault}</div>
          {j.notes.map(n => <div key={n.note_id} style={{ fontSize: 12 }}>• {n.note_date}: {n.details}</div>)}
        </div>
      )))}
    </div>
  );
}
