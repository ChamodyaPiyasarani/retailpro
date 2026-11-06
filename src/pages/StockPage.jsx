// Stock Form – SD "View stock levels" (extend: Show low-stock alert), SD "Receive stock" and
// SD "Issue spare parts" (include: Update stock quantity), SD "Adjust stock"
import { useState } from 'react';
import Product from '../classes/Product';
import StockAlert from '../classes/StockAlert';
import StockMovement from '../classes/StockMovement';
import PurchaseOrder from '../classes/PurchaseOrder';
import PurchaseOrderItem from '../classes/PurchaseOrderItem';
import SparePartRequest from '../classes/SparePartRequest';
import { readAll } from '../classes/db';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Modal, Field, Badge, useLoad, useAction, Loading, Empty, nameOf } from '../components/ui';

function LevelsTab() {
  // check low stock -> create a low-stock alert for each low product (only one open alert per product)
  const { data, error } = useLoad(async () => {
    const products = await Product.getAll();
    for (const p of products.filter(x => x.is_active && Product.isLowStock(x))) await StockAlert.create(p.product_id);
    return { products, alerts: await StockAlert.getOpen(), cats: await readAll('category') };
  });
  const [hist, setHist] = useState(null);
  if (!data) return <Loading error={error} />;
  const low = data.products.filter(p => p.is_active && Product.isLowStock(p));
  const history = async (p) => setHist({ p, moves: (await readAll('stock_movement', { product_id: p.product_id }, 'movement_id')).reverse(), users: await readAll('user') });
  return (<>
    {low.length > 0 && <div id="low-stock-alert" className="alert alert-warning" style={{ marginBottom: 12 }}>⚠️ Low stock: {low.map(p => `${p.product_name} (${p.stock_qty})`).join(', ')}</div>}
    <div className="table-container"><table className="table">
      <thead><tr><th>Product</th><th>Category</th><th>In stock</th><th>Reorder level</th><th>Status</th><th></th></tr></thead>
      <tbody>{data.products.filter(p => p.is_active).map(p => <tr key={p.product_id}><td>{p.product_name}</td><td>{nameOf(data.cats, 'category_id', p.category_id, 'category_name')}</td><td>{p.stock_qty}</td><td>{p.reorder_level}</td>
        <td>{Product.isLowStock(p) ? <Badge text="Low stock" /> : <Badge text="Active" />}</td>
        <td><button className="btn btn-ghost btn-sm" onClick={() => history(p)}>Stock history</button></td></tr>)}</tbody>
    </table></div>
    {hist && (
      <Modal wide title={`Stock history – ${hist.p.product_name}`} onClose={() => setHist(null)}>
        <p>In stock now: <b>{hist.p.stock_qty}</b> · reorder level {hist.p.reorder_level}</p>
        {hist.moves.length === 0 ? <Empty text="No stock movements yet" /> : (
          <table className="table" id="stock-history"><thead><tr><th>Date</th><th>Type</th><th>Quantity</th><th>Reason</th><th>Reference</th><th>By</th></tr></thead>
            <tbody>{hist.moves.map(m => <tr key={m.movement_id}><td>{m.movement_date}</td><td>{m.movement_type}</td><td>{m.movement_type === 'Out' ? -Math.abs(m.quantity) : m.quantity}</td><td>{m.reason}</td>
              <td>{m.po_id ? `PO-${m.po_id}` : m.job_id ? `JOB-${m.job_id}` : '—'}</td><td>{nameOf(hist.users, 'user_id', m.user_id, 'name')}</td></tr>)}</tbody></table>
        )}
        <p className="text-muted" style={{ fontSize: 12 }}>Sales reduce the stock straight away; they are shown in the sales history.</p>
      </Modal>
    )}
  </>);
}

