import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Download, FileText, Printer, CheckCircle, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import {
  SALES_ORDERS, SERVICE_JOBS, PRODUCTS, PURCHASE_ORDERS, PAYMENTS,
  CUSTOMERS, SUPPLIERS, CATEGORIES, REPORT_SCHEDULES, RETURNS, fmt, getLowStockProducts, getCustomer, getProduct, getUser
} from '../data/mockData';
import { format, subMonths } from 'date-fns';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { generateStructuredPDF } from '../utils/pdfGenerator';
import { buildReport, reportToCSV, salesLines, serviceJobs, purchases } from '../utils/reportBuilder';
import { lastSixMonths, sum } from '../data/reportData';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 14px' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color || 'var(--text-primary)' }}>
            {p.name}: {typeof p.value === 'number' && p.value > 1000 ? fmt(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Chart data from the sales history + records made in the app
const chartData = () => {
  const lines = salesLines();
  const jobs = serviceJobs();
  const monthlySales = lastSixMonths().map(m => {
    const ls = lines.filter(l => l.month === m.key);
    return { month: m.short, revenue: sum(ls, l => l.total), orders: new Set(ls.map(l => l.invoiceNo)).size };
  });
  const serviceStats = ['installation', 'repair', 'maintenance'].map(t => ({
    type: t.charAt(0).toUpperCase() + t.slice(1), count: jobs.filter(j => j.type === t).length,
  }));
  const stockByCategory = CATEGORIES.map(c => ({
    name: c.name, value: PRODUCTS.filter(p => p.category === c.id).reduce((a, p) => a + p.stock, 0),
  }));
  return { monthlySales, serviceStats, stockByCategory };
};

export default function ReportsPage() {
  const toast = useToast();
  const { user, canDo } = useAuth();
  // Report types each role may generate (from the use case diagram)
  const REPORT_TYPES = {
    admin: ['consolidated', 'sales', 'stock', 'service', 'finance'],
    sales: ['sales'], storekeeper: ['stock'], purchase: ['purchase', 'stock'], finance: ['finance', 'sales'], technician: ['service'],
  };
  REPORT_TYPES.admin = ['consolidated', 'sales', 'stock', 'service', 'purchase', 'finance'];
  const REPORT_LABELS = { consolidated: 'Consolidated (all departments)', sales: 'Sales & Revenue', stock: 'Stock & Valuation', service: 'Service & Repairs', purchase: 'Purchasing', finance: 'Financial Statement' };
  const allowedTypes = REPORT_TYPES[user?.role] || ['sales'];
  const [reportType, setReportType] = useState(allowedTypes[0]);
  const [schedules, setSchedules] = useState(() => [...REPORT_SCHEDULES]);
  const [newSchedule, setNewSchedule] = useState({ type: allowedTypes[0], frequency: 'weekly', recipients: user?.email || '' });

  // Schedule automated report
  const addSchedule = () => {
    const rs = { id: `RS${String(REPORT_SCHEDULES.length + 1).padStart(3, '0')}`, type: newSchedule.type, frequency: newSchedule.frequency,
      recipients: newSchedule.recipients.split(',').map(r => r.trim()).filter(Boolean), active: true, lastRun: null, createdBy: user?.id };
    REPORT_SCHEDULES.push(rs);
    setSchedules([...REPORT_SCHEDULES]);
    toast.success(`${REPORT_LABELS[rs.type] || rs.type} report scheduled ${rs.frequency}`);
  };
  const toggleSchedule = (id) => {
    const r = REPORT_SCHEDULES.find(x => x.id === id);
    if (r) r.active = !r.active;
    setSchedules([...REPORT_SCHEDULES]);
  };

  const { monthlySales, serviceStats, stockByCategory } = chartData();
  const allLines = salesLines();
  const totalRevenue = sum(allLines, l => l.total);
  const totalCost = sum(purchases().filter(p => p.status === 'received'), p => p.total);
  const grossProfit = sum(allLines, l => l.total - l.unitCost * l.qty);
  const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;
  const report = buildReport(reportType);

  // Grouped PDF report
  const exportPDF = () => {
    try {
      generateStructuredPDF({
        title: report.title,
        subtitle: report.subtitle,
        reportType,
        generatedBy: user?.name || 'Administrator',
        fileName: `${report.title.replace(/[^A-Za-z]+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        kpis: report.kpis,
        sections: report.sections,
      });
      toast.success(`${report.title} downloaded as PDF`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF report: ' + err.message);
    }
  };

  const exportCSV = () => {
    const blob = new Blob([reportToCSV(report)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded as CSV');
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="reports-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Executive business intelligence, structured PDF statements, and audits</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={reportType}
            onChange={e => setReportType(e.target.value)}
            style={{ width: 190 }}
          >
            {allowedTypes.map(t => <option key={t} value={t}>{REPORT_LABELS[t]}</option>)}
          </select>

          {/* Download as Structured PDF Button */}
          <button id="btn-export-pdf" className="btn btn-primary" onClick={exportPDF}>
            <FileText size={15} /> Download PDF
          </button>

          {/* Quick Print Button */}
          <button id="btn-print-report" className="btn btn-outline" onClick={printReport}>
            <Printer size={15} /> Print
          </button>

          {/* Export CSV Button */}
          <button id="btn-export-csv" className="btn btn-outline" onClick={exportCSV}>
            <Download size={15} /> CSV
          </button>
        </div>
      </div>

      {/* Scheduled reports (Schedule automated report) */}
      {canDo('report.schedule') && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Scheduled Reports</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Reports that are e-mailed automatically on a schedule</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <select id="schedule-type" className="form-select" value={newSchedule.type} onChange={e => setNewSchedule(n => ({ ...n, type: e.target.value }))} style={{ width: 220 }}>
              {allowedTypes.map(t => <option key={t} value={t}>{REPORT_LABELS[t]}</option>)}
            </select>
            <select id="schedule-frequency" className="form-select" value={newSchedule.frequency} onChange={e => setNewSchedule(n => ({ ...n, frequency: e.target.value }))} style={{ width: 130 }}>
              <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
            </select>
            <input id="schedule-recipients" className="form-input" value={newSchedule.recipients} onChange={e => setNewSchedule(n => ({ ...n, recipients: e.target.value }))} placeholder="E-mails, separated by commas" style={{ flex: 1, minWidth: 200 }} />
            <button id="btn-add-schedule" className="btn btn-primary" disabled={!newSchedule.recipients.trim()} onClick={addSchedule}>Schedule Report</button>
          </div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>ID</th><th>Report</th><th>Frequency</th><th>Recipients</th><th>Last run</th><th>Active</th></tr></thead>
              <tbody>
                {schedules.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.id}</td>
                    <td>{REPORT_LABELS[r.type] || r.type.replace(/_/g, ' ')}</td>
                    <td style={{ textTransform: 'capitalize' }}>{r.frequency}</td>
                    <td style={{ fontSize: 12 }}>{r.recipients.join(', ')}</td>
                    <td style={{ fontSize: 12 }}>{r.lastRun || '—'}</td>
                    <td><input type="checkbox" checked={r.active} onChange={() => toggleSchedule(r.id)} aria-label={`Active ${r.id}`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Financial Summary KPIs */}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { label: 'Total Revenue',   value: fmt(totalRevenue), cls: 'primary' },
          { label: 'Total Purchases', value: fmt(totalCost),    cls: 'warning' },
          { label: 'Gross Profit',    value: fmt(grossProfit),  cls: 'success' },
          { label: 'Profit Margin',   value: `${profitMargin}%`, cls: 'accent' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-card-header"><span className="stat-card-label">{s.label}</span></div>
            <div className="stat-card-value" style={{ fontSize: 22 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Report preview: the same grouped sections that go into the PDF */}
      <div className="card" id="report-preview" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{report.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Preview of the PDF report</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>{report.subtitle}</div>
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: 16 }}>
          {report.kpis.map(k => (
            <div key={k.label} className="stat-card" style={{ borderTop: `3px solid ${k.color}` }}>
              <div className="stat-card-header"><span className="stat-card-label">{k.label}</span></div>
              <div className="stat-card-value" style={{ fontSize: 18 }}>{k.value}</div>
            </div>
          ))}
        </div>
        {report.sections.map(sec => (
          <div key={sec.heading} style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, paddingLeft: 8, borderLeft: '3px solid var(--primary-500, #3b82f6)' }}>{sec.heading}</div>
            <div className="table-container">
              <table className="table">
                <thead><tr>{sec.headers.map((h, i) => <th key={h} style={{ textAlign: sec.align[i] }}>{h}</th>)}</tr></thead>
                <tbody>
                  {sec.rows.map((r, ri) => r.group ? (
                    <tr key={ri}><td colSpan={sec.headers.length} style={{ fontWeight: 700, background: 'var(--bg-elevated)', color: 'var(--primary-500, #3b82f6)' }}>{r.group}</td></tr>
                  ) : (
                    <tr key={ri} style={r.subtotal ? { fontWeight: 700, background: 'var(--bg-elevated)' } : undefined}>
                      {(r.subtotal || r).map((c, ci) => <td key={ci} style={{ textAlign: sec.align[ci] }}>{c}</td>)}
                    </tr>
                  ))}
                </tbody>
                {sec.total && (
                  <tfoot><tr>{sec.total.map((c, ci) => <td key={ci} style={{ textAlign: sec.align[ci], fontWeight: 800, borderTop: '2px solid var(--border-default)' }}>{c}</td>)}</tr></tfoot>
                )}
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Monthly Revenue */}
        <div className="chart-card">
          <div className="chart-title">Monthly Revenue Trend (Last 6 Months)</div>
          <div className="chart-subtitle">Revenue and order count trend</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Service breakdown */}
        <div className="chart-card">
          <div className="chart-title">Service Jobs by Type</div>
          <div className="chart-subtitle">Breakdown of job categories</div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={serviceStats} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                {serviceStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Stock by Category */}
        <div className="chart-card">
          <div className="chart-title">Stock Distribution by Category</div>
          <div className="chart-subtitle">Total units per category</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stockByCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
              <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" stroke="var(--text-muted)" tick={{ fontSize: 11 }} width={110} />
              <Tooltip />
              <Bar dataKey="value" name="Units" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Orders trend */}
        <div className="chart-card">
          <div className="chart-title">Order Count Trend</div>
          <div className="chart-subtitle">Monthly order volumes</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="orders" name="Orders" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low Stock Report */}
      {getLowStockProducts().length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ Low Stock Alert Report
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Product</th><th>SKU</th><th>Current Stock</th><th>Min Stock</th><th>Shortage</th></tr>
              </thead>
              <tbody>
                {getLowStockProducts().map(p => (
                  <tr key={p.id}>
                    <td>{p.emoji} {p.name}</td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{p.sku}</span></td>
                    <td style={{ color: 'var(--warning-400)', fontWeight: 700 }}>{p.stock}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{p.minStock}</td>
                    <td style={{ color: 'var(--danger-400)', fontWeight: 700 }}>−{p.minStock - p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Customers */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Top Customers by Revenue</div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Customer</th><th>Total Orders</th><th>Total Spent</th><th>Outstanding</th></tr>
            </thead>
            <tbody>
              {CUSTOMERS.map(c => {
                const orders = SALES_ORDERS.filter(o => o.customerId === c.id);
                const spent = orders.reduce((s, o) => s + o.amountPaid, 0);
                const outstanding = orders.reduce((s, o) => s + o.balance, 0);
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{orders.length}</td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--success-400)' }}>{fmt(spent)}</span></td>
                    <td><span style={{ fontFamily: 'var(--font-mono)', color: outstanding > 0 ? 'var(--danger-400)' : 'var(--text-secondary)' }}>{fmt(outstanding)}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
