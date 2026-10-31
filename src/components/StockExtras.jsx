// Extra Stock page parts that follow the sequence diagrams:
// SD 14 Receive purchase stock, SD 16 Track batch / serial numbers, SD 17 Verify stock consistency,
// SD 19 Issue spare parts, SD 21 Manage spare part inventory.
import { useState } from 'react';
import { Search, PackageCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  PRODUCTS, SUPPLIERS, PURCHASE_ORDERS, STOCK_MOVEMENTS, BATCHES, SPARE_PART_REQUESTS, REORDER_REQUESTS,
  SERVICE_JOBS, getUser, newSmId, newBatchId, today, newReorderId, lowStockFirst, newestFirst } from '../data/store';

const prodName = (id) => PRODUCTS.find(p => p.id === id)?.name || id;
const supName = (id) => SUPPLIERS.find(s => s.id === id)?.name || id;
const OPEN_REQ = ['requested', 'reorder'];

// ------------------------------------------------------------------ SD 14
export function ReceivePurchaseTab({ toast, user, onChange }) {
  const [, refresh] = useState(0);
  const [poId, setPoId] = useState('');
  const [lines, setLines] = useState([]);
  const open = PURCHASE_ORDERS.filter(o => ['approved', 'ordered', 'partial'].includes(o.status));
  const po = PURCHASE_ORDERS.find(o => o.id === poId);

  const pick = (id) => {
    setPoId(id);
    const o = PURCHASE_ORDERS.find(x => x.id === id);
    setLines(o ? o.items.map(it => ({ productId: it.productId, name: it.name, ordered: it.qty, done: it.receivedQty || 0, qty: 0, batchNo: '' })) : []);
  };

  const save = () => {
    if (!po) return;
    if (lines.some(l => l.qty < 0 || l.qty > l.ordered - l.done)) { toast.error('Quantity cannot exceed the ordered balance'); return; }
    if (lines.every(l => !l.qty)) { toast.error('Enter the quantity received for at least one item'); return; }
    lines.forEach(l => {
      if (!l.qty) return;
      const item = po.items.find(it => it.productId === l.productId);
      item.receivedQty = (item.receivedQty || 0) + l.qty;
      const p = PRODUCTS.find(x => x.id === l.productId);
      if (p) p.stock += l.qty;
      STOCK_MOVEMENTS.push({ id: newSmId(), productId: l.productId, type: 'in', qty: l.qty, ref: po.id,
        note: `Stock received${l.batchNo ? ` (Batch: ${l.batchNo})` : ''}`, date: today(), userId: user?.id });
      if (l.batchNo.trim()) {
        BATCHES.push({ id: newBatchId(), batchNo: l.batchNo.trim(), productId: l.productId, quantity: l.qty, receivedDate: today(),
          supplierWarrantyExpiry: today().replace(/^\d{4}/, y => String(+y + 1)), supplierRef: po.id, status: 'active' });
      }
    });
    const complete = po.items.every(it => (it.receivedQty || 0) >= it.qty);
    po.status = complete ? 'received' : 'partial';
    if (complete) { po.receivedDate = today(); po.payableStatus = 'pending'; }
    toast.success(complete ? `Stock received – order ${po.id} complete` : `Partial receipt recorded – balance due on ${po.id}`);
    onChange?.();
    pick(complete ? '' : po.id);
    refresh(n => n + 1);
  };

  return (
    <div className="card" id="receive-purchase">
      <div className="card-header"><div className="card-title">📥 Receive Purchase Stock</div></div>
      <div className="card-body">
        {open.length === 0 ? (
          <div className="alert alert-info" id="no-open-po">No purchase orders are waiting to be received</div>
        ) : (
          <>
            <div className="form-group" style={{ maxWidth: 420 }}>
              <label className="form-label">Purchase order</label>
              <select id="receive-po" className="form-select" value={poId} onChange={e => pick(e.target.value)}>
                <option value="">Select a purchase order…</option>
                {open.map(o => <option key={o.id} value={o.id}>{o.id} – {supName(o.supplierId)} ({o.status})</option>)}
              </select>
            </div>
            {po && (
              <>
                <table className="table" style={{ marginTop: 12 }}>
                  <thead><tr><th>Product</th><th>Ordered</th><th>Received so far</th><th>Balance</th><th>Receive now</th><th>Batch / serial no.</th></tr></thead>
                  <tbody>
                    {lines.map((l, i) => {
                      const bal = l.ordered - l.done;
                      return (
                        <tr key={l.productId}>
                          <td>{l.name}</td><td>{l.ordered}</td><td>{l.done}</td><td>{bal}</td>
                          <td><input id={`recv-qty-${i}`} type="number" min={0} max={bal} className="form-input" style={{ width: 90 }} value={l.qty}
                            onChange={e => setLines(ls => ls.map((x, j) => j === i ? { ...x, qty: +e.target.value } : x))} />
                            {l.qty > bal && <div style={{ color: 'var(--danger-400)', fontSize: 11 }}>More than balance</div>}</td>
                          <td><input id={`recv-batch-${i}`} className="form-input" placeholder="optional" value={l.batchNo}
                            onChange={e => setLines(ls => ls.map((x, j) => j === i ? { ...x, batchNo: e.target.value } : x))} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <button id="btn-save-receipt" className="btn btn-success" style={{ marginTop: 12 }} onClick={save}>
                  <PackageCheck size={15} /> Record receipt
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ SD 16
export function BatchesTab({ toast, canMark }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const [, refresh] = useState(0);

  const search = () => {
    const b = BATCHES.find(x => x.batchNo.toLowerCase() === q.trim().toLowerCase());
    if (!b) { setSel(null); toast.error('No record for this batch number'); return; }
    setSel(b);
  };
  const markOut = () => {
    sel.status = 'out-of-warranty';
    toast.success(`Batch ${sel.batchNo} marked out of supplier warranty`);
    refresh(n => n + 1);
  };
  const expired = (b) => b.supplierWarrantyExpiry < today();
  const history = sel ? STOCK_MOVEMENTS.filter(m => m.productId === sel.productId &&
    ((m.note || '').includes(sel.batchNo) || m.ref === sel.supplierRef || m.ref === `TAG:${sel.batchNo}`)) : [];

  return (
    <div className="card" id="batches">
      <div className="card-header"><div className="card-title">🏷️ Batch / Serial Numbers</div></div>
      <div className="card-body">
        <div style={{ display: 'flex', gap: 8, maxWidth: 480 }}>
          <input id="batch-search" className="form-input" placeholder="Enter batch or serial number" value={q}
            onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} />
          <button id="btn-batch-search" className="btn btn-primary" onClick={search}><Search size={14} /> Search</button>
        </div>

        {sel && (
          <div id="batch-details" style={{ marginTop: 16, padding: 12, border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{sel.batchNo} – {prodName(sel.productId)}</div>
            <div style={{ fontSize: 13, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 4 }}>
              <span>Quantity: {sel.quantity}</span><span>Received: {sel.receivedDate}</span>
              <span>Supplier reference: {sel.supplierRef}</span>
              <span>Supplier warranty until: {sel.supplierWarrantyExpiry} {expired(sel) && <span className="badge badge-danger">expired</span>}</span>
              <span>Status: <span className={`badge badge-${sel.status === 'active' ? 'success' : 'gray'}`}>{sel.status}</span></span>
            </div>
            <div style={{ fontWeight: 600, marginTop: 12 }}>History</div>
            {history.length === 0 ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No stock movements recorded for this batch</div> : (
              <table className="table" style={{ marginTop: 6 }}>
                <thead><tr><th>Date</th><th>Type</th><th>Qty</th><th>Reference</th><th>Note</th></tr></thead>
                <tbody>{history.map(m => <tr key={m.id}><td>{m.date}</td><td>{m.type}</td><td>{m.qty}</td><td>{m.ref}</td><td>{m.note}</td></tr>)}</tbody>
              </table>
            )}
            {canMark && sel.status === 'active' && expired(sel) && (
              <button id="btn-mark-out-warranty" className="btn btn-warning" style={{ marginTop: 10 }} onClick={markOut}>
                Mark out of supplier warranty
              </button>
            )}
          </div>
        )}

        <table className="table" style={{ marginTop: 16 }}>
          <thead><tr><th>Batch / serial</th><th>Product</th><th>Qty</th><th>Received</th><th>Supplier warranty</th><th>Status</th></tr></thead>
          <tbody>
            {newestFirst(BATCHES, 'receivedDate').map(b => (
              <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => { setQ(b.batchNo); setSel(b); }}>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{b.batchNo}</td><td>{prodName(b.productId)}</td><td>{b.quantity}</td>
                <td>{b.receivedDate}</td><td>{b.supplierWarrantyExpiry}{expired(b) && ' ⚠️'}</td>
                <td><span className={`badge badge-${b.status === 'active' ? 'success' : 'gray'}`}>{b.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ SD 17
export function VerifyStockModal({ toast, user, onClose, onChange }) {
  const [counts, setCounts] = useState(() => Object.fromEntries(PRODUCTS.map(p => [p.id, p.stock])));
  const [diffs, setDiffs] = useState(null);

  const verify = () => {
    const d = PRODUCTS.filter(p => Number(counts[p.id]) !== p.stock).map(p => ({ p, counted: Number(counts[p.id]), diff: Number(counts[p.id]) - p.stock }));
    if (d.some(x => Number.isNaN(x.counted) || x.counted < 0)) { toast.error('Counted quantity must be zero or more'); return; }
    setDiffs(d);
    if (d.length === 0) toast.success('Stock is consistent – counted quantities match the system');
    else toast.warning(`${d.length} product(s) do not match the system`);
  };
  const correct = () => {
    diffs.forEach(({ p, counted, diff }) => {
      p.stock = counted;
      STOCK_MOVEMENTS.push({ id: newSmId(), productId: p.id, type: 'adj', qty: Math.abs(diff), ref: 'COUNT',
        note: `Stock count correction (${diff > 0 ? '+' : ''}${diff})`, date: today(), userId: user?.id });
    });
    toast.success(`Stock corrected for ${diffs.length} product(s)`);
    onChange?.(); onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 760 }} id="verify-modal">
        <div className="modal-header"><span style={{ fontSize: 20 }}>🧮</span><div className="modal-title">Verify Stock Consistency</div></div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Enter the quantity counted on the shelf for each product, then press Verify.</p>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            <table className="table">
              <thead><tr><th>Product</th><th>System</th><th>Counted</th><th>Difference</th></tr></thead>
              <tbody>
                {lowStockFirst(PRODUCTS).map(p => {
                  const diff = Number(counts[p.id]) - p.stock;
                  return (
                    <tr key={p.id}>
                      <td>{p.name}</td><td>{p.stock}</td>
                      <td><input id={`count-${p.id}`} type="number" min={0} className="form-input" style={{ width: 90 }} value={counts[p.id]}
                        onChange={e => { setCounts(c => ({ ...c, [p.id]: e.target.value })); setDiffs(null); }} /></td>
                      <td style={{ color: diff ? 'var(--danger-400)' : 'var(--text-muted)', fontWeight: diff ? 700 : 400 }}>{diff ? (diff > 0 ? `+${diff}` : diff) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {diffs && diffs.length === 0 && <div id="verify-ok" className="alert alert-success" style={{ marginTop: 10 }}><CheckCircle2 size={15} /> Stock is consistent</div>}
          {diffs && diffs.length > 0 && <div id="verify-diff" className="alert alert-warning" style={{ marginTop: 10 }}><AlertTriangle size={15} /> {diffs.length} difference(s) found: {diffs.map(x => `${x.p.name} (${x.diff > 0 ? '+' : ''}${x.diff})`).join(', ')}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
          <button id="btn-verify-count" className="btn btn-primary" onClick={verify}>Verify</button>
          {diffs && diffs.length > 0 && <button id="btn-correct-stock" className="btn btn-success" onClick={correct}>Correct stock</button>}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ SD 19 + SD 21
export function SparePartsTab({ toast, user, canIssue, canManage, onChange }) {
  const [, refresh] = useState(0);
  const [note, setNote] = useState(null);
  const [levels, setLevels] = useState({});
  const parts = PRODUCTS.filter(p => p.category === 'CAT006');
  const done = () => { refresh(n => n + 1); onChange?.(); };

  const issue = (r) => {
    const p = PRODUCTS.find(x => x.id === r.productId);
    if (!p || p.stock < r.requestedQty) {
      r.status = 'reorder';
      if (!REORDER_REQUESTS.some(x => x.productId === r.productId && x.status === 'open')) {
        REORDER_REQUESTS.push({ id: newReorderId(), productId: r.productId,
          qty: Math.max(r.requestedQty, (p?.minStock || 0) * 2), requestDate: today(), status: 'open', raisedBy: user?.id, sprId: r.id });
      }
      toast.warning('Spare part is out of stock – reorder raised');
      done(); return;
    }
    p.stock -= r.requestedQty;
    r.issuedQty = r.requestedQty; r.status = 'issued'; r.issuedBy = user?.id; r.issueDate = today();
    STOCK_MOVEMENTS.push({ id: newSmId(), productId: p.id, type: 'out', qty: r.requestedQty, ref: r.serviceJobId, note: `Spare part issued (${r.id})`, date: today(), userId: user?.id });
    setNote({ no: `ISN-${r.id.slice(4)}`, r, p });
    toast.success(`Spare part issued – issue note ISN-${r.id.slice(4)}`);
    done();
  };

  const saveLevel = (p) => {
    const v = levels[p.id];
    if (v === undefined || v === '' || !Number.isInteger(Number(v)) || Number(v) < 0) { toast.error('Please enter a valid reorder level'); return; }
    p.minStock = Number(v);
    toast.success(`Reorder level updated for ${p.name}`);
    done();
  };
  const obsolete = (p) => {
    if (SPARE_PART_REQUESTS.some(r => r.productId === p.id && OPEN_REQ.includes(r.status))) {
      toast.error('Cannot deactivate – open requests exist'); return;
    }
    p.obsolete = true;
    toast.success(`${p.name} marked obsolete`);
    done();
  };

  return (
    <>
      <div className="card" id="spare-requests" style={{ marginBottom: 16 }}>
        <div className="card-header"><div className="card-title">🔧 Spare Part Requests</div></div>
        <div className="card-body">
          {SPARE_PART_REQUESTS.length === 0 ? <div className="alert alert-info">No spare part requests</div> : (
            <table className="table">
              <thead><tr><th>Request</th><th>Service job</th><th>Part</th><th>Qty</th><th>In stock</th><th>Requested by</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {newestFirst(SPARE_PART_REQUESTS, 'requestDate').map(r => {
                  const p = PRODUCTS.find(x => x.id === r.productId);
                  return (
                    <tr key={r.id}>
                      <td>{r.id}</td><td>{r.serviceJobId}</td><td>{p?.name || r.productId}</td><td>{r.requestedQty}</td><td>{p?.stock ?? 0}</td>
                      <td>{getUser(r.requestedBy)?.name || r.requestedBy}</td>
                      <td><span className={`badge badge-${r.status === 'issued' ? 'success' : r.status === 'reorder' ? 'danger' : 'warning'}`}>{r.status}</span></td>
                      <td>{canIssue && OPEN_REQ.includes(r.status) && <button id={`issue-${r.id}`} className="btn btn-primary btn-sm" onClick={() => issue(r)}>Issue</button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {note && (
            <div id="issue-note" className="alert alert-success" style={{ marginTop: 10 }}>
              Issue note {note.no}: {note.r.requestedQty} × {note.p.name} issued to {getUser(note.r.requestedBy)?.name} for {note.r.serviceJobId}
              {' '}(job: {SERVICE_JOBS.find(j => j.id === note.r.serviceJobId)?.customerName || '—'}) on {today()}
            </div>
          )}
          {REORDER_REQUESTS.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 13 }} id="reorder-list">
              <b>Reorder requests sent to Purchasing:</b> {REORDER_REQUESTS.map(x => `${x.id} ${prodName(x.productId)} × ${x.qty} (${x.status})`).join(' · ')}
            </div>
          )}
        </div>
      </div>

      <div className="card" id="spare-inventory">
        <div className="card-header"><div className="card-title">🗂️ Spare Part Inventory</div></div>
        <div className="card-body">
          <table className="table">
            <thead><tr><th>Part</th><th>Stock</th><th>Reorder level</th><th>Status</th>{canManage && <th>Actions</th>}</tr></thead>
            <tbody>
              {lowStockFirst(parts).map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td><td>{p.stock}</td>
                  <td>{canManage && !p.obsolete ? (
                    <input id={`reorder-${p.id}`} type="number" min={0} className="form-input" style={{ width: 90 }}
                      value={levels[p.id] ?? p.minStock} onChange={e => setLevels(l => ({ ...l, [p.id]: e.target.value }))} />
                  ) : p.minStock}</td>
                  <td>{p.obsolete ? <span className="badge badge-gray">obsolete</span> : p.stock <= p.minStock ? <span className="badge badge-warning">reorder</span> : <span className="badge badge-success">ok</span>}</td>
                  {canManage && <td style={{ display: 'flex', gap: 6 }}>
                    {!p.obsolete && <button id={`save-reorder-${p.id}`} className="btn btn-outline btn-sm" onClick={() => saveLevel(p)}>Save level</button>}
                    {!p.obsolete && <button id={`obsolete-${p.id}`} className="btn btn-danger btn-sm" onClick={() => obsolete(p)}>Mark obsolete</button>}
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