function ReceiveTab() {
  const { user } = useAuth();
  const { act, busy } = useAction();
  const { data, error, reload } = useLoad(async () => ({ pos: (await PurchaseOrder.track()).filter(p => p.status === 'Approved'), products: await readAll('product'), sups: await readAll('supplier') }));
  const [sel, setSel] = useState(null);
  if (!data) return <Loading error={error} />;
  const receive = async () => {
    const ok = await act(async () => {
      for (const i of sel.items) {
        const q = Number(sel.qty[i.item_id] || 0);
        if (q < 0 || !Number.isInteger(q) || q + i.received_qty > i.quantity) throw new Error('Check the quantities');
      }
      for (const i of sel.items) {
        const q = Number(sel.qty[i.item_id] || 0);
        if (!q) continue;
        await StockMovement.recordIn({ product_id: i.product_id, quantity: q, user_id: user.user_id, po_id: sel.po_id });
        await PurchaseOrderItem.receive(i.item_id, q);
        const p = await Product.increaseStock(i.product_id, q);
        if (!Product.isLowStock(p)) await StockAlert.resolve(i.product_id);
      }
      await PurchaseOrder.updateStatus(sel.po_id, 'Received', 'Approved');
    }, 'Stock updated');
    if (ok) { setSel(null); reload(); }
  };
  return (<>
    {data.pos.length === 0 ? <Empty text="No approved purchase orders to receive" /> : (
      <table className="table"><thead><tr><th>PO</th><th>Supplier</th><th>Ordered</th><th>Items</th><th></th></tr></thead>
        <tbody>{data.pos.map(p => <tr key={p.po_id}><td>PO-{p.po_id}</td><td>{nameOf(data.sups, 'supplier_id', p.supplier_id, 'supplier_name')}</td><td>{p.order_date}</td><td>{p.items.length}</td>
          <td><button className="btn btn-primary btn-sm" onClick={() => setSel({ ...p, qty: Object.fromEntries(p.items.map(i => [i.item_id, i.quantity - i.received_qty])) })}>Receive</button></td></tr>)}</tbody></table>
    )}
    {sel && (
      <Modal wide title={`Receive PO-${sel.po_id}`} onClose={() => setSel(null)} footer={<><button className="btn btn-outline" onClick={() => setSel(null)}>Cancel</button><button id="receive-submit" className="btn btn-primary" disabled={busy} onClick={receive}>Record stock in</button></>}>
        <table className="table"><thead><tr><th>Product</th><th>Ordered</th><th>Received before</th><th>Received now</th></tr></thead>
          <tbody>{sel.items.map(i => <tr key={i.item_id}><td>{nameOf(data.products, 'product_id', i.product_id, 'product_name')}</td><td>{i.quantity}</td><td>{i.received_qty}</td>
            <td><input type="number" min="0" className="form-input" style={{ width: 90 }} value={sel.qty[i.item_id]} onChange={e => setSel({ ...sel, qty: { ...sel.qty, [i.item_id]: e.target.value } })} /></td></tr>)}</tbody></table>
      </Modal>
    )}
  </>);
}

function AdjustTab() {
  const { user } = useAuth();
  const { act, busy } = useAction();
  const { data, error, reload } = useLoad(async () => ({ products: (await Product.getAll()).filter(p => p.is_active), moves: (await StockMovement.getAll()).reverse().slice(0, 15) }));
  const [f, setF] = useState({ product_id: '', quantity: 1, direction: 'out', reason: 'Damaged' });
  if (!data) return <Loading error={error} />;
  const save = async () => {
    const ok = await act(async () => {
      const q = Number(f.quantity);
      if (!f.product_id || !Number.isInteger(q) || q < 1) throw new Error('Please choose the product and a quantity of 1 or more.');
      if (f.direction === 'out') { const { enough } = await Product.checkStock(Number(f.product_id), q); if (!enough) throw new Error('Not enough stock'); }
      await StockMovement.recordAdjustment({ product_id: Number(f.product_id), quantity: f.direction === 'out' ? -q : q, reason: f.reason, user_id: user.user_id });
      if (f.direction === 'out') await Product.reduceStock(Number(f.product_id), q); else await Product.increaseStock(Number(f.product_id), q);
    }, 'Stock adjusted');
    if (ok) { setF({ ...f, quantity: 1 }); reload(); }
  };
  return (<>
    <div className="card" style={{ maxWidth: 640, marginBottom: 14 }}>
      <Field label="Product"><select id="adj-product" className="form-select" value={f.product_id} onChange={e => setF({ ...f, product_id: e.target.value })}><option value="">— choose —</option>
        {data.products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name} (stock {p.stock_qty})</option>)}</select></Field>
      <div className="form-row-3">
        <Field label="Quantity"><input id="adj-qty" type="number" min="1" className="form-input" value={f.quantity} onChange={e => setF({ ...f, quantity: e.target.value })} /></Field>
        <Field label="Change"><select id="adj-dir" className="form-select" value={f.direction} onChange={e => setF({ ...f, direction: e.target.value })}><option value="out">Remove from stock</option><option value="in">Add to stock</option></select></Field>
        <Field label="Reason"><select id="adj-reason" className="form-select" value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })}><option>Damaged</option><option>Returned by customer</option><option>Count correction</option></select></Field>
      </div>
      <button id="adj-save" className="btn btn-primary" disabled={busy} onClick={save}>Record adjustment</button>
    </div>
    <div className="chart-title">Latest stock movements</div>
    <table className="table"><thead><tr><th>Date</th><th>Type</th><th>Product</th><th>Qty</th><th>Reason</th></tr></thead>
      <tbody>{data.moves.map(m => <tr key={m.movement_id}><td>{m.movement_date}</td><td>{m.movement_type}</td><td>{nameOf(data.products, 'product_id', m.product_id, 'product_name')}</td><td>{m.quantity}</td><td>{m.reason}</td></tr>)}</tbody></table>
  </>);
}

