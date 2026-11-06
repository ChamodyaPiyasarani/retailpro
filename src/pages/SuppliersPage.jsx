// Supplier Form – SD "Manage suppliers" (tick the products the supplier supplies) and the supplier's order history
import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, History } from 'lucide-react';
import Supplier from '../classes/Supplier';
import { readAll, money } from '../classes/db';
import { PageHeader, Modal, Field, Badge, useLoad, useAction, Loading, Empty, nameOf } from '../components/ui';

export default function SuppliersPage() {
  const [q, setQ] = useState('');
  const { data, error, reload } = useLoad(async () => ({ sups: await Supplier.search(q), products: await readAll('product', {}, 'product_name'), links: await readAll('product_supplier') }), [q]);
  const { act, busy } = useAction();
  const [form, setForm] = useState(null);
  const [hist, setHist] = useState(null);
  if (!data) return <Loading error={error} />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const prodsOf = (sid) => data.links.filter(l => l.supplier_id === sid).map(l => l.product_id);
  const tick = (pid) => setForm({ ...form, products: form.products.includes(pid) ? form.products.filter(x => x !== pid) : [...form.products, pid] });
  const save = async () => { if (await act(() => form.supplier_id ? Supplier.update(form.supplier_id, form, form.products) : Supplier.create(form, form.products), 'Supplier saved')) { setForm(null); reload(); } };
  const remove = async (s) => { if (window.confirm(`Delete ${s.supplier_name}?`) && await act(() => Supplier.delete(s.supplier_id), r => r === 'inactive' ? 'Supplier has orders, so it is now inactive' : 'Supplier deleted')) reload(); };
  const history = async (sup) => {
    const h = await act(async () => {
      const pos = (await readAll('purchase_order', { supplier_id: sup.supplier_id }, 'po_id')).reverse();
      const pays = await readAll('payment', { payment_type: 'Supplier' });
      const quotes = (await readAll('quotation', { supplier_id: sup.supplier_id }, 'quotation_id')).reverse();
      return { sup, quotes, pos: pos.map(p => ({ ...p, paid: pays.filter(x => x.po_id === p.po_id).reduce((t, x) => t + Number(x.amount), 0), cheque: pays.find(x => x.po_id === p.po_id)?.cheque_no })) };
    });
    if (h) setHist(h);
  };
  return (
    <div>
      <PageHeader title="Suppliers"><button id="add-supplier" className="btn btn-primary" onClick={() => setForm({ supplier_name: '', contact_person: '', phone: '', email: '', address: '', is_active: true, products: [] })}><Plus size={15} /> New supplier</button></PageHeader>
      <div className="search-bar" style={{ marginBottom: 14, maxWidth: 360 }}><Search size={15} /><input placeholder="Search supplier" value={q} onChange={e => setQ(e.target.value)} /></div>
      <div className="table-container"><table className="table">
        <thead><tr><th>Supplier</th><th>Contact</th><th>Phone</th><th>E-mail</th><th>Products supplied</th><th>Status</th><th></th></tr></thead>
        <tbody>{data.sups.map(s => (
          <tr key={s.supplier_id}><td style={{ fontWeight: 600 }}>{s.supplier_name}</td><td>{s.contact_person}</td><td>{s.phone}</td><td>{s.email}</td>
            <td style={{ fontSize: 12 }}>{data.products.filter(p => prodsOf(s.supplier_id).includes(p.product_id)).map(p => p.product_name).join(', ') || '—'}</td>
            <td><Badge text={s.is_active ? 'Active' : 'Inactive'} /></td>
            <td className="table-action-cell"><button className="btn btn-ghost btn-sm" onClick={() => history(s)}><History size={14} /> History</button><button className="btn btn-ghost btn-sm" onClick={() => setForm({ ...s, products: prodsOf(s.supplier_id) })}><Pencil size={14} /> Edit</button><button className="btn btn-ghost btn-sm text-danger" onClick={() => remove(s)}><Trash2 size={14} /></button></td></tr>
        ))}</tbody>
      </table></div>
      {form && (
        <Modal wide title={form.supplier_id ? 'Edit supplier' : 'New supplier'} onClose={() => setForm(null)}
          footer={<><button className="btn btn-outline" onClick={() => setForm(null)}>Cancel</button><button id="save-supplier" className="btn btn-primary" disabled={busy} onClick={save}>Save</button></>}>
          <div className="form-row-2"><Field label="Supplier name *"><input id="supplier-name" className="form-input" value={form.supplier_name} onChange={set('supplier_name')} /></Field>
            <Field label="Contact person"><input className="form-input" value={form.contact_person || ''} onChange={set('contact_person')} /></Field></div>
          <div className="form-row-2"><Field label="Phone *"><input id="supplier-phone" className="form-input" value={form.phone || ''} onChange={set('phone')} /></Field>
            <Field label="E-mail"><input className="form-input" value={form.email || ''} onChange={set('email')} /></Field></div>
          <Field label="Address"><input className="form-input" value={form.address || ''} onChange={set('address')} /></Field>
          <div className="form-label">Products supplied (tick)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 4 }}>
            {data.products.map(p => <label key={p.product_id} style={{ fontSize: 13, display: 'flex', gap: 6 }}><input type="checkbox" checked={form.products.includes(p.product_id)} onChange={() => tick(p.product_id)} />{p.product_name}</label>)}
          </div>
        </Modal>
      )}
      {hist && (
        <Modal wide title={`Order history – ${hist.sup.supplier_name}`} onClose={() => setHist(null)}>
          <div className="stat-grid" style={{ marginBottom: 12 }}>
            <div className="stat-card"><div className="stat-card-label">Purchase orders</div><div className="stat-card-value">{hist.pos.length}</div></div>
            <div className="stat-card"><div className="stat-card-label">Total ordered</div><div className="stat-card-value">{money(hist.pos.filter(p => p.status !== 'Rejected').reduce((t, p) => t + Number(p.total_amount), 0))}</div></div>
            <div className="stat-card"><div className="stat-card-label">Paid</div><div className="stat-card-value">{money(hist.pos.reduce((t, p) => t + p.paid, 0))}</div></div>
            <div className="stat-card"><div className="stat-card-label">Quotations</div><div className="stat-card-value">{hist.quotes.length}</div></div>
          </div>
          {hist.pos.length === 0 ? <Empty text="No purchase orders yet" /> : (
            <table className="table" id="supplier-history"><thead><tr><th>PO</th><th>Date</th><th>Expected</th><th>Total</th><th>Status</th><th>Paid</th><th>Cheque</th></tr></thead>
              <tbody>{hist.pos.map(p => <tr key={p.po_id}><td>PO-{p.po_id}</td><td>{p.order_date}</td><td>{p.expected_date || '—'}</td><td>{money(p.total_amount)}</td><td><Badge text={p.status} /></td><td>{p.paid ? money(p.paid) : '—'}</td><td>{p.cheque || '—'}</td></tr>)}</tbody></table>
          )}
          {hist.quotes.length > 0 && (<>
            <div className="chart-title" style={{ fontSize: 14, marginTop: 12 }}>Quotations</div>
            <table className="table"><thead><tr><th>No</th><th>Date</th><th>Product</th><th>Qty</th><th>Price</th><th>Status</th></tr></thead>
              <tbody>{hist.quotes.map(q => <tr key={q.quotation_id}><td>QT-{q.quotation_id}</td><td>{q.request_date}</td><td>{nameOf(data.products, 'product_id', q.product_id, 'product_name')}</td><td>{q.quantity}</td><td>{q.quoted_price ? money(q.quoted_price) : '—'}</td><td><Badge text={q.status} /></td></tr>)}</tbody></table>
          </>)}
        </Modal>
      )}
    </div>
  );
}
