import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, ShoppingCart, Package, Wrench,
  CreditCard, AlertTriangle, ArrowRight, Users, Truck, RefreshCw
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { getAllTransactions, SUPPLIER_PAYMENTS } from '../data/store';
import { subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  SALES_ORDERS, SERVICE_JOBS, PRODUCTS, CUSTOMERS, PURCHASE_ORDERS,
  PAYMENTS, RETURNS, COMPLAINTS, getLowStockProducts, getOverduePOs,
  getOutstandingInvoices, getDailySalesData, fmt, CATEGORIES
} from '../data/store';
import { useAuth } from '../context/AuthContext';
import { AUDIT_LOG } from '../data/store';
import { format } from 'date-fns';

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#6366f1'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-default)', borderRadius:8, padding:'10px 14px' }}>
        <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>{label}</p>
        {payload.map((p,i) => (
          <p key={i} style={{ fontSize:13, fontWeight:700, color:p.color }}>
            {p.name === 'revenue' ? fmt(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function StatCard({ label, value, change, changeDir, icon: Icon, colorClass }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className={`stat-card-icon ${colorClass}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      {change && (
        <div className={`stat-card-change ${changeDir}`}>
          {changeDir === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {change}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, can, canDo } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [refreshedAt, setRefreshedAt] = useState(new Date());
  const [period, setPeriod] = useState(30);   // financial analytics period (days)
  const refresh = () => { setRefreshedAt(new Date()); toast.success(user?.role === 'finance' ? 'Analytics updated' : 'Dashboard updated'); };
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const activityToday = AUDIT_LOG.some(a => (a.timestamp || '').slice(0, 10) === todayStr) || SALES_ORDERS.some(o => o.date === todayStr);
  // Financial analytics for the chosen period
  const since = format(subDays(new Date(), period), 'yyyy-MM-dd');
  const finTx = getAllTransactions().filter(t => (t.date || '') >= since);
  const finIn = finTx.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const finOut = finTx.filter(t => t.amount < 0).reduce((a, t) => a - t.amount, 0);
  const finOutstanding = SALES_ORDERS.reduce((a, o) => a + (o.balance || 0), 0);
  const finPayables = PURCHASE_ORDERS.filter(p => p.payableStatus === 'pending').reduce((a, p) => a + (p.grandTotal || 0), 0);

  const salesData = getDailySalesData();
  const totalRevenue = SALES_ORDERS.reduce((s,o) => s + o.grandTotal, 0);
  const totalPaid = PAYMENTS.reduce((s,p) => s + p.amount, 0);
  const lowStock = getLowStockProducts();
  const overduePOs = getOverduePOs();
  const outstanding = getOutstandingInvoices();
  // A technician only counts the jobs assigned to him
  const pendingJobs = SERVICE_JOBS.filter(j => ['pending', 'assigned', 'in-progress', 'on-hold'].includes(j.status) &&
    (user?.role !== 'technician' || j.assignedTo === user.id));
  const openComplaints = COMPLAINTS.filter(c => c.status === 'open');

  // Sales by product category (from the sales order lines)
  const categoryData = CATEGORIES.map(c => ({
    name: c.name,
    value: SALES_ORDERS.filter(o => o.status !== 'on-hold').reduce((s, o) => s + o.items.filter(i => PRODUCTS.find(p => p.id === i.productId)?.category === c.id).reduce((a, i) => a + i.total, 0), 0),
  })).filter(c => c.value > 0).sort((x, y) => y.value - x.value).slice(0, 5);

  // Changes shown under the figures, worked out from the records
  const isoDay = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
  const revIn = (from, to) => SALES_ORDERS.filter(o => o.date >= isoDay(from) && o.date < isoDay(to)).reduce((s, o) => s + o.grandTotal, 0);
  const thisWeek = revIn(7, -1), lastWeek = revIn(14, 7);
  const revChange = lastWeek ? Math.round((thisWeek - lastWeek) * 100 / lastWeek) : null;
  const monthKey = new Date().toISOString().slice(0, 7);
  const paidThisMonth = PAYMENTS.filter(p => (p.date || '').startsWith(monthKey)).reduce((s, p) => s + p.amount, 0);
  const newCustomers = CUSTOMERS.filter(c => (c.createdAt || '').startsWith(monthKey)).length;


  const recentActivity = AUDIT_LOG.slice(0, 6);

  const activityColor = (action) => {
    if (action.includes('SALE') || action.includes('PAYMENT')) return 'var(--success-500)';
    if (action.includes('STOCK') || action.includes('ADJUST')) return 'var(--warning-500)';
    if (action.includes('JOB') || action.includes('SERVICE')) return 'var(--primary-500)';
    if (action.includes('REFUND') || action.includes('RETURN')) return 'var(--danger-500)';
    return 'var(--gray-500)';
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening with your business today · {format(new Date(),'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="page-header-actions">
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Updated {format(refreshedAt, 'hh:mm:ss a')}</span>
          <button id="btn-refresh-dashboard" className="btn btn-outline" onClick={refresh}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {!activityToday && (
        <div id="no-activity-today" className="alert alert-info" style={{ marginBottom: 16 }}>
          <AlertTriangle size={16} /> <span>No activity recorded for today.</span>
        </div>
      )}

      {/* Real-time financial analytics (Finance Manager) */}
      {user?.role === 'finance' && (
        <div className="card" id="financial-analytics" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Financial Analytics</div>
            <select id="analytics-period" className="form-select" value={period} onChange={e => setPeriod(+e.target.value)} style={{ width: 170 }}>
              <option value={1}>Today</option><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option>
            </select>
          </div>
          {finTx.length === 0 ? (
            <div id="no-fin-activity" className="alert alert-info"><span>No financial activity for this period.</span></div>
          ) : (
            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
              {[['Money in', finIn, 'success'], ['Money out', finOut, 'danger'], ['Net cash flow', finIn - finOut, 'primary'], ['Customers owe', finOutstanding, 'warning'], ['Payables due', finPayables, 'accent']].map(([l, v, c]) => (
                <div key={l} className={`stat-card ${c}`}><div className="stat-card-header"><span className="stat-card-label">{l}</span></div><div className="stat-card-value" style={{ fontSize: 18 }}>{fmt(v)}</div></div>
              ))}
              <div className="stat-card"><div className="stat-card-header"><span className="stat-card-label">Transactions</span></div><div className="stat-card-value" style={{ fontSize: 18 }}>{finTx.length}</div></div>
            </div>
          )}
        </div>
      )}

      {/* Alerts */}
      {(lowStock.length > 0 || overduePOs.length > 0 || openComplaints.length > 0) && (
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
          {lowStock.length > 0 && (
            <div className="alert alert-warning" style={{ cursor:'pointer' }} onClick={() => navigate('/stock', { state: { filter: 'low' } })}>
              <AlertTriangle size={16} />
              <span><strong>{lowStock.length} products</strong> are at or below minimum stock level. <span style={{ textDecoration:'underline' }}>View →</span></span>
            </div>
          )}
          {overduePOs.length > 0 && (
            <div className="alert alert-danger" style={{ cursor:'pointer' }} onClick={() => navigate('/purchase-orders')}>
              <AlertTriangle size={16} />
              <span><strong>{overduePOs.length} purchase order(s)</strong> are overdue. <span style={{ textDecoration:'underline' }}>View →</span></span>
            </div>
          )}
          {openComplaints.length > 0 && (
            <div className="alert alert-info">
              <AlertTriangle size={16} />
              <span><strong>{openComplaints.length} complaint(s)</strong> are open and require attention.</span>
            </div>
          )}
        </div>
      )}

      {/* KPI Grid */}
      <div className="stat-grid">
        <StatCard
          label="Total Revenue" value={fmt(totalRevenue)} icon={TrendingUp}
          colorClass="primary" change={revChange === null ? 'No sales last week' : `${revChange >= 0 ? '+' : ''}${revChange}% vs last week`} changeDir={revChange === null || revChange >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label="Sales Orders" value={SALES_ORDERS.length} icon={ShoppingCart}
          colorClass="success" change={`${outstanding.length} outstanding`} changeDir="up"
        />
        <StatCard
          label={user?.role === 'technician' ? 'My Active Jobs' : 'Active Service Jobs'} value={pendingJobs.length} icon={Wrench}
          colorClass="warning"
        />
        <StatCard
          label="Payments Collected" value={fmt(totalPaid)} icon={CreditCard}
          colorClass="accent" change={`${fmt(paidThisMonth)} this month`} changeDir="up"
        />
        <StatCard
          label="Low Stock Items" value={lowStock.length} icon={Package}
          colorClass={lowStock.length > 0 ? 'danger' : 'success'}
          change={lowStock.length > 0 ? 'Action required' : 'All stocked'}
          changeDir={lowStock.length > 0 ? 'down' : 'up'}
        />
        <StatCard
          label="Total Customers" value={CUSTOMERS.length} icon={Users}
          colorClass="primary" change={`+${newCustomers} this month`} changeDir="up"
        />
        <StatCard
          label="Pending POs" value={PURCHASE_ORDERS.filter(p=>p.status!=='received').length} icon={Truck}
          colorClass="warning"
        />
        <StatCard
          label="Open Complaints" value={openComplaints.length} icon={AlertTriangle}
          colorClass={openComplaints.length > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Charts Row */}
      <div className="dashboard-grid">
        {/* Revenue Chart */}
        <div className="chart-card">
          <div className="chart-title">Revenue — Last 7 Days</div>
          <div className="chart-subtitle">Daily sales revenue trend</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salesData} margin={{ top:0, right:0, left:0, bottom:0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="label" stroke="var(--text-muted)" tick={{ fontSize:12 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize:12 }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill:'#3b82f6', r:4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="chart-card">
          <div className="chart-title">Sales by Category</div>
          <div className="chart-subtitle">Revenue breakdown</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3}>
                {categoryData.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize:12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Recent Activity */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <div style={{ fontWeight:700, fontSize:14 }}>Recent Activity</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>Latest system actions</div>
            </div>
          </div>
          <div className="activity-list">
            {recentActivity.map(a => (
              <div key={a.id} className="activity-item">
                <div className="activity-dot" style={{ background: activityColor(a.action) }} />
                <div className="activity-content">
                  <div className="activity-text">{a.detail}</div>
                  <div className="activity-time">{format(new Date(a.timestamp), 'MMM d, h:mm a')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Quick Actions</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>Jump to common tasks</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { label:'New Sale', path:'/pos', act:'sale.create', color:'var(--primary-500)', icon:'🛒' },
              { label:'New Purchase Order', state:{ open:'new' }, path:'/purchase-orders', act:'po.create', color:'var(--warning-500)', icon:'📦' },
              { label:'New Service Job', state:{ open:'new' }, path:'/service-jobs', act:'service.create', color:'var(--accent-500)', icon:'🔧' },
              { label:'Record Payment', state:{ open:'new' }, path:'/payments', act:'payment.record', color:'var(--success-500)', icon:'💳' },
              { label:'Stock Adjustment', path:'/stock', act:'stock.adjust', color:'var(--danger-400)', icon:'📊' },
              { label:'My Service Jobs', path:'/service-jobs', act:'service.updateStatus', color:'var(--accent-500)', icon:'🛠️' },
              { label:'View Reports', path:'/reports', perm:'reports', color:'var(--gray-400)', icon:'📈' },
            ].filter(item => item.act ? canDo(item.act) : can(item.perm)).map(item => (
              <button
                key={item.label}
                id={`dashboard-quick-${item.path.replace('/','')}`}
                className="btn btn-outline"
                style={{ justifyContent:'flex-start', gap:10, fontSize:13 }}
                onClick={() => navigate(item.path, item.state ? { state: item.state } : undefined)}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                <ArrowRight size={14} style={{ marginLeft:'auto', opacity:0.4 }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
