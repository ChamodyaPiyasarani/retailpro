import { useState } from 'react';
import { SALES_ORDERS, CUSTOMERS, PRODUCTS, fmt, getCustomer, newestFirst } from '../data/store';
import { Search, Eye } from 'lucide-react';

export default function SalesPage() {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = SALES_ORDERS.filter(o => {
    const c = getCustomer(o.customerId);
    return (statusFilter === 'all' || o.paymentStatus === statusFilter) &&
      (!q || o.id.toLowerCase().includes(q.toLowerCase()) ||
             o.invoiceNo.toLowerCase().includes(q.toLowerCase()) ||
             c?.name.toLowerCase().includes(q.toLowerCase()));
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Orders</h1>
          <p className="page-subtitle">{SALES_ORDERS.length} total orders · Revenue: {fmt(SALES_ORDERS.reduce((s,o)=>s+o.grandTotal,0))}</p>
        </div>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <div className="search-bar" style={{ flex:1 }}>
          <Search size={15} color="var(--text-muted)"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search order ID, invoice, customer…" />
        </div>
        <select className="form-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ width:160 }}>
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Order ID</th><th>Invoice #</th><th>Customer</th><th>Date</th>
              <th>Items</th><th>Grand Total</th><th>Payment</th><th>Balance</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-icon">🛒</div><div className="empty-state-title">No orders found</div></div></td></tr>
            )}
            {newestFirst(filtered).map(o => {
              const c = getCustomer(o.customerId);
              return (
                <tr key={o.id}>
                  <td><span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700 }}>{o.id}</span></td>
                  <td><span style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{o.invoiceNo}</span></td>
                  <td style={{ fontWeight:600 }}>{c?.name || 'Walk-in'}</td>
                  <td style={{ fontSize:12 }}>{o.date}</td>
                  <td><span className="badge badge-gray">{o.items.length}</span></td>
                  <td><span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{fmt(o.grandTotal)}</span></td>
                  <td>
                    <div>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--success-400)' }}>{fmt(o.amountPaid)}</div>
                      <span className="badge badge-gray" style={{ fontSize:10 }}>{o.paymentMethod}</span>
                    </div>
                  </td>
                  <td><span style={{ fontFamily:'var(--font-mono)', color: o.balance>0?'var(--danger-400)':'var(--text-secondary)' }}>{fmt(o.balance)}</span></td>
                  <td>
                    <span className={`badge badge-${o.paymentStatus==='paid'?'success':o.paymentStatus==='partial'?'warning':'danger'}`}>
                      {o.paymentStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
