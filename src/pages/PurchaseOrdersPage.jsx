import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, CheckCircle, AlertTriangle, Package, Edit2, FileText } from 'lucide-react';
import { SUPPLIERS, PURCHASE_ORDERS, PRODUCTS, STOCK_MOVEMENTS, QUOTATIONS, RETURNS, fmt, newPoId, newSmId, newQuoteId, getSupplier } from '../data/mockData';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { format, addDays } from 'date-fns';

function POModal({ po, onClose, onSave }) {
  const toast = useToast();
  const [supplierId, setSupplierId] = useState(po?.supplierId || '');
  const [quotationId, setQuotationId] = useState(po?.quotationId || '');
  const [urgent, setUrgent] = useState(!!po?.urgent);
  const [, refresh] = useState(0);
  const supplierQuotes = QUOTATIONS.filter(q => q.supplierId === supplierId);

  // Select supplier / request quote
  const requestQuote = () => {
    const q = { id: newQuoteId(), supplierId, requestDate: format(new Date(),'yyyy-MM-dd'), validUntil: format(addDays(new Date(), 30),'yyyy-MM-dd'), quotedTotal: 0, status: 'requested', note: 'Requested from new purchase order' };
    QUOTATIONS.push(q);
    refresh(n => n + 1);
    toast.success(`Quotation ${q.id} requested from ${getSupplier(supplierId)?.name}`);
  };
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
          <div className="modal-title">{po?.id ? `Edit Purchase Order ${po.id}` : 'New Purchase Order'}</div>
        </div>
        <div className="modal-body">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Supplier *</label>
              <select id="po-supplier" className="form-select" value={supplierId} onChange={e=>{ setSupplierId(e.target.value); setQuotationId(''); }}>
                <option value="">Select supplier…</option>
                {SUPPLIERS.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Expected Delivery</label>
              <input type="date" className="form-input" value={expectedDate} onChange={e=>setExpectedDate(e.target.value)} />
            </div>
          </div>

          {/* Supplier quotation */}
          {supplierId && (
            <div className="card-elevated" style={{ padding:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, gap:8, flexWrap:'wrap' }}>
                <span style={{ fontWeight:700, fontSize:13 }}>Supplier Quotation</span>
                <button id="po-request-quote" type="button" className="btn btn-outline btn-sm" onClick={requestQuote}><FileText size={13}/> Request Quote</button>
              </div>
              {supplierQuotes.length === 0 && <div style={{ fontSize:12, color:'var(--text-muted)' }}>No quotations from this supplier yet.</div>}
              {supplierQuotes.map(q => (
                <label key={q.id} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, padding:'4px 0', cursor: q.status === 'requested' ? 'not-allowed' : 'pointer' }}>
                  <input type="radio" name="po-quote" checked={quotationId === q.id} disabled={q.status === 'requested'} onChange={() => setQuotationId(q.id)} />
                  <span style={{ fontFamily:'var(--font-mono)' }}>{q.id}</span>
                  <span className={`badge badge-${q.status === 'requested' ? 'gray' : q.status === 'accepted' ? 'success' : 'primary'}`}>{q.status}</span>
                  <span style={{ color:'var(--text-muted)' }}>{q.quotedTotal ? fmt(q.quotedTotal) : 'awaiting price'} · valid until {q.validUntil}</span>
                </label>
              ))}
            </div>
          )}

          <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}>
            <input id="po-urgent" type="checkbox" checked={urgent} onChange={e=>setUrgent(e.target.checked)} /> Urgent reorder (high priority)
          </label>

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
          <button className="btn btn-primary" disabled={!supplierId || lines.length === 0} onClick={() => onSave({ supplierId, expectedDate, lines, grandTotal, quotationId: quotationId || null, urgent })}>
            {po?.id ? 'Update PO' : 'Create PO'}
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
  const { user, canDo } = useAuth();
  const [orders, setOrders] = useState(() => [...PURCHASE_ORDERS]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  // Open the right tab for the menu item that brought the user here
  // Buttons elsewhere can ask this page to open a form / tab / filter; apply it once, then clear it
  useEffect(() => {
    if (!location.state) return;
    if (location.state?.open === 'new' && canDo('po.create')) setModal('new');
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps
  const [receiving, setReceiving] = useState(null);
  const [tab, setTab] = useState('orders');

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

  const saveOrder = (po) => {
    setOrders(os => os.some(o => o.id === po.id) ? os.map(o => o.id === po.id ? po : o) : [...os, po]);
    const i = PURCHASE_ORDERS.findIndex(o => o.id === po.id);
    if (i !== -1) PURCHASE_ORDERS[i] = po; else PURCHASE_ORDERS.push(po);
  };

  // Create (draft) or update a draft purchase order
  const handleSave = ({ supplierId, expectedDate, lines, grandTotal, quotationId, urgent }) => {
    const items = lines.map(l => ({ ...l, total: l.qty * l.unitCost }));
    if (modal?.id) {
      saveOrder({ ...modal, supplierId, expectedDate, items, subtotal: grandTotal, grandTotal, quotationId, urgent });
      toast.success(`Purchase order ${modal.id} updated`);
    } else {
      const po = {
        id: newPoId(), supplierId, date: format(new Date(),'yyyy-MM-dd'), expectedDate, items,
        subtotal: grandTotal, grandTotal, quotationId, urgent,
        status: 'draft', payableStatus: 'none', createdBy: user?.id, approvedBy: null,
      };
      saveOrder(po);
      if (quotationId) { const q = QUOTATIONS.find(x => x.id === quotationId); if (q) q.status = 'accepted'; }
      toast.success(`Purchase order ${po.id} saved as draft — approve it to send to the supplier`);
    }
    setModal(null);
  };

  // Approve / update purchase details
  const approveOrder = (po) => {
    saveOrder({ ...po, status: 'approved', approvedBy: user?.id, approvedDate: format(new Date(),'yyyy-MM-dd') });
    toast.success(`${po.id} approved`);
  };

  // Reorder stock for frequently exchanged products
  const exchangeCount = (pid) => RETURNS.filter(r => r.type === 'exchange' && r.productId === pid).length;
  const reorderList = PRODUCTS
    .map(p => ({ p, exchanges: exchangeCount(p.id), low: p.stock <= p.minStock }))
    .filter(r => r.exchanges > 0 || r.low)
    .sort((a, b) => b.exchanges - a.exchanges || (a.p.stock - a.p.minStock) - (b.p.stock - b.p.minStock));
  const startReorder = ({ p, exchanges, low }) => {
    const qty = Math.max(p.minStock * 2 - p.stock, p.minStock, 1);
    setModal({ supplierId: p.supplierId, urgent: exchanges > 0 && low, expectedDate: format(addDays(new Date(), 5),'yyyy-MM-dd'),
      items: [{ productId: p.id, name: p.name, qty, unitCost: p.cost, total: qty * p.cost }] });
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
          {canDo('po.create') && (<button id="btn-new-po" className="btn btn-primary" onClick={() => setModal('new')}>
            <Plus size={15}/> New Purchase Order
          </button>)}
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab-btn ${tab==='orders'?'active':''}`} onClick={()=>setTab('orders')}>📋 Purchase Orders</button>
        <button id="tab-reorder" className={`tab-btn ${tab==='reorder'?'active':''}`} onClick={()=>setTab('reorder')}>🔁 Reorder Suggestions ({reorderList.length})</button>
        <button className={`tab-btn ${tab==='quotes'?'active':''}`} onClick={()=>setTab('quotes')}>🧾 Quotations ({QUOTATIONS.length})</button>
      </div>

      {tab === 'reorder' && (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Product</th><th>Exchanges</th><th>Stock / Min</th><th>Supplier</th><th>Priority</th><th></th></tr></thead>
            <tbody>
              {reorderList.length === 0 && <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-title">Nothing to reorder</div></div></td></tr>}
              {reorderList.map(r => (
                <tr key={r.p.id}>
                  <td style={{ fontWeight:600 }}>{r.p.emoji} {r.p.name}</td>
                  <td>{r.exchanges > 0 ? <span className="badge badge-warning">{r.exchanges} exchange{r.exchanges!==1?'s':''}</span> : '—'}</td>
                  <td style={{ fontFamily:'var(--font-mono)', color: r.low ? 'var(--danger-400)' : 'inherit' }}>{r.p.stock} / {r.p.minStock}</td>
                  <td style={{ fontSize:13 }}>{getSupplier(r.p.supplierId)?.name}</td>
                  <td>{r.exchanges > 0 && r.low ? <span className="badge badge-danger">Urgent</span> : <span className="badge badge-gray">Normal</span>}</td>
                  <td>{canDo('po.reorder') && <button className="btn btn-primary btn-sm" onClick={() => startReorder(r)}><Plus size={13}/> Create PO</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'quotes' && (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Quotation</th><th>Supplier</th><th>Requested</th><th>Valid until</th><th>Quoted total</th><th>Status</th></tr></thead>
            <tbody>
              {QUOTATIONS.map(qt => (
                <tr key={qt.id}>
                  <td style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{qt.id}</td>
                  <td>{getSupplier(qt.supplierId)?.name}<div style={{ fontSize:12, color:'var(--text-muted)' }}>{qt.note}</div></td>
                  <td style={{ fontSize:13 }}>{qt.requestDate}</td>
                  <td style={{ fontSize:13 }}>{qt.validUntil}</td>
                  <td style={{ fontFamily:'var(--font-mono)' }}>{qt.quotedTotal ? fmt(qt.quotedTotal) : '—'}</td>
                  <td><span className={`badge badge-${qt.status === 'requested' ? 'gray' : qt.status === 'accepted' ? 'success' : 'primary'}`}>{qt.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'orders' && (<>
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
                    {po.urgent && <span className="badge badge-danger" style={{ fontSize:10 }}>Urgent</span>}
                    {po.quotationId && <div style={{ fontSize:11, color:'var(--text-muted)' }}>Quote {po.quotationId}</div>}
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
                      {po.status === 'draft' && canDo('po.approve') && (
                        <button id={`po-approve-${po.id}`} className="btn btn-primary btn-sm" onClick={() => approveOrder(po)}>
                          <CheckCircle size={13}/> Approve
                        </button>
                      )}
                      {po.status === 'draft' && canDo('po.edit') && (
                        <button className="btn btn-ghost btn-sm btn-icon" title="Edit purchase order" onClick={() => setModal(po)}>
                          <Edit2 size={13}/>
                        </button>
                      )}
                      {(po.status === 'approved' || po.status === 'ordered') && canDo('po.receive') && (
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
      </>)}

      {modal && <POModal po={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
      {receiving && <ReceiveModal po={receiving} onClose={() => setReceiving(null)} onSave={handleReceive} />}
    </div>
  );
}
