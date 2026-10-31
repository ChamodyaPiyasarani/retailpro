import { useState } from 'react';
import { Search, ShieldCheck, ShieldX } from 'lucide-react';
import { SALES_ORDERS, PRODUCTS, getCustomer, getWarrantyStatus } from '../data/store';

// Check Product Warranty Status (SD-31): look up by SKU or invoice number
export default function WarrantyPage() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);

  const search = (e) => {
    e.preventDefault();
    const term = q.trim().toLowerCase();
    if (!term) return;
    const rows = [];
    const order = SALES_ORDERS.find(o => o.invoiceNo.toLowerCase() === term);
    if (order) {
      order.items.forEach(i => rows.push({ order, status: getWarrantyStatus(i.productId, order.id) }));
    } else {
      const product = PRODUCTS.find(p => p.sku.toLowerCase() === term);
      if (product) {
        SALES_ORDERS.filter(o => o.items.some(i => i.productId === product.id))
          .forEach(o => rows.push({ order: o, status: getWarrantyStatus(product.id, o.id) }));
        if (rows.length === 0) rows.push({ order: null, status: { known: false, valid: false, product, message: `${product.name} has not been sold yet. Warranty period: ${product.warranty} months.` } });
      }
    }
    setResults(rows);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Warranty Check</h1>
          <p className="page-subtitle">Enter a product SKU or an invoice number to see the warranty status</p>
        </div>
      </div>

      <form onSubmit={search} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 240 }}>
          <Search size={15} color="var(--text-muted)" />
          <input id="warranty-search" value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. GPU-RTX4060TI or INV-2026-004" />
        </div>
        <button id="warranty-check-btn" type="submit" className="btn btn-primary" disabled={!q.trim()}>
          <ShieldCheck size={15} /> Check Warranty
        </button>
      </form>

      {results && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No product or invoice found for "{q}"</div>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Product</th><th>Invoice</th><th>Customer</th><th>Sold on</th><th>Warranty</th><th>Expires</th><th>Status</th></tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const s = r.status;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{s.product?.emoji} {s.product?.name}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.order?.invoiceNo || '—'}</td>
                    <td>{r.order ? getCustomer(r.order.customerId)?.name : '—'}</td>
                    <td style={{ fontSize: 12 }}>{s.saleDate || '—'}</td>
                    <td style={{ fontSize: 12 }}>{s.product?.warranty} months</td>
                    <td style={{ fontSize: 12 }}>{s.expiry || '—'}</td>
                    <td>
                      {s.known
                        ? <span className={`badge badge-${s.valid ? 'success' : 'danger'}`}>{s.valid ? <ShieldCheck size={11} /> : <ShieldX size={11} />} {s.valid ? 'Valid' : 'Expired'}</span>
                        : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.message}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
