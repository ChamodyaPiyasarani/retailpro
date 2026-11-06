// Purchase Order Form – SD "Create purchase order" (include: Select supplier), SD "Approve purchase orders",
// SD "Track purchase order status", SD "Reorder low-stock items"
import { useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import PurchaseOrder from '../classes/PurchaseOrder';
import StockAlert from '../classes/StockAlert';
import { readAll, money, addDays, today } from '../classes/db';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Modal, Field, Badge, useLoad, useAction, Loading, Empty, nameOf } from '../components/ui';

const useLists = () => useLoad(async () => ({ sups: await readAll('supplier', { is_active: true }), products: await readAll('product', {}, 'product_name'),
  links: await readAll('product_supplier'), quotes: await readAll('quotation', { status: 'Accepted' }), used: (await readAll('purchase_order')).map(p => p.quotation_id) }));

function CreateTab() {
  const { user } = useAuth();
  const { act, busy } = useAction();
  const { data, error } = useLists();
  const [po, setPo] = useState({ supplier_id: '', quotation_id: '', expected_date: addDays(today(), 7), items: [] });
  const [line, setLine] = useState({ product_id: '', quantity: 1, unit_cost: '' });
  const [done, setDone] = useState(null);
  if (!data) return <Loading error={error} />;
  const sid = Number(po.supplier_id);
  const prods = data.products.filter(p => data.links.some(l => l.supplier_id === sid && l.product_id === p.product_id));
  const quotes = data.quotes.filter(q => q.supplier_id === sid && !data.used.includes(q.quotation_id));
  const applyQuote = (qid) => { const q = data.quotes.find(x => x.quotation_id === Number(qid)); setPo({ ...po, quotation_id: qid, items: q ? [{ product_id: q.product_id, quantity: q.quantity, unit_cost: Number(q.quoted_price) }] : po.items }); };
  const add = async () => { const items = await act(async () => PurchaseOrder.addItem(po.items, line)); if (items) { setPo({ ...po, items }); setLine({ product_id: '', quantity: 1, unit_cost: '' }); } };
  const submit = async () => { const r = await act(() => PurchaseOrder.create(po, user.user_id), 'Order created and sent for approval'); if (r) { setDone(r); setPo({ supplier_id: '', quotation_id: '', expected_date: addDays(today(), 7), items: [] }); } };
  return (
    <div className="card">
      <div className="form-row-3">
        <Field label="Supplier *"><select id="po-supplier" className="form-select" value={po.supplier_id} onChange={e => setPo({ ...po, supplier_id: e.target.value, quotation_id: '', items: [] })}><option value="">— select supplier —</option>{data.sups.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}</select></Field>
        <Field label="Accepted quotation (optional)"><select id="po-quote" className="form-select" value={po.quotation_id} onChange={e => applyQuote(e.target.value)}><option value="">— none —</option>{quotes.map(q => <option key={q.quotation_id} value={q.quotation_id}>QT-{q.quotation_id}: {nameOf(data.products, 'product_id', q.product_id, 'product_name')} × {q.quantity} @ {money(q.quoted_price)}</option>)}</select></Field>
        <Field label="Expected date"><input type="date" className="form-input" value={po.expected_date} onChange={e => setPo({ ...po, expected_date: e.target.value })} /></Field>
      </div>
      {po.supplier_id && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 220 }}><Field label="Product"><select id="po-product" className="form-select" value={line.product_id} onChange={e => { const p = data.products.find(x => x.product_id === Number(e.target.value)); setLine({ ...line, product_id: e.target.value, unit_cost: p ? p.cost_price : '' }); }}>
            <option value="">— choose —</option>{prods.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}</select></Field></div>
          <div style={{ width: 100 }}><Field label="Quantity"><input id="po-qty" type="number" min="1" className="form-input" value={line.quantity} onChange={e => setLine({ ...line, quantity: e.target.value })} /></Field></div>
          <div style={{ width: 140 }}><Field label="Unit cost (Rs.)"><input id="po-cost" type="number" className="form-input" value={line.unit_cost} onChange={e => setLine({ ...line, unit_cost: e.target.value })} /></Field></div>
          <div className="form-group"><button id="po-add" className="btn btn-outline" onClick={add}><Plus size={14} /> Add</button></div>
        </div>
      )}
      {po.items.length > 0 && (
        <table className="table"><thead><tr><th>Product</th><th>Qty</th><th>Unit cost</th><th>Subtotal</th><th></th></tr></thead>
          <tbody>{po.items.map(i => <tr key={i.product_id}><td>{nameOf(data.products, 'product_id', i.product_id, 'product_name')}</td><td>{i.quantity}</td><td>{money(i.unit_cost)}</td><td>{money(i.quantity * i.unit_cost)}</td>
            <td><button className="btn btn-ghost btn-sm text-danger" onClick={() => setPo({ ...po, items: po.items.filter(x => x !== i) })}><Trash2 size={14} /></button></td></tr>)}</tbody></table>
      )}
      <p style={{ fontWeight: 800, fontSize: 18 }}>Total: {money(PurchaseOrder.calculateTotal(po.items))}</p>
      <button id="po-submit" className="btn btn-primary" disabled={busy || !po.supplier_id} onClick={submit}>Submit order</button>
      {done && <div className="alert alert-success" style={{ marginTop: 12 }}>Order number PO-{done.po_id} created – waiting for approval.</div>}
    </div>
  );
}

