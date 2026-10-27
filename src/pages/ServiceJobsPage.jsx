import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, CheckCircle, AlertTriangle, Clock, Wrench, User, Calendar } from 'lucide-react';
import {
  SERVICE_JOBS, CUSTOMERS, PRODUCTS, USERS, SALES_ORDERS, STOCK_MOVEMENTS, RETURNS, newRetId,
  fmt, newJobId, newSmId, getCustomer, getUser, getProduct
} from '../data/mockData';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const STATUS_FLOW = ['pending','assigned','in-progress','completed','cancelled'];
const STATUS_COLOR = { pending:'gray', assigned:'primary', 'in-progress':'warning', completed:'success', cancelled:'danger' };
const TYPE_ICON = { installation:'🔌', repair:'🔧', maintenance:'🛠️' };
const PRIORITY_COLOR = { normal:'gray', high:'warning', urgent:'danger' };
const BILL_COLOR = { unbilled:'gray', invoiced:'warning', paid:'success', warranty:'primary' };

function JobModal({ job, onClose, onSave }) {
  const { canDo } = useAuth();
  const [form, setForm] = useState(job || {
    customerId:'', productId:'', serialNo:'', salesOrderId:'',
    type:'repair', priority:'normal', description:'', assignedTo:'',
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const technicians = USERS.filter(u => u.role === 'technician');
  const customerOrders = form.customerId ? SALES_ORDERS.filter(o=>o.customerId===form.customerId) : [];

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <span style={{ fontSize:20 }}>🔧</span>
          <div className="modal-title">{job ? 'Edit Service Job' : 'New Service Job'}</div>
        </div>
        <div className="modal-body">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Customer *</label>
              <select className="form-select" value={form.customerId} onChange={e=>set('customerId',e.target.value)}>
                <option value="">Select customer…</option>
                {CUSTOMERS.map(c=><option key={c.id} value={c.id}>{c.name} – {c.phone}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Linked Sales Order</label>
              <select className="form-select" value={form.salesOrderId} onChange={e=>set('salesOrderId',e.target.value)}>
                <option value="">None</option>
                {customerOrders.map(o=><option key={o.id} value={o.id}>{o.invoiceNo} — {fmt(o.grandTotal)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Product</label>
              <select className="form-select" value={form.productId} onChange={e=>set('productId',e.target.value)}>
                <option value="">Select product…</option>
                {PRODUCTS.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input className="form-input" value={form.serialNo} onChange={e=>set('serialNo',e.target.value)} placeholder="e.g. SN-20240112" />
            </div>
          </div>
          <div className={canDo('service.assign') ? 'form-row-3' : 'form-row-2'}>
            <div className="form-group">
              <label className="form-label">Job Type *</label>
              <select className="form-select" value={form.type} onChange={e=>set('type',e.target.value)}>
                <option value="installation">Installation</option>
                <option value="repair">Repair</option>
                <option value="maintenance">Maintenance</option>
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
            {canDo('service.assign') && (
              <div className="form-group">
                <label className="form-label">Assign Technician</label>
                <select className="form-select" value={form.assignedTo} onChange={e=>set('assignedTo',e.target.value)}>
                  <option value="">Unassigned</option>
                  {technicians.map(t=><option key={t.id} value={t.id}>{t.avatar} {t.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Description / Fault Details *</label>
            <textarea className="form-textarea" rows={3} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe the fault or work required…" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!form.customerId || !form.description} onClick={() => onSave(form)}>
            {job ? 'Save Changes' : 'Create Job'}
          </button>
        </div>
      </div>
    </div>
  );
}

function JobDetailModal({ job, onClose, onUpdate }) {
  const { user, canDo } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState(job.status);
  const [visitNote, setVisitNote] = useState('');
  const [partId, setPartId] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [assignTo, setAssignTo] = useState(job.assignedTo || '');
  const [fault, setFault] = useState({ faultFound: job.faultFound || '', repairDone: job.repairDone || '', recommendExchange: !!job.recommendExchange });
  const [fee, setFee] = useState(job.serviceFee || 0);
  const technicians = USERS.filter(u => u.role === 'technician');
  const customer = getCustomer(job.customerId);
  const tech = getUser(job.assignedTo);
  const product = getProduct(job.productId);
  const spareParts = PRODUCTS.filter(p => p.category === 'CAT006');

  const addVisit = () => {
    if (!visitNote) return;
    const updated = { ...job, visits: [...(job.visits||[]), { date: format(new Date(),'yyyy-MM-dd'), note: visitNote, userId: user?.id }], updatedAt: format(new Date(),'yyyy-MM-dd') };
    if (status === 'completed') { updated.completedAt = format(new Date(),'yyyy-MM-dd'); }
    onUpdate(updated);
    toast.success('Visit recorded');
    setVisitNote('');
  };

  // Manage service job assignments (admin): assign or re-assign a technician
  const reassign = () => {
    onUpdate({ ...job, assignedTo: assignTo || null, status: assignTo && job.status === 'pending' ? 'assigned' : job.status, updatedAt: format(new Date(),'yyyy-MM-dd') });
    toast.success(assignTo ? `Assigned to ${getUser(assignTo)?.name}` : 'Technician removed');
  };

  // Record repair / fault details (technician); optional exchange recommendation
  const saveRepair = () => {
    const updated = { ...job, ...fault, updatedAt: format(new Date(),'yyyy-MM-dd') };
    if (fault.recommendExchange && !job.exchangeRequestId) {
      const ret = {
        id: newRetId(), type:'exchange', customerId: job.customerId, salesOrderId: job.salesOrderId,
        productId: job.productId, reason: `Technician recommends exchange (${job.id}): ${fault.faultFound}`,
        status:'pending', warrantyValid: job.warrantyValid, requestedBy: user?.id, approvedBy:null,
        refundAmount:0, refundStatus:'none', inspectionResult:null, canRestock:null, serviceJobId: job.id,
        createdAt: format(new Date(),'yyyy-MM-dd'), resolvedAt:null,
      };
      RETURNS.push(ret);
      updated.exchangeRequestId = ret.id;
      toast.info(`Exchange request ${ret.id} sent for manager approval`);
    }
    onUpdate(updated);
  };

  // Track service job billing (finance)
  const saveBilling = (billingStatus) => {
    onUpdate({ ...job, serviceFee: Number(fee) || 0, billingStatus });
  };

  const addPart = () => {
    if (!partId) return;
    const p = PRODUCTS.find(x=>x.id===partId);
    if (!p || p.stock < partQty) { toast.error('Insufficient stock'); return; }
    const updated = {
      ...job,
      partsUsed: [...(job.partsUsed||[]), { productId: partId, qty: partQty, note: p.name }],
    };
    // Deduct stock
    const pidx = PRODUCTS.findIndex(x=>x.id===partId);
    if (pidx !== -1) {
      PRODUCTS[pidx].stock -= partQty;
      STOCK_MOVEMENTS.push({ id: newSmId(), productId: partId, type:'out', qty: partQty, ref: job.id, note:'Service part used', date: format(new Date(),'yyyy-MM-dd'), userId: user?.id });
    }
    onUpdate(updated);
    toast.success(`Part issued: ${p.name} × ${partQty}`);
    setPartId('');
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal modal-xl">
        <div className="modal-header">
          <span style={{ fontSize:20 }}>{TYPE_ICON[job.type]}</span>
          <div>
            <div className="modal-title">{job.id} — {job.type.charAt(0).toUpperCase()+job.type.slice(1)}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>{customer?.name} · {product?.name}</div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto' }} onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {/* Left */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="card-elevated" style={{ padding:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, color:'var(--text-muted)' }}>Job Details</span>
                <span className={`badge badge-${STATUS_COLOR[job.status]}`}>{job.status.replace('-',' ')}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:13 }}>
                <div style={{ display:'flex', gap:10 }}><span className="text-muted">Priority</span><span className={`badge badge-${PRIORITY_COLOR[job.priority]}`}>{job.priority}</span></div>
                <div style={{ display:'flex', gap:10 }}><span className="text-muted">Customer</span><strong>{customer?.name}</strong></div>
                <div style={{ display:'flex', gap:10 }}><span className="text-muted">Product</span><span>{product?.emoji} {product?.name}</span></div>
                <div style={{ display:'flex', gap:10 }}><span className="text-muted">Serial No</span><span style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{job.serialNo || '—'}</span></div>
                <div style={{ display:'flex', gap:10 }}><span className="text-muted">Technician</span><span>{tech ? `${tech.avatar} ${tech.name}` : 'Unassigned'}</span></div>
                <div style={{ display:'flex', gap:10 }}><span className="text-muted">Warranty</span><span className={`badge badge-${job.warrantyValid?'success':'danger'}`}>{job.warrantyValid?'Valid':'Expired'}</span></div>
              </div>
              <div style={{ marginTop:10, padding:10, background:'var(--bg-overlay)', borderRadius:6, fontSize:13, color:'var(--text-secondary)' }}>
                {job.description}
              </div>
            </div>

            {/* Assign / re-assign technician (admin) */}
            {canDo('service.assign') && (
              <div className="card-elevated" style={{ padding:14 }}>
                <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, color:'var(--text-muted)', marginBottom:10 }}>Assign Technician</div>
                <div style={{ display:'flex', gap:8 }}>
                  <select id="job-assign-select" className="form-select" value={assignTo} onChange={e=>setAssignTo(e.target.value)} style={{ flex:1 }}>
                    <option value="">Unassigned</option>
                    {technicians.map(t=><option key={t.id} value={t.id}>{t.avatar} {t.name}</option>)}
                  </select>
                  <button id="job-assign-btn" className="btn btn-primary btn-sm" disabled={(assignTo||null) === (job.assignedTo||null)} onClick={reassign}>
                    {job.assignedTo ? 'Re-assign' : 'Assign'}
                  </button>
                </div>
              </div>
            )}

            {/* Billing (finance edits, others see it) */}
            <div className="card-elevated" style={{ padding:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, color:'var(--text-muted)' }}>Billing</span>
                <span className={`badge badge-${BILL_COLOR[job.billingStatus] || 'gray'}`}>{job.billingStatus || 'unbilled'}</span>
              </div>
              <div style={{ fontSize:13, marginBottom: canDo('service.bill') ? 10 : 0 }}>
                Service fee: <strong style={{ fontFamily:'var(--font-mono)' }}>{fmt(job.serviceFee || 0)}</strong>
                {job.warrantyValid && <span style={{ color:'var(--text-muted)' }}> · covered by warranty</span>}
              </div>
              {canDo('service.bill') && (
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <input id="job-fee-input" type="number" min={0} className="form-input" value={fee} onChange={e=>setFee(e.target.value)} style={{ width:120 }} />
                  <button className="btn btn-outline btn-sm" onClick={() => saveBilling('invoiced')}>Mark Invoiced</button>
                  <button className="btn btn-success btn-sm" onClick={() => saveBilling('paid')}>Mark Paid</button>
                </div>
              )}
            </div>

            {/* Status update (technician only) */}
            {canDo('service.updateStatus') && (
            <div className="card-elevated" style={{ padding:14 }}>
              <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, color:'var(--text-muted)', marginBottom:10 }}>Update Status</div>
              <select className="form-select" value={status} onChange={e=>setStatus(e.target.value)} style={{ marginBottom:8 }}>
                {STATUS_FLOW.map(s=><option key={s} value={s}>{s.replace('-',' ').replace(/^\w/,c=>c.toUpperCase())}</option>)}
              </select>
              <button className="btn btn-primary btn-sm" style={{ width:'100%', justifyContent:'center' }} onClick={() => onUpdate({...job, status, completedAt: status==='completed'?format(new Date(),'yyyy-MM-dd'):job.completedAt})}>
                Update Status
              </button>
            </div>
            )}

            {/* Parts Used */}
            <div className="card-elevated" style={{ padding:14 }}>
              <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, color:'var(--text-muted)', marginBottom:10 }}>Parts Used</div>
              {job.partsUsed?.length === 0 && <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:10 }}>No parts used yet</div>}
              {job.partsUsed?.map((p,i) => {
                const prod = getProduct(p.productId);
                return <div key={i} style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:4 }}>🔧 {prod?.name || p.productId} × {p.qty}</div>;
              })}
              {canDo('service.issueParts') && (
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <select className="form-select" value={partId} onChange={e=>setPartId(e.target.value)} style={{ flex:1 }}>
                  <option value="">Select spare part…</option>
                  {PRODUCTS.map(p=><option key={p.id} value={p.id}>{p.emoji} {p.name} (Stock: {p.stock})</option>)}
                </select>
                <input type="number" className="form-input" value={partQty} min={1} onChange={e=>setPartQty(+e.target.value)} style={{ width:60 }} />
                <button className="btn btn-outline btn-sm" onClick={addPart} title="Issue spare part"><Plus size={13}/></button>
              </div>
              )}
            </div>
          </div>

          {/* Right: Timeline */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Repair / fault details (technician) */}
            {(canDo('service.recordRepair') || job.faultFound) && (
              <div className="card-elevated" style={{ padding:14 }}>
                <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, color:'var(--text-muted)', marginBottom:10 }}>Repair / Fault Details</div>
                {canDo('service.recordRepair') ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <textarea id="job-fault" className="form-textarea" rows={2} value={fault.faultFound} onChange={e=>setFault(f=>({...f, faultFound:e.target.value}))} placeholder="Fault found (diagnosis)…" />
                    <textarea id="job-repair" className="form-textarea" rows={2} value={fault.repairDone} onChange={e=>setFault(f=>({...f, repairDone:e.target.value}))} placeholder="Repair done / parts replaced…" />
                    <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text-secondary)' }}>
                      <input id="job-recommend" type="checkbox" checked={fault.recommendExchange} disabled={!!job.exchangeRequestId} onChange={e=>setFault(f=>({...f, recommendExchange:e.target.checked}))} />
                      Recommend exchange or replacement
                    </label>
                    {job.exchangeRequestId && <div style={{ fontSize:12, color:'var(--text-muted)' }}>Exchange request {job.exchangeRequestId} created.</div>}
                    <button id="job-repair-save" className="btn btn-primary btn-sm" style={{ justifyContent:'center' }} disabled={!fault.faultFound} onClick={saveRepair}>Save Repair Details</button>
                  </div>
                ) : (
                  <div style={{ fontSize:13, display:'flex', flexDirection:'column', gap:4 }}>
                    <div><span className="text-muted">Fault:</span> {job.faultFound}</div>
                    {job.repairDone && <div><span className="text-muted">Repair:</span> {job.repairDone}</div>}
                    {job.recommendExchange && <div className="badge badge-warning" style={{ alignSelf:'flex-start' }}>Exchange recommended</div>}
                  </div>
                )}
              </div>
            )}

            <div className="card-elevated" style={{ padding:14, flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:.5, color:'var(--text-muted)', marginBottom:12 }}>Visit Log</div>
              {job.visits?.length === 0 && <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:12 }}>No visits recorded yet</div>}
              <div className="timeline">
                {job.visits?.map((v,i) => (
                  <div key={i} className="timeline-item">
                    <div className="timeline-dot primary" />
                    <div className="timeline-content">
                      <div className="timeline-time">{v.date} · {getUser(v.userId)?.name}</div>
                      <div className="timeline-text">{v.note}</div>
                    </div>
                  </div>
                ))}
              </div>

              {canDo('service.logVisit') && (
              <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:8 }}>
                <textarea className="form-textarea" rows={2} value={visitNote} onChange={e=>setVisitNote(e.target.value)} placeholder="Log this visit — work done, findings, next steps…" />
                <button className="btn btn-accent btn-sm" style={{ justifyContent:'center' }} onClick={addVisit} disabled={!visitNote}>
                  <Plus size={13}/> Log Visit
                </button>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServiceJobsPage() {
  const toast = useToast();
  const { user, canDo } = useAuth();
  const [jobs, setJobs] = useState(() => [...SERVICE_JOBS]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  // Open the right tab for the menu item that brought the user here
  // Buttons elsewhere can ask this page to open a form / tab / filter; apply it once, then clear it
  useEffect(() => {
    if (!location.state) return;
    if (location.state?.open === 'new' && canDo('service.create')) setModal('new');
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps
  const [detail, setDetail] = useState(null);

  // Technicians see only the jobs assigned to them ("View assigned service jobs")
  const visibleJobs = user?.role === 'technician' ? jobs.filter(j => j.assignedTo === user.id) : jobs;

  const filtered = visibleJobs.filter(j => {
    const c = getCustomer(j.customerId);
    return (statusFilter === 'all' || j.status === statusFilter) &&
      (typeFilter === 'all' || j.type === typeFilter) &&
      (j.id.toLowerCase().includes(q.toLowerCase()) || c?.name.toLowerCase().includes(q.toLowerCase()) || j.description.toLowerCase().includes(q.toLowerCase()));
  });

  const handleCreate = (form) => {
    const today = format(new Date(),'yyyy-MM-dd');
    const newJob = {
      id: newJobId(), ...form,
      warrantyValid: true, warrantyExpiry: '', serviceFee: 0, billingStatus: 'unbilled',
      visits:[], partsUsed:[],
      status: form.assignedTo ? 'assigned' : 'pending',
      createdBy: user?.id, createdAt: today, updatedAt: today, completedAt: null,
    };
    SERVICE_JOBS.push(newJob);
    setJobs(js => [...js, newJob]);
    toast.success(`Service job ${newJob.id} created`);
    setModal(null);
  };

  const handleUpdate = (updated) => {
    setJobs(js => js.map(j => j.id === updated.id ? updated : j));
    const i = SERVICE_JOBS.findIndex(j => j.id === updated.id);
    if (i !== -1) SERVICE_JOBS[i] = updated;
    if (detail?.id === updated.id) setDetail(updated);
    toast.success('Job updated');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Service Jobs</h1>
          <p className="page-subtitle">{visibleJobs.length} total · {visibleJobs.filter(j=>j.status==='pending').length} pending · {visibleJobs.filter(j=>j.status==='in-progress').length} in progress</p>
        </div>
        <div className="page-header-actions">
          {canDo('service.create') && (
            <button id="btn-new-service-job" className="btn btn-primary" onClick={() => setModal('new')}>
              <Plus size={15}/> New Job
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <div className="search-bar" style={{ flex:1 }}>
          <Search size={15} color="var(--text-muted)" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by job ID, customer, or description…" />
        </div>
        <select className="form-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ width:160 }}>
          <option value="all">All Status</option>
          {STATUS_FLOW.map(s=><option key={s} value={s}>{s.replace('-',' ').replace(/^\w/,c=>c.toUpperCase())}</option>)}
        </select>
        <select className="form-select" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{ width:150 }}>
          <option value="all">All Types</option>
          <option value="installation">Installation</option>
          <option value="repair">Repair</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Job Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))', gap:16 }}>
        {filtered.length === 0 && (
          <div className="empty-state" style={{ gridColumn:'1/-1' }}>
            <div className="empty-state-icon">🔧</div>
            <div className="empty-state-title">No service jobs found</div>
          </div>
        )}
        {filtered.map(j => {
          const customer = getCustomer(j.customerId);
          const tech = getUser(j.assignedTo);
          const product = getProduct(j.productId);
          return (
            <div
              key={j.id}
              id={`job-card-${j.id}`}
              className="job-card"
              style={{ cursor:'pointer' }}
              onClick={() => setDetail(j)}
            >
              <div className="job-card-header">
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:20 }}>{TYPE_ICON[j.type]}</span>
                    <span className="job-id" style={{ fontFamily:'var(--font-mono)' }}>{j.id}</span>
                    <span className={`badge badge-${PRIORITY_COLOR[j.priority]}`}>{j.priority}</span>
                  </div>
                  <div className="job-title">{j.type.charAt(0).toUpperCase()+j.type.slice(1)} — {customer?.name}</div>
                </div>
                <span className={`badge badge-${STATUS_COLOR[j.status]}`}>{j.status.replace('-',' ')}</span>
              </div>
              <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:10, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                {j.description}
              </div>
              <div className="job-meta">
                {product && <span>📦 {product.name}</span>}
                <span>👤 {tech ? tech.name : 'Unassigned'}</span>
                <span>📅 {j.createdAt}</span>
                {canDo('service.bill') && <span>💰 {fmt(j.serviceFee || 0)} · {j.billingStatus || 'unbilled'}</span>}
                <span className={`badge badge-${j.warrantyValid?'success':'danger'}`} style={{ fontSize:10 }}>{j.warrantyValid?'Warranty':'No Warranty'}</span>
              </div>
              {j.visits?.length > 0 && (
                <div style={{ marginTop:8, fontSize:12, color:'var(--text-muted)' }}>
                  💬 {j.visits.length} visit{j.visits.length!==1?'s':''} · Last: {j.visits[j.visits.length-1]?.date}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal && <JobModal job={modal==='new'?null:modal} onClose={()=>setModal(null)} onSave={handleCreate} />}
      {detail && <JobDetailModal job={detail} onClose={()=>setDetail(null)} onUpdate={handleUpdate} />}
    </div>
  );
}
