// Dashboard Form – SD "View dashboard"  (Report.getDashboardSummary)
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Report from '../classes/Report';
import { money } from '../classes/db';
import { PageHeader, useLoad, Loading, Empty } from '../components/ui';

export default function DashboardPage() {
  const { data: s, error } = useLoad(() => Report.getDashboardSummary());
  if (!s) return <Loading error={error} />;
  const cards = [['Sales today', `${money(s.salesToday)}`, '💰'], ['Sales this month', money(s.salesMonth), '📈'],
    ['Unpaid invoices', money(s.unpaidTotal), '📄'], ['Overdue invoices', s.overdue, '⏰'], ['Low-stock products', s.lowStock.length, '📦'],
    ['Open service jobs', s.pendingJobs, '🔧'], ['POs waiting approval', s.pendingPOs, '🚚'], ['Returns waiting approval', s.pendingReturns, '↩️']];
  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Today's summary of Rajida Holdings" />
      <div className="stat-grid">
        {cards.map(([l, v, i]) => (
          <div key={l} className="stat-card"><div className="stat-card-header"><span className="stat-card-label">{l}</span><span style={{ fontSize: 20 }}>{i}</span></div>
            <div className="stat-card-value">{v}</div></div>
        ))}
      </div>
      <div className="dashboard-grid" style={{ marginTop: 20 }}>
        <div className="card chart-card">
          <div className="chart-title">Sales of the last 7 days</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={s.last7}><XAxis dataKey="day" /><YAxis width={80} /><Tooltip formatter={v => money(v)} /><Bar dataKey="sales" fill="#3b82f6" /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="chart-title">Low-stock products</div>
          {s.lowStock.length === 0 ? <Empty text="All items are in stock" /> : (
            <table className="table"><thead><tr><th>Product</th><th>In stock</th><th>Reorder level</th></tr></thead>
              <tbody>{s.lowStock.map(p => <tr key={p.product_id}><td>{p.product_name}</td><td className="text-danger">{p.stock_qty}</td><td>{p.reorder_level}</td></tr>)}</tbody></table>
          )}
        </div>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <div className="chart-title">Latest sales orders</div>
        {s.latest.length === 0 ? <Empty text="No sales yet" /> : (
          <table className="table"><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Total</th></tr></thead>
            <tbody>{s.latest.map(o => <tr key={o.order_id}><td>SO-{o.order_id}</td><td>{o.order_date}</td><td>{o.customer_name}</td><td>{money(o.total_amount)}</td></tr>)}</tbody></table>
        )}
      </div>
    </div>
  );
}
