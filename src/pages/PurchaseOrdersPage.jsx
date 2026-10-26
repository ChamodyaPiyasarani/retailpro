import { useState } from 'react';
import { Search, Plus, CheckCircle, Truck, AlertTriangle, Clock, Package, Edit2 } from 'lucide-react';
import { SUPPLIERS, PURCHASE_ORDERS, PRODUCTS, STOCK_MOVEMENTS, fmt, newPoId, newSmId } from '../data/mockData';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { format, addDays } from 'date-fns';

function POModal({ po, onClose, onSave }) {
  const [supplierId, setSupplierId] = useState(po?.supplierId || '');
  const [expectedDate, setExpectedDate] = useState(po?.expectedDate || format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [lines, setLines] = useState(po?.items || []);
  const [newLine, setNewLine] = useState({ productId:'', qty:1, unitCost:0 });

  const addLine = () => {
    if (!newLine.productId) return;
    const p = PRODUCTS.find(x => x.id === newLine.productId);
    if (!p) return;
    setLines(ls => [...ls, { productId: p.id, name: p.name, qty: newLine.qty, unitCost: newLine.unitCost || p.cost, total: newLine.qty * (newLine.unitCost || p.cost) }]);
    setNewLine({ productId:'', qty:1, unitCost:0 });
  };

  const grandTotal = lines.reduce((s,l) => s + l.qty*l.unitCost, 0);

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <span style={{ fontSize:20 }}>📋</span>
          <div className="modal-title">{po ? 'Edit Purchase Order' : 'New Purchase Order'}</div>
        </div>
        <div className="modal-body">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Supplier *</label>
              <select className="form-select" value={supplierId} onChange={e=>setSupplierId(e.target.value)}>
                <option value="">Select supplier…</option>
                {SUPPLIERS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Expected Delivery</label>
              <input type="date" className="form-input" value={expectedDate} onChange={e=>setExpectedDate(e.target.value)} />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Order Lines</div>
            {lines.map((l,i) => (
              <div key={i} style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8, padding:'8px 12px', background:'var(--bg-overlay)', borderRadius:8 }}>
                <span style={{ flex:1, fontSize:13 }}>{l.name}</span>
                <span style={{ fontSize:13, color:'var(--text-muted)' }}>Qty: {l.qty}</span>
                <span style={{ fontSize:13, fontFamily:'var(--font-mono)' }}>{fmt(l.unitCost)}/unit</span>
                <span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{fmt(l.qty*l.unitCost)}</span>
                <button className="btn btn-ghost btn-sm btn-icon" style={{ color:'var(--danger-400)' }} onClick={()=>setLines(ls=>ls.filter((_,j)=>j!==i))}>✕</button>
              </div>
            ))}

            {/* Add line */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:8, marginTop:8 }}>
              <select className="form-select" value={newLine.productId} onChange={e=>{
                const p=PRODUCTS.find(x=>x.id===e.target.value);
                setNewLine(n=>({...n,productId:e.target.value,unitCost:p?.cost||0}));
              }}>
                <option value="">Add product…</option>
                {PRODUCTS.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
              </select>
              <input type="number" className="form-input" value={newLine.qty} min={1} onChange={e=>setNewLine(n=>({...n,qty:+e.target.value}))} style={{ width:70 }} placeholder="Qty" />
              <input type="number" className="form-input" value={newLine.unitCost} onChange={e=>setNewLine(n=>({...n,unitCost:+e.target.value}))} style={{ width:100 }} placeholder="Unit cost" />
              <button className="btn btn-outline btn-sm" onClick={addLine}><Plus size={14}/> Add</button>
            </div>
          </div>

          {lines.length > 0 && (
            <div style={{ display:'flex', justifyContent:'flex-end', fontSize:17, fontWeight:800, color:'var(--primary-300)', fontFamily:'var(--font-mono)' }}>
              Grand Total: {fmt(grandTotal)}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!supplierId || lines.length === 0} onClick={() => onSave({ supplierId, expectedDate, lines, grandTotal })}>
            {po ? 'Update PO' : 'Create PO'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiveModal({ po, onClose, onSave }) {
  const [lines, setLines] = useState(po.items.map(i => ({ ...i, received: i.qty })));
  const hasDiscrepancy = lines.some(l => l.received !== l.qty);
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <Package size={20} color="var(--success-400)" />
          <div className="modal-title">Receive Goods — {po.id}</div>
        </div>
        <div className="modal-body">
          {hasDiscrepancy && (
            <div className="alert alert-warning"><AlertTriangle size={15}/> Quantity discrepancy detected. Items will be flagged for review.</div>
          )}
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Product</th><th>Ordered</th><th>Received</th><th>Discrepancy</th></tr></thead>
              <tbody>
                {lines.map((l,i) => (
                  <tr key={i}>
                    <td>{l.name}</td>
                    <td>{l.qty}</td>
                    <td>
                      <input type="number" className="form-input" value={l.received} min={0}
                        onChange={e => setLines(ls => ls.map((x,j) => j===i ? {...x,received:+e.target.value} : x))}
                        style={{ width:80 }}
                      />
                    </td>
                    <td>
                      {l.received !== l.qty
                        ? <span className="badge badge-warning">Δ {l.received - l.qty}</span>
                        : <span className="badge badge-success">✓ Match</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={() => onSave(lines)}>
            <CheckCircle size={14}/> Confirm Receipt
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseOrdersPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState(PURCHASE_ORDERS);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [receiving, setReceiving] = useState(null);

  const filtered = orders.filter(po => {
    const sup = SUPPLIERS.find(s => s.id === po.supplierId);
    return (statusFilter === 'all' || po.status === statusFilter) &&
      (po.id.toLowerCase().includes(q.toLowerCase()) || sup?.name.toLowerCase().includes(q.toLowerCase()));
  });

  const statusBadge = (s) => {
    const map = { draft:'gray', approved:'primary', ordered:'accent', received:'success', cancelled:'danger' };
    return <span className={`badge badge-${map[s]||'gray'}`}>{s.charAt(0).toUpperCase()+s.slice(1)}</span>;
  };

  const isOverdue = (po) => po.status !== 'received' && po.expectedDate && po.expectedDate < format(new Date(),'yyyy-MM-dd');

  const handleCreate = ({ supplierId, expectedDate, lines, grandTotal }) => {
    const today = format(new Date(),'yyyy-MM-dd');
    const newPO = {
      id: newPoId(), supplierId, date: today, expectedDate,
      items: lines.map(l => ({ ...l, total: l.qty * l.unitCost })),
      subtotal: grandTotal, grandTotal,
      status: 'approved', payableStatus: 'none',
      createdBy: user?.id, approvedBy: user?.id,
    };
    setOrders(os => [...os, newPO]);
    PURCHASE_ORDERS.push(newPO);
    toast.success(`Purchase order ${newPO.id} created`);
    setModal(null);
  };

  const handleReceive = (receivedLines) => {
    const today = format(new Date(),'yyyy-MM-dd');
    setOrders(os => os.map(o => o.id === receiving.id ? { ...o, status:'received', receivedDate:today, payableStatus:'pending', items: receivedLines } : o));
    const poi = PURCHASE_ORDERS.findIndex(o => o.id === receiving.id);
    if (poi !== -1) { PURCHASE_ORDERS[poi].status = 'received'; PURCHASE_ORDERS[poi].receivedDate = today; PURCHASE_ORDERS[poi].payableStatus = 'pending'; }

    // Update stock
    receivedLines.forEach(l => {
      const pidx = PRODUCTS.findIndex(p => p.id === l.productId);
      if (pidx !== -1) {
        PRODUCTS[pidx].stock += l.received;
        STOCK_MOVEMENTS.push({ id: newSmId(), productId: l.productId, type:'in', qty:l.received, ref: receiving.id, note:'Purchase received', date:today, userId: user?.id });
      }
    });

    toast.success(`Goods received for ${receiving.id} — stock updated`);
    setReceiving(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">{orders.length} total orders · {orders.filter(o=>o.status==='received').length} received</p>
        </div>
        <div className="page-header-actions">
          <button id="btn-new-po" className="btn btn-primary" onClick={() => setModal('new')}>
            <Plus size={15}/> New Purchase Order
          </button>
        </div>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <div className="search-bar" style={{ flex:1 }}>
          <Search size={15} color="var(--text-muted)" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search PO number or supplier…" />
        </div>
        <select className="form-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ width:160 }}>
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="ordered">Ordered</option>
          <option value="received">Received</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>PO Number</th><th>Supplier</th><th>Date</th><th>Expected</th><th>Grand Total</th><th>Status</th><th>Payable</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No purchase orders</div></div></td></tr>
            )}
            {filtered.map(po => {
              const sup = SUPPLIERS.find(s=>s.id===po.supplierId);
              const overdue = isOverdue(po);
              return (
                <tr key={po.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {overdue && <AlertTriangle size={14} color="var(--danger-400)" />}
                      <span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{po.id}</span>
                    </div>
                    {overdue && <div style={{ fontSize:11, color:'var(--danger-400)' }}>Overdue!</div>}
                  </td>
                  <td>
                    <div style={{ fontWeight:600 }}>{sup?.name}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{sup?.contact}</div>
                  </td>
                  <td style={{ fontSize:13 }}>{po.date}</td>
                  <td style={{ fontSize:13, color: overdue ? 'var(--danger-400)':'var(--text-secondary)' }}>{po.expectedDate || '—'}</td>
                  <td><span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{fmt(po.grandTotal)}</span></td>
                  <td>{statusBadge(po.status)}</td>
                  <td>
                    <span className={`badge badge-${po.payableStatus==='paid'?'success':po.payableStatus==='pending'?'warning':'gray'}`}>
                      {po.payableStatus === 'none' ? 'N/A' : po.payableStatus}
                    </span>
                  </td>
                  <td>
                    <div className="table-action-cell">
                      {(po.status === 'approved' || po.status === 'ordered') && (
                        <button id={`po-receive-${po.id}`} className="btn btn-success btn-sm" onClick={() => setReceiving(po)}>
                          <Package size={13}/> Receive
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && <POModal po={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={handleCreate} />}
      {receiving && <ReceiveModal po={receiving} onClose={() => setReceiving(null)} onSave={handleReceive} />}
    </div>
  );
}
