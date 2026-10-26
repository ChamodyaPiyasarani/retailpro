import { useState } from 'react';
import { Plus, Search, CreditCard, DollarSign, Clock, CheckCircle, Send, AlertTriangle } from 'lucide-react';
import {
  PAYMENTS, SUPPLIER_PAYMENTS, SALES_ORDERS, CUSTOMERS, SUPPLIERS, PURCHASE_ORDERS,
  fmt, newPayId, getCustomer, getSupplier, getSalesOrder
} from '../data/mockData';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

function PaymentModal({ type, onClose, onSave }) {
  const [form, setForm] = useState({ customerId:'', salesOrderId:'', amount:0, method:'cash', note:'' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const orders = form.customerId ? SALES_ORDERS.filter(o=>o.customerId===form.customerId && o.paymentStatus !== 'paid') : [];

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <CreditCard size={18} color="var(--success-400)" />
          <div className="modal-title">Record Customer Payment</div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select className="form-select" value={form.customerId} onChange={e=>set('customerId',e.target.value)}>
              <option value="">Select customer…</option>
              {CUSTOMERS.map(c=><option key={c.id} value={c.id}>{c.name} (Balance: {fmt(c.balance)})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Sales Order</label>
            <select className="form-select" value={form.salesOrderId} onChange={e=>set('salesOrderId',e.target.value)}>
              <option value="">Select order…</option>
              {orders.map(o=><option key={o.id} value={o.id}>{o.invoiceNo} — Balance: {fmt(o.balance)}</option>)}
            </select>
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Amount (LKR) *</label>
              <input type="number" className="form-input" value={form.amount} onChange={e=>set('amount',+e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Method</label>
              <select className="form-select" value={form.method} onChange={e=>set('method',e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Note</label>
            <input className="form-input" value={form.note} onChange={e=>set('note',e.target.value)} placeholder="Optional reference or note" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" disabled={!form.customerId||form.amount<=0} onClick={()=>onSave(form)}>
            <CheckCircle size={14}/> Record Payment
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const toast = useToast();
  const { user, canDo } = useAuth();
  const [payments, setPayments] = useState(PAYMENTS);
  const [supplierPayments, setSupplierPayments] = useState(SUPPLIER_PAYMENTS);
  const [activeTab, setActiveTab] = useState('customer');
  const [modal, setModal] = useState(false);
  const [q, setQ] = useState('');

  const totalReceived = payments.reduce((s,p)=>s+p.amount,0);
  const totalPaid = supplierPayments.reduce((s,p)=>s+p.amount,0);
  const outstandingInvoices = SALES_ORDERS.filter(o=>o.paymentStatus!=='paid');
  const totalOutstanding = outstandingInvoices.reduce((s,o)=>s+o.balance,0);

  const handlePayment = (form) => {
    const today = format(new Date(),'yyyy-MM-dd');
    const payment = { id: newPayId(), ...form, date: today, recordedBy: user?.id };
    PAYMENTS.push(payment);
    setPayments(ps => [...ps, payment]);

    // Update sales order
    if (form.salesOrderId) {
      const so = SALES_ORDERS.find(o=>o.id===form.salesOrderId);
      if (so) {
        so.amountPaid = (so.amountPaid||0) + form.amount;
        so.balance = Math.max(0, so.balance - form.amount);
        if (so.balance <= 0) { so.paymentStatus = 'paid'; }
        // Update customer credit
        const ci = CUSTOMERS.findIndex(c=>c.id===form.customerId);
        if (ci !== -1) { CUSTOMERS[ci].creditUsed = Math.max(0, CUSTOMERS[ci].creditUsed - form.amount); }
      }
    }

    toast.success(`Payment of ${fmt(form.amount)} recorded`);
    setModal(false);
  };

  const filteredPayments = payments.filter(p => {
    const c = getCustomer(p.customerId);
    return !q || c?.name.toLowerCase().includes(q.toLowerCase()) || p.id.includes(q);
  });

  const filteredPayables = PURCHASE_ORDERS.filter(po => {
    const s = getSupplier(po.supplierId);
    return po.payableStatus === 'pending' && (!q || s?.name.toLowerCase().includes(q.toLowerCase()) || po.id.includes(q));
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments & Finance</h1>
          <p className="page-subtitle">Track receipts, outstanding balances, and payables</p>
        </div>
        <div className="page-header-actions">
          {canDo('payment.record') && (<button id="btn-record-payment" className="btn btn-primary" onClick={() => setModal(true)}>
            <Plus size={14}/> Record Payment
          </button>)}
        </div>
      </div>

      {/* KPI */}
      <div className="stat-grid" style={{ gridTemplateColumns:'repeat(3,1fr)', marginBottom:20 }}>
        <div className="stat-card success">
          <div className="stat-card-header"><span className="stat-card-label">Total Received</span><div className="stat-card-icon success"><DollarSign size={16}/></div></div>
          <div className="stat-card-value">{fmt(totalReceived)}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-card-header"><span className="stat-card-label">Outstanding</span><div className="stat-card-icon warning"><Clock size={16}/></div></div>
          <div className="stat-card-value">{fmt(totalOutstanding)}</div>
          <div className="stat-card-change down">{outstandingInvoices.length} invoices</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-card-header"><span className="stat-card-label">Supplier Payables</span><div className="stat-card-icon danger"><CreditCard size={16}/></div></div>
          <div className="stat-card-value">{fmt(PURCHASE_ORDERS.filter(p=>p.payableStatus==='pending').reduce((s,p)=>s+p.grandTotal,0))}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:12, marginBottom:16, alignItems:'center' }}>
        <div className="tabs">
          <button className={`tab-btn ${activeTab==='customer'?'active':''}`} onClick={()=>setActiveTab('customer')}>💳 Customer Payments</button>
          <button className={`tab-btn ${activeTab==='outstanding'?'active':''}`} onClick={()=>setActiveTab('outstanding')}>⏰ Outstanding</button>
          <button className={`tab-btn ${activeTab==='payables'?'active':''}`} onClick={()=>setActiveTab('payables')}>🏭 Supplier Payables</button>
        </div>
        <div className="search-bar" style={{ marginLeft:'auto' }}>
          <Search size={14} color="var(--text-muted)"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…" style={{ width:200 }} />
        </div>
      </div>

      {activeTab === 'customer' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Payment ID</th><th>Customer</th><th>Order</th><th>Amount</th><th>Method</th><th>Date</th><th>Note</th></tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 && (
                <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">💳</div><div className="empty-state-title">No payments</div></div></td></tr>
              )}
              {filteredPayments.map(p => {
                const c = getCustomer(p.customerId);
                return (
                  <tr key={p.id}>
                    <td><span style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{p.id}</span></td>
                    <td style={{ fontWeight:600 }}>{c?.name || 'Walk-in'}</td>
                    <td><span style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{p.salesOrderId || '—'}</span></td>
                    <td><span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--success-400)' }}>{fmt(p.amount)}</span></td>
                    <td><span className="badge badge-gray">{p.method}</span></td>
                    <td style={{ fontSize:12 }}>{p.date}</td>
                    <td style={{ fontSize:12, color:'var(--text-muted)' }}>{p.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'outstanding' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Paid</th><th>Balance</th><th>Date</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {outstandingInvoices.length === 0 && (
                <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-title">All invoices paid!</div></div></td></tr>
              )}
              {outstandingInvoices.map(o => {
                const c = getCustomer(o.customerId);
                return (
                  <tr key={o.id}>
                    <td><span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{o.invoiceNo}</span></td>
                    <td style={{ fontWeight:600 }}>{c?.name}</td>
                    <td><span style={{ fontFamily:'var(--font-mono)' }}>{fmt(o.grandTotal)}</span></td>
                    <td><span style={{ fontFamily:'var(--font-mono)', color:'var(--success-400)' }}>{fmt(o.amountPaid)}</span></td>
                    <td><span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--danger-400)' }}>{fmt(o.balance)}</span></td>
                    <td style={{ fontSize:12 }}>{o.date}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span className="badge badge-warning">{o.paymentStatus}</span>
                        {o.flaggedOverdue && <span className="badge badge-danger">Overdue</span>}
                      </div>
                    </td>
                    <td>
                      <div className="table-action-cell">
                        {canDo('payment.remind') && <button
                          className="btn btn-outline btn-sm"
                          onClick={() => toast.success(`Payment reminder sent to ${c?.name} (${c?.phone || c?.email})`)}
                          title="Send Payment Reminder"
                        >
                          <Send size={12} /> Reminder
                        </button>}
                        {canDo('payment.flagOverdue') && <button
                          className={`btn btn-sm ${o.flaggedOverdue ? 'btn-danger' : 'btn-ghost'}`}
                          style={{ color: o.flaggedOverdue ? '#fff' : 'var(--danger-400)' }}
                          onClick={() => {
                            o.flaggedOverdue = !o.flaggedOverdue;
                            toast.warning(o.flaggedOverdue ? `Invoice ${o.invoiceNo} flagged as overdue` : `Overdue flag removed for ${o.invoiceNo}`);
                            setActiveTab('outstanding');
                          }}
                          title="Flag Overdue"
                        >
                          <AlertTriangle size={12} /> Flag Overdue
                        </button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'payables' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>PO</th><th>Supplier</th><th>Amount</th><th>Received Date</th><th>Due</th><th>Status</th></tr>
            </thead>
            <tbody>
              {PURCHASE_ORDERS.filter(po=>po.payableStatus==='pending').length === 0 && (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-title">No pending payables</div></div></td></tr>
              )}
              {PURCHASE_ORDERS.filter(po=>po.payableStatus==='pending').map(po => {
                const sup = getSupplier(po.supplierId);
                const supData = SUPPLIERS.find(s=>s.id===po.supplierId);
                const dueDate = po.receivedDate ? format(new Date(new Date(po.receivedDate).getTime() + (supData?.paymentTerms||30)*24*3600*1000),'yyyy-MM-dd') : '—';
                return (
                  <tr key={po.id}>
                    <td><span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{po.id}</span></td>
                    <td style={{ fontWeight:600 }}>{sup?.name}</td>
                    <td><span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--danger-400)' }}>{fmt(po.grandTotal)}</span></td>
                    <td style={{ fontSize:12 }}>{po.receivedDate || '—'}</td>
                    <td style={{ fontSize:12 }}>{dueDate}</td>
                    <td>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span className="badge badge-warning">Pending</span>
                        {canDo('payable.pay') && <button className="btn btn-success btn-sm" onClick={() => {
                          const i = PURCHASE_ORDERS.findIndex(o=>o.id===po.id);
                          if (i !== -1) PURCHASE_ORDERS[i].payableStatus = 'paid';
                          toast.success(`Payment marked as paid for ${po.id}`);
                          setActiveTab('payables');
                        }}>
                          <CheckCircle size={12}/> Mark Paid
                        </button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && <PaymentModal type="customer" onClose={() => setModal(false)} onSave={handlePayment} />}
    </div>
  );
}
