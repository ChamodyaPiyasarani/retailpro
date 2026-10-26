// Service History page — all completed jobs with full log
import { SERVICE_JOBS, CUSTOMERS, PRODUCTS, USERS, fmt, getCustomer, getProduct, getUser } from '../data/mockData';
import { useState } from 'react';
import { Search } from 'lucide-react';

export default function ServiceHistoryPage() {
  const [q, setQ] = useState('');
  const completed = SERVICE_JOBS.filter(j => j.status === 'completed');

  const filtered = completed.filter(j => {
    const c = getCustomer(j.customerId);
    return !q || j.id.toLowerCase().includes(q.toLowerCase()) || c?.name.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Service History</h1>
          <p className="page-subtitle">{completed.length} completed jobs</p>
        </div>
      </div>

      <div style={{ marginBottom:16 }}>
        <div className="search-bar" style={{ maxWidth:400 }}>
          <Search size={14} color="var(--text-muted)"/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search job ID or customer…" />
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Job</th><th>Type</th><th>Customer</th><th>Product</th><th>Technician</th><th>Completed</th><th>Parts Used</th><th>Warranty</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No completed jobs yet</div></div></td></tr>
            )}
            {filtered.map(j => {
              const c = getCustomer(j.customerId);
              const p = getProduct(j.productId);
              const t = getUser(j.assignedTo);
              return (
                <tr key={j.id}>
                  <td><span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:12 }}>{j.id}</span></td>
                  <td><span className="badge badge-primary">{j.type}</span></td>
                  <td style={{ fontWeight:600 }}>{c?.name}</td>
                  <td style={{ fontSize:13 }}>{p?.emoji} {p?.name}</td>
                  <td style={{ fontSize:13 }}>{t ? `${t.avatar} ${t.name}` : '—'}</td>
                  <td style={{ fontSize:12 }}>{j.completedAt}</td>
                  <td>
                    {j.partsUsed?.length > 0
                      ? <span className="badge badge-warning">{j.partsUsed.length} part{j.partsUsed.length!==1?'s':''}</span>
                      : <span className="badge badge-gray">None</span>
                    }
                  </td>
                  <td><span className={`badge badge-${j.warrantyValid?'success':'danger'}`}>{j.warrantyValid?'Valid':'Expired'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