function ApproveTab() {
  const { act } = useAction();
  const { data, error, reload } = useLoad(async () => ({ pos: (await PurchaseOrder.track()).filter(p => p.status === 'Pending'), sups: await readAll('supplier'), products: await readAll('product') }));
  if (!data) return <Loading error={error} />;
  const decide = async (p, ok) => { if (await act(() => ok ? PurchaseOrder.approve(p.po_id) : PurchaseOrder.reject(p.po_id), ok ? 'Order approved' : 'Order rejected')) reload(); };
  return data.pos.length === 0 ? <Empty text="No orders waiting for approval" /> : (
    <table className="table"><thead><tr><th>PO</th><th>Date</th><th>Supplier</th><th>Items</th><th>Total</th><th></th></tr></thead>
      <tbody>{data.pos.map(p => <tr key={p.po_id}><td>PO-{p.po_id}</td><td>{p.order_date}</td><td>{nameOf(data.sups, 'supplier_id', p.supplier_id, 'supplier_name')}</td>
        <td style={{ fontSize: 12 }}>{p.items.map(i => `${nameOf(data.products, 'product_id', i.product_id, 'product_name')} × ${i.quantity}`).join(', ')}</td><td>{money(p.total_amount)}</td>
        <td className="table-action-cell"><button className="btn btn-success btn-sm" onClick={() => decide(p, true)}><Check size={14} /> Approve</button><button className="btn btn-danger btn-sm" onClick={() => decide(p, false)}><X size={14} /> Reject</button></td></tr>)}</tbody></table>
  );
}

