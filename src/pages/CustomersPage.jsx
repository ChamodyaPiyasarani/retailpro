// Customer Form – SD "Manage customers" and SD "View customer purchase history"
import { useState } from 'react';
import { Plus, Pencil, Search, History } from 'lucide-react';
import Customer from '../classes/Customer';
import InvoiceView from '../components/InvoiceView';
import { readAll, money } from '../classes/db';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Modal, Field, Badge, useLoad, useAction, Loading, Empty, nameOf } from '../components/ui';

export default function CustomersPage() {
  const { can } = useAuth();
  const [q, setQ] = useState('');
  const { data, error, reload } = useLoad(async () => ({ customers: await Customer.search(q), products: await readAll('product') }), [q]);
  const { act, busy } = useAction();
  const [form, setForm] = useState(null);
  const [hist, setHist] = useState(null);
  const [view, setView] = useState(null);
  if (!data) return <Loading error={error} />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const save = async () => { if (await act(() => form.customer_id ? Customer.update(form.customer_id, form) : Customer.create(form), 'Customer saved')) { setForm(null); reload(); } };
  const history = async (c) => {
    const h = await act(async () => ({ orders: await Customer.viewPurchaseHistory(c.customer_id), jobs: await readAll('service_job', { customer_id: c.customer_id }, 'job_id') }));
    if (h) setHist({ c, ...h });
  };
  return (
    <div>
      <PageHeader title="Customers">{can('Manage customers') && <button id="add-customer" className="btn btn-primary" onClick={() => setForm({ name: '', phone: '', email: '', address: '' })}><Plus size={15} /> New customer</button>}</PageHeader>
      <div className="search-bar" style={{ marginBottom: 14, maxWidth: 360 }}><Search size={15} /><input id="customer-search" placeholder="Search name or phone" value={q} onChange={e => setQ(e.target.value)} /></div>
      <div className="table-container"><table className="table">
        <thead><tr><th>Name</th><th>Phone</th><th>E-mail</th><th>Address</th><th>Registered</th><th></th></tr></thead>
        <tbody>{data.customers.map(c => (
          <tr key={c.customer_id}><td style={{ fontWeight: 600 }}>{c.name}</td><td>{c.phone}</td><td>{c.email}</td><td>{c.address}</td><td>{c.registered_date}</td>
            <td className="table-action-cell">
              {can('Manage customers') && <button className="btn btn-ghost btn-sm" onClick={() => setForm(c)}><Pencil size={14} /> Edit</button>}
              {can('View customer purchase history') && <button className="btn btn-ghost btn-sm" onClick={() => history(c)}><History size={14} /> History</button>}
            </td></tr>
        ))}</tbody>
      </table></div>
      {form && (
        <Modal title={form.customer_id ? 'Edit customer' : 'New customer'} onClose={() => setForm(null)}
          footer={<><button className="btn btn-outline" onClick={() => setForm(null)}>Cancel</button><button id="save-customer" className="btn btn-primary" disabled={busy} onClick={save}>Save</button></>}>
          <Field label="Name *"><input id="customer-name" className="form-input" value={form.name} onChange={set('name')} /></Field>
          <Field label="Phone *"><input id="customer-phone" className="form-input" value={form.phone} onChange={set('phone')} placeholder="0771234567" /></Field>
          <Field label="E-mail"><input className="form-input" value={form.email || ''} onChange={set('email')} /></Field>
          <Field label="Address"><input className="form-input" value={form.address || ''} onChange={set('address')} /></Field>
        </Modal>
      )}
      {hist && (
        <Modal wide title={`Purchase history – ${hist.c.name}`} onClose={() => setHist(null)}>
          {(() => { const done = hist.orders.filter(o => o.status === 'Completed'); const unpaid = hist.orders.reduce((t, o) => t + (o.invoice && o.invoice.status === 'Unpaid' ? Number(o.invoice.amount) - Number(o.invoice.paid_amount) : 0), 0); return (
            <div className="stat-grid" style={{ marginBottom: 12 }}>
              <div className="stat-card"><div className="stat-card-label">Orders</div><div className="stat-card-value">{done.length}</div></div>
              <div className="stat-card"><div className="stat-card-label">Total spent</div><div className="stat-card-value">{money(done.reduce((t, o) => t + Number(o.total_amount), 0))}</div></div>
              <div className="stat-card"><div className="stat-card-label">Still to pay</div><div className="stat-card-value">{money(unpaid)}</div></div>
              <div className="stat-card"><div className="stat-card-label">Service jobs</div><div className="stat-card-value">{hist.jobs.length}</div></div>
            </div>); })()}
          {hist.orders.length === 0 ? <Empty text="No purchases yet" /> : (
            <table className="table" id="customer-history"><thead><tr><th>Order</th><th>Date</th><th>Products</th><th>Total</th><th>Invoice</th><th></th></tr></thead>
              <tbody>{hist.orders.map(o => <tr key={o.order_id}><td>SO-{o.order_id} {o.status === 'Cancelled' && <Badge text="Cancelled" />}</td><td>{o.order_date}</td>
                <td style={{ fontSize: 12 }}>{o.items.map(i => `${nameOf(data.products, 'product_id', i.product_id, 'product_name')} × ${i.quantity}`).join(', ')}</td><td>{money(o.total_amount)}</td>
                <td>{o.invoice ? <>INV-{o.invoice.invoice_id} <Badge text={o.invoice.status} /></> : '—'}</td>
                <td>{o.invoice && <button className="btn btn-ghost btn-sm" onClick={() => setView(o.invoice.invoice_id)}>View</button>}</td></tr>)}</tbody></table>
          )}
          {hist.jobs.length > 0 && (<>
            <div className="chart-title" style={{ fontSize: 14, marginTop: 12 }}>Service jobs</div>
            <table className="table"><thead><tr><th>Job</th><th>Date</th><th>Product</th><th>Fault</th><th>Status</th><th>Charge</th></tr></thead>
              <tbody>{hist.jobs.map(j => <tr key={j.job_id}><td>JOB-{j.job_id}</td><td>{j.request_date}</td><td>{nameOf(data.products, 'product_id', j.product_id, 'product_name')}</td><td style={{ fontSize: 12 }}>{j.fault}</td><td><Badge text={j.status} /></td><td>{money(j.service_charge)}</td></tr>)}</tbody></table>
          </>)}
        </Modal>
      )}
      {view && <InvoiceView invoiceId={view} onClose={() => setView(null)} />}
    </div>
  );
}
