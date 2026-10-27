import { useState } from 'react';
import { Search, Plus, Star, Phone, Mail, Building } from 'lucide-react';
import { SUPPLIERS, PURCHASE_ORDERS, fmt } from '../data/mockData';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

function SupplierModal({ supplier, onClose, onSave }) {
  const [form, setForm] = useState(supplier || { name:'', contact:'', phone:'', email:'', paymentTerms:30, rating:4 });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <Building size={18} color="var(--warning-400)" />
          <div className="modal-title">{supplier ? 'Edit Supplier' : 'New Supplier'}</div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Company Name *</label>
            <input className="form-input" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Supplier company name" />
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input className="form-input" value={form.contact} onChange={e=>set('contact',e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e=>set('phone',e.target.value)} />
            </div>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e=>set('email',e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Terms (days)</label>
              <input className="form-input" type="number" value={form.paymentTerms} onChange={e=>set('paymentTerms',+e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!form.name} onClick={()=>onSave(form)}>
            {supplier ? 'Save' : 'Create Supplier'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={13} fill={i<=rating?'var(--warning-400)':'none'} stroke={i<=rating?'var(--warning-400)':'var(--text-muted)'} />
      ))}
      <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:4 }}>{rating}</span>
    </div>
  );
}

export default function SuppliersPage() {
  const toast = useToast();
  const { canDo } = useAuth();
  const [suppliers, setSuppliers] = useState(() => [...SUPPLIERS]);
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null);

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    s.contact?.toLowerCase().includes(q.toLowerCase())
  );

  const handleSave = (form) => {
    if (!modal || modal === 'new') {
      const newS = { ...form, id:`SUP${String(suppliers.length+1).padStart(3,'0')}`, outstanding:0 };
      SUPPLIERS.push(newS);
      setSuppliers(ss => [...ss, newS]);
      toast.success('Supplier created');
    } else {
      setSuppliers(ss => ss.map(s => s.id===modal.id?{...s,...form}:s));
      const i = SUPPLIERS.findIndex(s=>s.id===modal.id);
      if (i!==-1) SUPPLIERS[i]={...SUPPLIERS[i],...form};
      toast.success('Supplier updated');
    }
    setModal(null);
  };

  const supplierOrderCount = (id) => PURCHASE_ORDERS.filter(po=>po.supplierId===id).length;
  const supplierTotalValue = (id) => PURCHASE_ORDERS.filter(po=>po.supplierId===id).reduce((s,po)=>s+po.grandTotal,0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">{suppliers.length} registered suppliers</p>
        </div>
        <div className="page-header-actions">
          {canDo('supplier.add') && (
            <button id="btn-new-supplier" className="btn btn-primary" onClick={()=>setModal('new')}>
              <Plus size={14}/> New Supplier
            </button>
          )}
        </div>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <div className="search-bar" style={{ flex:1 }}>
          <Search size={15} color="var(--text-muted)"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search suppliers…" />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
        {filtered.map(s => (
          <div key={s.id} className="card-elevated" style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:'var(--text-primary)', marginBottom:4 }}>{s.name}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{s.id}</div>
              </div>
              {canDo('supplier.edit') && <button className="btn btn-outline btn-sm" onClick={() => setModal(s)}>Edit</button>}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:13, marginBottom:14 }}>
              <span style={{ display:'flex', gap:8, color:'var(--text-secondary)' }}><Building size={13}/>{s.contact}</span>
              <span style={{ display:'flex', gap:8, color:'var(--text-secondary)' }}><Phone size={13}/>{s.phone}</span>
              <span style={{ display:'flex', gap:8, color:'var(--text-secondary)' }}><Mail size={13}/>{s.email}</span>
            </div>

            <StarRating rating={s.rating} />

            <div className="divider" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, textAlign:'center' }}>
              <div>
                <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.5 }}>Orders</div>
                <div style={{ fontWeight:700, fontSize:17 }}>{supplierOrderCount(s.id)}</div>
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.5 }}>Total Value</div>
                <div style={{ fontWeight:700, fontSize:14, color:'var(--primary-300)', fontFamily:'var(--font-mono)' }}>{fmt(supplierTotalValue(s.id))}</div>
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:.5 }}>Terms</div>
                <div style={{ fontWeight:700, fontSize:17 }}>{s.paymentTerms}d</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && <SupplierModal supplier={modal==='new'?null:modal} onClose={()=>setModal(null)} onSave={handleSave} />}
    </div>
  );
}