function TrackTab() {
  const { data, error } = useLoad(async () => ({ pos: await PurchaseOrder.track(), sups: await readAll('supplier'), products: await readAll('product') }));
  const [sel, setSel] = useState(null);
  const [st, setSt] = useState('');
  if (!data) return <Loading error={error} />;
  const list = [...data.pos].reverse().filter(p => !st || p.status === st);
  return (<>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
      {['', 'Pending', 'Approved', 'Received', 'Paid', 'Rejected'].map(s => <button key={s} className={`btn btn-sm ${st === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSt(s)}>{s || 'All'} ({data.pos.filter(p => !s || p.status === s).length})</button>)}
    </div>
    <table className="table"><thead><tr><th>PO</th><th>Date</th><th>Expected</th><th>Supplier</th><th>Total</th><th>Status</th><th></th></tr></thead>
      <tbody>{list.map(p => <tr key={p.po_id}><td>PO-{p.po_id}</td><td>{p.order_date}</td><td>{p.expected_date}</td><td>{nameOf(data.sups, 'supplier_id', p.supplier_id, 'supplier_name')}</td><td>{money(p.total_amount)}</td>
        <td><Badge text={p.status} /></td><td><button className="btn btn-ghost btn-sm" onClick={() => setSel(p)}>Details</button></td></tr>)}</tbody></table>
    {sel && (
      <Modal title={`PO-${sel.po_id} – ${sel.status}`} onClose={() => setSel(null)}>
        <p>Pending → Approved → Received → Paid {sel.status === 'Rejected' && '(this order was rejected)'}</p>
        <table className="table"><thead><tr><th>Product</th><th>Ordered</th><th>Received</th><th>Unit cost</th></tr></thead>
          <tbody>{sel.items.map(i => <tr key={i.item_id}><td>{nameOf(data.products, 'product_id', i.product_id, 'product_name')}</td><td>{i.quantity}</td><td>{i.received_qty}</td><td>{money(i.unit_cost)}</td></tr>)}</tbody></table>
      </Modal>
    )}
  </>);
}

function ReorderTab() {
  const { user } = useAuth();
  const { act, busy } = useAction();
  const { data, error, reload } = useLoad(async () => ({ alerts: await StockAlert.getOpen(), products: await readAll('product'), sups: await readAll('supplier', { is_active: true }), links: await readAll('product_supplier') }));
  const [sel, setSel] = useState({});
  const [sid, setSid] = useState('');
  if (!data) return <Loading error={error} />;
  if (data.alerts.length === 0) return <Empty text="All items are in stock" />;
  const product = (id) => data.products.find(p => p.product_id === id);
  const supplies = (pid) => data.links.some(l => l.supplier_id === Number(sid) && l.product_id === pid);
  const create = async () => {
    const ids = Object.keys(sel).filter(k => sel[k]).map(Number);
    const ok = await act(async () => {
      if (!sid) throw new Error('Please choose the supplier.');
      if (!ids.length) throw new Error('Please tick the products to reorder.');
      const items = ids.map(id => { const p = product(id); return { product_id: id, quantity: Math.max(p.reorder_level * 2 - p.stock_qty, 1), unit_cost: Number(p.cost_price) }; });
      const po = await PurchaseOrder.create({ supplier_id: sid, expected_date: addDays(today(), 7), items }, user.user_id);
      await StockAlert.resolve(ids);
      return po;
    }, r => `Order PO-${r.po_id} created`);
    if (ok) { setSel({}); reload(); }
  };
  return (
    <div className="card">
      <Field label="Supplier"><select id="ro-supplier" className="form-select" style={{ maxWidth: 360 }} value={sid} onChange={e => { setSid(e.target.value); setSel({}); }}><option value="">— choose supplier —</option>{data.sups.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}</select></Field>
      <table className="table"><thead><tr><th></th><th>Product</th><th>In stock</th><th>Reorder level</th><th>Order qty</th><th>Alert date</th></tr></thead>
        <tbody>{data.alerts.map(a => { const p = product(a.product_id); const ok = sid && supplies(a.product_id); return (
          <tr key={a.alert_id} style={{ opacity: !sid || ok ? 1 : 0.4 }}><td><input type="checkbox" disabled={!ok} checked={!!sel[a.product_id]} onChange={e => setSel({ ...sel, [a.product_id]: e.target.checked })} /></td>
            <td>{p?.product_name}{sid && !ok && <span className="text-muted" style={{ fontSize: 11 }}> (not supplied by this supplier)</span>}</td><td className="text-danger">{p?.stock_qty}</td><td>{p?.reorder_level}</td><td>{p && Math.max(p.reorder_level * 2 - p.stock_qty, 1)}</td><td>{a.alert_date}</td></tr>); })}</tbody></table>
      <button id="ro-create" className="btn btn-primary" disabled={busy} onClick={create}>Create purchase order</button>
    </div>
  );
}

export default function PurchaseOrdersPage() {
  const { can } = useAuth();
  const tabs = [['create', 'New order', 'Create purchase order', CreateTab], ['approve', 'Approve', 'Approve purchase orders', ApproveTab],
    ['track', 'Track orders', 'Track purchase order status', TrackTab], ['reorder', 'Reorder low stock', 'Reorder low-stock items', ReorderTab]].filter(t => can(t[2]));
  const [tab, setTab] = useState(tabs[0][0]);
  const Tab = tabs.find(t => t[0] === tab)[3];
  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle="Pending → Approved → Received → Paid" />
      <div className="tabs" style={{ marginBottom: 14 }}>{tabs.map(t => <button key={t[0]} id={`tab-${t[0]}`} className={`tab-btn ${tab === t[0] ? 'active' : ''}`} onClick={() => setTab(t[0])}>{t[1]}</button>)}</div>
      <Tab />
    </div>
  );
}
