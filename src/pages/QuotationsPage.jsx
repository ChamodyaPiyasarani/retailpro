// Quotation Form – SD "Request supplier quotation"
import { useState } from 'react';
import Quotation from '../classes/Quotation';
import { readAll, money, today, addDays } from '../classes/db';
import { PageHeader, Modal, Field, Badge, useLoad, useAction, Loading, nameOf } from '../components/ui';

export default function QuotationsPage() {
  const { data, error, reload } = useLoad(async () => ({ quotes: (await Quotation.getAll()).reverse(), sups: await readAll('supplier', { is_active: true }), products: await readAll('product', {}, 'product_name'), links: await readAll('product_supplier') }));
  const { act, busy } = useAction();
  const [f, setF] = useState({ supplier_id: '', product_id: '', quantity: 1 });
  const [sel, setSel] = useState(null);
  if (!data) return <Loading error={error} />;
  const prods = f.supplier_id ? data.products.filter(p => data.links.some(l => l.supplier_id === Number(f.supplier_id) && l.product_id === p.product_id)) : [];
  const request = async () => { if (await act(() => Quotation.request(f), 'Quotation requested')) { setF({ supplier_id: '', product_id: '', quantity: 1 }); reload(); } };
  const decide = async (ok) => { if (await act(() => ok ? Quotation.accept(sel.quotation_id, sel.quoted_price, sel.valid_until) : Quotation.reject(sel.quotation_id, sel.quoted_price, sel.valid_until), ok ? 'Quotation accepted' : 'Quotation rejected')) { setSel(null); reload(); } };
  return (
    <div>
      <PageHeader title="Quotations" subtitle="Ask a supplier for a price before ordering" />
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-row-3">
          <Field label="Supplier"><select id="q-supplier" className="form-select" value={f.supplier_id} onChange={e => setF({ ...f, supplier_id: e.target.value, product_id: '' })}><option value="">— choose —</option>{data.sups.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}</select></Field>
          <Field label="Product (supplied by this supplier)"><select id="q-product" className="form-select" value={f.product_id} onChange={e => setF({ ...f, product_id: e.target.value })}><option value="">— choose —</option>{prods.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}</select></Field>
          <Field label="Quantity"><input id="q-qty" type="number" min="1" className="form-input" value={f.quantity} onChange={e => setF({ ...f, quantity: e.target.value })} /></Field>
        </div>
        <button id="q-request" className="btn btn-primary" disabled={busy} onClick={request}>Request quotation</button>
      </div>
      <div className="table-container"><table className="table">
        <thead><tr><th>No</th><th>Requested</th><th>Supplier</th><th>Product</th><th>Qty</th><th>Quoted price</th><th>Valid until</th><th>Status</th><th></th></tr></thead>
        <tbody>{data.quotes.map(q => <tr key={q.quotation_id}><td>QT-{q.quotation_id}</td><td>{q.request_date}</td><td>{nameOf(data.sups, 'supplier_id', q.supplier_id, 'supplier_name')}</td>
          <td>{nameOf(data.products, 'product_id', q.product_id, 'product_name')}</td><td>{q.quantity}</td><td>{q.quoted_price ? money(q.quoted_price) : '—'}</td><td>{q.valid_until || '—'}</td><td><Badge text={q.status} /></td>
          <td>{q.status === 'Requested' && <button className="btn btn-outline btn-sm" onClick={() => setSel({ ...q, quoted_price: '', valid_until: addDays(today(), 30) })}>Enter price</button>}</td></tr>)}</tbody>
      </table></div>
      {sel && (
        <Modal title={`Quotation QT-${sel.quotation_id}`} onClose={() => setSel(null)}
          footer={<><button id="q-reject" className="btn btn-danger" disabled={busy} onClick={() => decide(false)}>Reject</button><button id="q-accept" className="btn btn-success" disabled={busy} onClick={() => decide(true)}>Accept</button></>}>
          <Field label="Price quoted by the supplier (per unit, Rs.)"><input id="q-price" type="number" className="form-input" value={sel.quoted_price} onChange={e => setSel({ ...sel, quoted_price: e.target.value })} /></Field>
          <Field label="Valid until"><input type="date" className="form-input" value={sel.valid_until} onChange={e => setSel({ ...sel, valid_until: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  );
}
