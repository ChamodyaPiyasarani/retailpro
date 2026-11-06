// Return Form – SD "Create return request" (include: Check warranty status) and SD "Approve refund requests"
import { useState } from 'react';
import { Check, X } from 'lucide-react';
import ReturnRequest from '../classes/ReturnRequest';
import { readAll } from '../classes/db';
import { productsOfInvoice } from './WarrantyPage';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Field, Badge, useLoad, useAction, Loading, Empty, nameOf } from '../components/ui';

export default function ReturnsPage() {
  const { can } = useAuth();
  const { data, error, reload } = useLoad(async () => ({ reqs: (await ReturnRequest.getAll()).reverse(), products: await readAll('product') }));
  const { act, busy } = useAction();
  const [f, setF] = useState({ invoice: '', product_id: '', reason: '' });
  const [items, setItems] = useState([]);
  if (!data) return <Loading error={error} />;
  const pname = (id) => nameOf(data.products, 'product_id', id, 'product_name');
  const create = async () => {
    if (await act(() => ReturnRequest.create({ invoice_id: Number(f.invoice.replace(/\D/g, '')), product_id: Number(f.product_id), reason: f.reason }), 'Return request sent for approval')) { setF({ invoice: '', product_id: '', reason: '' }); setItems([]); reload(); }
  };
  const decide = async (r, ok) => { if (await act(() => ok ? ReturnRequest.approve(r.request_id) : ReturnRequest.reject(r.request_id), ok ? 'Request approved' : 'Request rejected')) reload(); };
  const pending = data.reqs.filter(r => r.status === 'Pending');
  return (
    <div>
      <PageHeader title="Returns" subtitle="Customers can return a product that is still under warranty" />
      {can('Create return request') && (
        <div className="card" style={{ marginBottom: 16, maxWidth: 640 }}>
          <div className="chart-title">New return request</div>
          <div className="form-row-2">
            <Field label="Invoice number"><input id="r-invoice" className="form-input" value={f.invoice} onChange={async e => { const v = e.target.value; setF({ ...f, invoice: v, product_id: '' }); setItems(v ? await productsOfInvoice(v).catch(() => []) : []); }} /></Field>
            <Field label="Product"><select id="r-product" className="form-select" value={f.product_id} onChange={e => setF({ ...f, product_id: e.target.value })}>
              <option value="">— choose —</option>{items.map(i => <option key={i.product_id} value={i.product_id}>{i.product_name}</option>)}</select></Field>
          </div>
          <Field label="Reason"><input id="r-reason" className="form-input" value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} /></Field>
          <button id="r-create" className="btn btn-primary" disabled={busy || !f.invoice || !f.product_id} onClick={create}>Send for approval</button>
        </div>
      )}
      {can('Approve refund requests') && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="chart-title">Waiting for approval</div>
          {pending.length === 0 ? <Empty text="No pending requests" /> : (
            <table className="table"><thead><tr><th>Request</th><th>Date</th><th>Order</th><th>Product</th><th>Reason</th><th></th></tr></thead>
              <tbody>{pending.map(r => <tr key={r.request_id}><td>RET-{r.request_id}</td><td>{r.request_date}</td><td>SO-{r.order_id}</td><td>{pname(r.product_id)}</td><td>{r.reason}</td>
                <td className="table-action-cell"><button className="btn btn-success btn-sm" onClick={() => decide(r, true)}><Check size={14} /> Approve</button><button className="btn btn-danger btn-sm" onClick={() => decide(r, false)}><X size={14} /> Reject</button></td></tr>)}</tbody></table>
          )}
        </div>
      )}
      <div className="card">
        <div className="chart-title">All return requests</div>
        <table className="table"><thead><tr><th>Request</th><th>Date</th><th>Order</th><th>Product</th><th>Reason</th><th>Status</th></tr></thead>
          <tbody>{data.reqs.map(r => <tr key={r.request_id}><td>RET-{r.request_id}</td><td>{r.request_date}</td><td>SO-{r.order_id}</td><td>{pname(r.product_id)}</td><td>{r.reason}</td><td><Badge text={r.status} /></td></tr>)}</tbody></table>
      </div>
    </div>
  );
}