function SparesTab() {
  const { user } = useAuth();
  const { act } = useAction();
  const { data, error, reload } = useLoad(async () => ({ reqs: await SparePartRequest.getOpen(), products: await readAll('product'), issued: (await readAll('spare_part_request', { status: 'Issued' }, 'request_id')).reverse() }));
  if (!data) return <Loading error={error} />;
  const issue = async (r) => { if (await act(() => SparePartRequest.issue(r.request_id, user.user_id), 'Spare part issued')) reload(); };
  return (<>
    <div className="chart-title">Waiting to be issued</div>
    {data.reqs.length === 0 ? <Empty text="No spare part requests" /> : (
    <table className="table"><thead><tr><th>Request</th><th>Date</th><th>Job</th><th>Spare part</th><th>Qty</th><th>In stock</th><th></th></tr></thead>
      <tbody>{data.reqs.map(r => { const p = data.products.find(x => x.product_id === r.product_id); return (
        <tr key={r.request_id}><td>SPR-{r.request_id}</td><td>{r.request_date}</td><td>JOB-{r.job_id}</td><td>{p?.product_name}</td><td>{r.quantity}</td><td>{p?.stock_qty}</td>
          <td><button className="btn btn-primary btn-sm" onClick={() => issue(r)}>Issue</button></td></tr>); })}</tbody></table>
    )}
    <div className="chart-title" style={{ marginTop: 18 }}>Issued spare parts</div>
    {data.issued.length === 0 ? <Empty text="Nothing issued yet" /> : (
      <table className="table" id="issued-spares"><thead><tr><th>Request</th><th>Requested</th><th>Job</th><th>Spare part</th><th>Qty</th><th>Status</th></tr></thead>
        <tbody>{data.issued.slice(0, 30).map(r => <tr key={r.request_id}><td>SPR-{r.request_id}</td><td>{r.request_date}</td><td>JOB-{r.job_id}</td><td>{nameOf(data.products, 'product_id', r.product_id, 'product_name')}</td><td>{r.quantity}</td><td><Badge text={r.status} /></td></tr>)}</tbody></table>
    )}
  </>);
}

export default function StockPage() {
  const { can } = useAuth();
  const tabs = [['levels', 'Stock levels', 'View stock levels', LevelsTab], ['receive', 'Receive stock', 'Receive stock', ReceiveTab], ['adjust', 'Adjust stock', 'Adjust stock', AdjustTab], ['spares', 'Spare parts', 'Issue spare parts', SparesTab]].filter(t => can(t[2]));
  const [tab, setTab] = useState(tabs[0][0]);
  const Tab = tabs.find(t => t[0] === tab)[3];
  return (
    <div>
      <PageHeader title="Stock" />
      <div className="tabs" style={{ marginBottom: 14 }}>{tabs.map(t => <button key={t[0]} id={`tab-${t[0]}`} className={`tab-btn ${tab === t[0] ? 'active' : ''}`} onClick={() => setTab(t[0])}>{t[1]}</button>)}</div>
      <Tab />
    </div>
  );
}
