import { useState } from 'react';
import { Plus, Search, CheckCircle, XCircle, AlertTriangle, RefreshCw, ArrowUpRight, PackageCheck, AlertOctagon } from 'lucide-react';
import {
  RETURNS, COMPLAINTS, CUSTOMERS, PRODUCTS, SALES_ORDERS, PAYMENTS, STOCK_MOVEMENTS,
  fmt, newRetId, newCmpId, newPayId, newSmId, getCustomer, getProduct, getSalesOrder
} from '../data/mockData';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

function ReturnModal({ onClose, onSave }) {
  const [form, setForm] = useState({ type:'refund', customerId:'', salesOrderId:'', productId:'', reason:'' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const orders = form.customerId ? SALES_ORDERS.filter(o=>o.customerId===form.customerId) : [];
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <RefreshCw size={18} color="var(--warning-400)" />
          <div className="modal-title">New Return / Exchange Request</div>
        </div>
        <div className="modal-body">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Request Type</label>
              <select className="form-select" value={form.type} onChange={e=>set('type',e.target.value)}>
                <option value="refund">Refund</option>
                <option value="exchange">Exchange</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Customer *</label>
              <select className="form-select" value={form.customerId} onChange={e=>set('customerId',e.target.value)}>
                <option value="">Select…</option>
                {CUSTOMERS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Sales Order</label>
              <select className="form-select" value={form.salesOrderId} onChange={e=>set('salesOrderId',e.target.value)}>
                <option value="">Select order…</option>
                {orders.map(o=><option key={o.id} value={o.id}>{o.invoiceNo}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Product</label>
              <select className="form-select" value={form.productId} onChange={e=>set('productId',e.target.value)}>
                <option value="">Select product…</option>
                {PRODUCTS.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason *</label>
            <textarea className="form-textarea" rows={3} value={form.reason} onChange={e=>set('reason',e.target.value)} placeholder="Describe the issue…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-warning" disabled={!form.customerId||!form.reason} onClick={()=>onSave(form)}>
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

function ComplaintModal({ onClose, onSave }) {
  const [form, setForm] = useState({ customerId:'', subject:'', description:'', priority:'normal' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <AlertTriangle size={18} color="var(--danger-400)" />
          <div className="modal-title">Log New Complaint</div>
        </div>
        <div className="modal-body">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Customer *</label>
              <select className="form-select" value={form.customerId} onChange={e=>set('customerId',e.target.value)}>
                <option value="">Select…</option>
                {CUSTOMERS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e=>set('priority',e.target.value)}>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input className="form-input" value={form.subject} onChange={e=>set('subject',e.target.value)} placeholder="Brief summary of the complaint" />
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-textarea" rows={3} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Detailed description…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" disabled={!form.customerId||!form.subject||!form.description} onClick={()=>onSave(form)}>
            Log Complaint
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReturnsPage() {
  const toast = useToast();
  const { user, canDo } = useAuth();
  const [returns, setReturns] = useState(RETURNS);
  const [complaints, setComplaints] = useState(COMPLAINTS);
  const [activeTab, setActiveTab] = useState('returns');
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState('');

  const handleReturnSave = (form) => {
    const ret = {
      id: newRetId(), ...form, status:'pending', warrantyValid:true,
      requestedBy: user?.id, approvedBy:null, refundAmount:0, refundStatus:'none',
      inspectionResult:null, canRestock:null,
      createdAt: format(new Date(),'yyyy-MM-dd'), resolvedAt:null,
    };
    RETURNS.push(ret);
    setReturns(rs => [...rs, ret]);
    toast.success('Return request submitted for approval');
    setModal(null);
  };

  const handleComplaintSave = (form) => {
    const cmp = {
      id: newCmpId(), ...form, status:'open', assignedTo: null,
      resolution:null, createdBy: user?.id,
      createdAt: format(new Date(),'yyyy-MM-dd'), resolvedAt:null,
    };
    COMPLAINTS.push(cmp);
    setComplaints(cs => [...cs, cmp]);
    toast.success('Complaint logged');
    setModal(null);
  };

  const approveReturn = (ret, approved) => {
    const updated = { ...ret, status: approved ? 'approved' : 'rejected', approvedBy: user?.id, resolvedAt: format(new Date(),'yyyy-MM-dd') };
    if (approved && ret.type === 'refund') {
      const so = SALES_ORDERS.find(o => o.id === ret.salesOrderId);
      updated.refundAmount = so?.amountPaid || 0;
      updated.refundStatus = 'pending';
    }
    setReturns(rs => rs.map(r => r.id === ret.id ? updated : r));
    const i = RETURNS.findIndex(r => r.id === ret.id);
    if (i !== -1) RETURNS[i] = updated;
    toast.success(`Request ${approved?'approved':'rejected'}`);
  };

  const processRefund = (ret) => {
    const updated = { ...ret, refundStatus:'processed' };
    const payment = { id: newPayId(), customerId: ret.customerId, salesOrderId: ret.salesOrderId, amount: ret.refundAmount, method:'transfer', date: format(new Date(),'yyyy-MM-dd'), recordedBy: user?.id, note:`Refund for ${ret.id}` };
    PAYMENTS.push(payment);
    setReturns(rs => rs.map(r => r.id === ret.id ? updated : r));
    const i = RETURNS.findIndex(r => r.id === ret.id);
    if (i !== -1) RETURNS[i] = updated;
    toast.success(`Refund of ${fmt(ret.refundAmount)} processed`);
  };

  const resolveComplaint = (cmp, resolution) => {
    const updated = { ...cmp, status:'resolved', resolution, resolvedAt: format(new Date(),'yyyy-MM-dd') };
    setComplaints(cs => cs.map(c => c.id === cmp.id ? updated : c));
    const i = COMPLAINTS.findIndex(c => c.id === cmp.id);
    if (i !== -1) COMPLAINTS[i] = updated;
    toast.success('Complaint resolved');
  };

  const inspectReturn = (ret, restock) => {
    const updated = {
      ...ret,
      inspectionResult: restock ? 'Serviceable / Inspected' : 'Damaged / Write-off',
      canRestock: restock,
      inventoryUpdated: true
    };
    if (restock) {
      const pidx = PRODUCTS.findIndex(p => p.id === ret.productId);
      if (pidx !== -1) {
        PRODUCTS[pidx].stock += 1;
        STOCK_MOVEMENTS.push({
          id: newSmId(), productId: ret.productId, type: 'in', qty: 1,
          ref: ret.id, note: 'Return restocked as serviceable inventory',
          date: format(new Date(), 'yyyy-MM-dd'), userId: user?.id
        });
      }
      toast.success('Item inspected and restocked as serviceable inventory');
    } else {
      STOCK_MOVEMENTS.push({
        id: newSmId(), productId: ret.productId, type: 'adj', qty: -1,
        ref: ret.id, note: 'Damaged returned item written off to scrap',
        date: format(new Date(), 'yyyy-MM-dd'), userId: user?.id
      });
      toast.warning('Item inspected and written off as scrap');
    }
    setReturns(rs => rs.map(r => r.id === ret.id ? updated : r));
    const i = RETURNS.findIndex(r => r.id === ret.id);
    if (i !== -1) RETURNS[i] = updated;
  };

  const escalateComplaint = (cmp) => {
    const updated = { ...cmp, priority: 'urgent', escalated: true };
    setComplaints(cs => cs.map(c => c.id === cmp.id ? updated : c));
    const i = COMPLAINTS.findIndex(c => c.id === cmp.id);
    if (i !== -1) COMPLAINTS[i] = updated;
    toast.warning(`Complaint ${cmp.id} escalated to Senior Management`);
  };

  const filteredReturns = returns.filter(r => {
    const c = getCustomer(r.customerId);
    return !q || r.id.includes(q) || c?.name.toLowerCase().includes(q.toLowerCase()) || r.reason?.toLowerCase().includes(q.toLowerCase());
  });

  const filteredComplaints = complaints.filter(c => {
    const cu = getCustomer(c.customerId);
    return !q || c.id.includes(q) || cu?.name.toLowerCase().includes(q.toLowerCase()) || c.subject?.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Returns, Exchanges & Complaints</h1>
          <p className="page-subtitle">{returns.filter(r=>r.status==='pending').length} pending returns · {complaints.filter(c=>c.status==='open').length} open complaints</p>
        </div>
        <div className="page-header-actions">
          {canDo('complaint.create') && <button className="btn btn-outline" onClick={() => setModal('complaint')}><AlertTriangle size={14}/> Log Complaint</button>}
          {canDo('return.create') && <button className="btn btn-primary" onClick={() => setModal('return')}><Plus size={14}/> New Request</button>}
        </div>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div className="tabs">
          <button className={`tab-btn ${activeTab==='returns'?'active':''}`} onClick={()=>setActiveTab('returns')}>🔄 Returns & Exchanges ({returns.length})</button>
          <button className={`tab-btn ${activeTab==='complaints'?'active':''}`} onClick={()=>setActiveTab('complaints')}>⚠️ Complaints ({complaints.length})</button>
        </div>
        <div className="search-bar" style={{ marginLeft:'auto' }}>
          <Search size={14} color="var(--text-muted)" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…" style={{ width:200 }} />
        </div>
      </div>

      {activeTab === 'returns' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>ID</th><th>Type</th><th>Customer</th><th>Product</th><th>Reason</th><th>Warranty</th><th>Status</th><th>Refund</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredReturns.length === 0 && (
                <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-icon">🔄</div><div className="empty-state-title">No returns found</div></div></td></tr>
              )}
              {filteredReturns.map(r => {
                const c = getCustomer(r.customerId);
                const p = getProduct(r.productId);
                return (
                  <tr key={r.id}>
                    <td><span style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{r.id}</span></td>
                    <td><span className={`badge badge-${r.type==='refund'?'danger':'warning'}`}>{r.type}</span></td>
                    <td style={{ fontWeight:600 }}>{c?.name}</td>
                    <td style={{ fontSize:13 }}>{p?.emoji} {p?.name}</td>
                    <td style={{ fontSize:12, color:'var(--text-muted)', maxWidth:200 }}>{r.reason}</td>
                    <td><span className={`badge badge-${r.warrantyValid?'success':'danger'}`}>{r.warrantyValid?'Valid':'No'}</span></td>
                    <td><span className={`badge badge-${r.status==='approved'?'success':r.status==='rejected'?'danger':'warning'}`}>{r.status}</span></td>
                    <td>
                      {r.refundAmount > 0 ? (
                        <div>
                          <div style={{ fontSize:12, fontFamily:'var(--font-mono)', color:'var(--primary-300)' }}>{fmt(r.refundAmount)}</div>
                          <span className={`badge badge-${r.refundStatus==='processed'?'success':'warning'}`} style={{ fontSize:10 }}>{r.refundStatus}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      <div className="table-action-cell">
                        {r.status === 'pending' && canDo('return.approve') && (
                          <>
                            <button id={`approve-ret-${r.id}`} className="btn btn-success btn-sm" onClick={() => approveReturn(r, true)}><CheckCircle size={12}/> Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => approveReturn(r, false)}><XCircle size={12}/> Reject</button>
                          </>
                        )}
                        {r.status === 'approved' && !r.inventoryUpdated && canDo('return.inspect') && (
                          <>
                            <button className="btn btn-outline btn-sm" onClick={() => inspectReturn(r, true)} title="Inspect and Restock Serviceable"><PackageCheck size={12}/> Restock</button>
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-400)' }} onClick={() => inspectReturn(r, false)} title="Inspect and Write-off Damaged"><AlertOctagon size={12}/> Write-Off</button>
                          </>
                        )}
                        {r.inventoryUpdated && (
                          <span className="badge badge-gray" style={{ fontSize: 10 }}>{r.inspectionResult}</span>
                        )}
                        {r.status === 'approved' && r.refundStatus === 'pending' && canDo('refund.pay') && (
                          <button className="btn btn-primary btn-sm" onClick={() => processRefund(r)}>💳 Refund</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'complaints' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>ID</th><th>Customer</th><th>Subject</th><th>Priority</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredComplaints.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">💬</div><div className="empty-state-title">No complaints found</div></div></td></tr>
              )}
              {filteredComplaints.map(c => {
                const cu = getCustomer(c.customerId);
                return (
                  <tr key={c.id}>
                    <td><span style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{c.id}</span></td>
                    <td style={{ fontWeight:600 }}>{cu?.name}</td>
                    <td>
                      <div style={{ fontWeight:600, fontSize:13 }}>{c.subject}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{c.description?.slice(0,60)}…</div>
                    </td>
                    <td><span className={`badge badge-${c.priority==='urgent'?'danger':c.priority==='high'?'warning':'gray'}`}>{c.priority}</span></td>
                    <td><span className={`badge badge-${c.status==='resolved'?'success':'warning'}`}>{c.status}</span></td>
                    <td style={{ fontSize:12 }}>{c.createdAt}</td>
                    <td>
                      <div className="table-action-cell">
                        {c.status === 'open' && (
                          <>
                            {!c.escalated && canDo('complaint.escalate') && (
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ color: 'var(--warning-400)' }}
                                onClick={() => escalateComplaint(c)}
                                title="Escalate to Manager"
                              >
                                <ArrowUpRight size={12}/> Escalate
                              </button>
                            )}
                            {canDo('complaint.resolve') && (
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => { const r = window.prompt('Enter resolution note:'); if(r) resolveComplaint(c, r); }}
                              >
                                <CheckCircle size={12}/> Resolve
                              </button>
                            )}
                          </>
                        )}
                        {c.status === 'resolved' && <div style={{ fontSize:12, color:'var(--success-400)' }}>✅ {c.resolution?.slice(0,25)}</div>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal === 'return' && <ReturnModal onClose={() => setModal(null)} onSave={handleReturnSave} />}
      {modal === 'complaint' && <ComplaintModal onClose={() => setModal(null)} onSave={handleComplaintSave} />}
    </div>
  );
}
