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

// Sales by month (last 6 months)
const monthlySales = Array.from({ length: 6 }, (_, i) => {
  const d = subMonths(new Date(), 5 - i);
  const month = format(d, 'MMM');
  const monthStr = format(d, 'yyyy-MM');
  const orders = SALES_ORDERS.filter(o => o.date?.startsWith(monthStr));
  return {
    month,
    revenue: orders.reduce((s, o) => s + o.grandTotal, 0) || Math.round(Math.random() * 500000 + 200000),
    orders: orders.length || Math.round(Math.random() * 10 + 5)
  };
});

// Service stats
const serviceStats = [
  { type: 'Installation', count: SERVICE_JOBS.filter(j => j.type === 'installation').length },
  { type: 'Repair',       count: SERVICE_JOBS.filter(j => j.type === 'repair').length },
  { type: 'Maintenance',  count: SERVICE_JOBS.filter(j => j.type === 'maintenance').length },
];

// Stock by category
const stockByCategory = [
  { name: 'Processors', value: 23 },
  { name: 'Motherboards', value: 13 },
  { name: 'Memory & Storage', value: 6 },
  { name: 'Graphics Cards', value: 17 },
  { name: 'Peripherals', value: 25 },
  { name: 'Spare Parts', value: 55 },
];

export default function ReportsPage() {
  const toast = useToast();
  const { user, canDo } = useAuth();
  // Report types each role may generate (from the use case diagram)
  const REPORT_TYPES = {
    admin: ['consolidated', 'sales', 'stock', 'service', 'finance'],
    sales: ['sales'], storekeeper: ['stock'], purchase: ['stock'], finance: ['finance', 'sales'], technician: ['service'],
  };
  const REPORT_LABELS = { consolidated: 'Consolidated (all departments)', sales: 'Sales & Revenue', stock: 'Stock & Valuation', service: 'Service & Repairs', finance: 'Financial Statement' };
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

  const totalRevenue = SALES_ORDERS.reduce((s, o) => s + o.grandTotal, 0);
  const totalCost = PURCHASE_ORDERS.filter(p => p.status === 'received').reduce((s, p) => s + p.grandTotal, 0);
  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Structured PDF Export Handler
  const exportPDF = () => {
    try {
      if (reportType === 'consolidated') {
        const stockValue = PRODUCTS.reduce((a, p) => a + p.stock * p.cost, 0);
        const paidIn = PAYMENTS.reduce((a, p) => a + p.amount, 0);
        const payablePending = PURCHASE_ORDERS.filter(p => p.payableStatus === 'pending').reduce((a, p) => a + p.grandTotal, 0);
        const rows = [
          ['Sales', 'Orders / revenue', `${SALES_ORDERS.length} orders`, fmt(totalRevenue)],
          ['Sales', 'Outstanding customer balance', `${SALES_ORDERS.filter(o => o.balance > 0).length} invoices`, fmt(SALES_ORDERS.reduce((a, o) => a + o.balance, 0))],
          ['Purchasing', 'Purchase orders received', `${PURCHASE_ORDERS.filter(p => p.status === 'received').length} of ${PURCHASE_ORDERS.length}`, fmt(totalCost)],
          ['Inventory', 'Stock value at cost', `${PRODUCTS.length} products, ${getLowStockProducts().length} low`, fmt(stockValue)],
          ['Service', 'Service jobs', `${SERVICE_JOBS.filter(j => j.status === 'completed').length} completed of ${SERVICE_JOBS.length}`, fmt(SERVICE_JOBS.reduce((a, j) => a + (j.serviceFee || 0), 0))],
          ['Returns', 'Exchange / refund requests', `${RETURNS.filter(r => r.status === 'pending').length} pending of ${RETURNS.length}`, fmt(RETURNS.reduce((a, r) => a + (r.refundAmount || 0), 0))],
          ['Finance', 'Customer payments received', `${PAYMENTS.length} payments`, fmt(paidIn)],
          ['Finance', 'Supplier payables pending', `${PURCHASE_ORDERS.filter(p => p.payableStatus === 'pending').length} payables`, fmt(payablePending)],
        ];
        generateStructuredPDF({
          title: 'Consolidated Business Report',
          subtitle: 'Sales, purchasing, inventory, service and finance in one summary',
          reportType: 'consolidated',
          generatedBy: user?.name || 'Authorized Admin',
          fileName: `Consolidated_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
          kpis: [
            { label: 'Revenue', value: fmt(totalRevenue), color: '#3b82f6' },
            { label: 'Purchases', value: fmt(totalCost), color: '#ef4444' },
            { label: 'Gross Profit', value: fmt(grossProfit), color: '#10b981' },
            { label: 'Stock Value', value: fmt(stockValue), color: '#8b5cf6' },
          ],
          headers: ['Department', 'Measure', 'Count', 'Amount (LKR)'],
          rows,
        });
      } else if (reportType === 'sales') {
        const headers = ['Invoice No', 'Date', 'Customer', 'Items', 'Status', 'Total (LKR)', 'Paid (LKR)', 'Balance'];
        const rows = SALES_ORDERS.map(o => {
          const cust = getCustomer(o.customerId);
          return [
            o.invoiceNo || o.id,
            o.date,
            cust?.name || 'Walk-in Customer',
            o.items?.reduce((s, it) => s + it.qty, 0) || 1,
            o.paymentStatus?.toUpperCase(),
            fmt(o.grandTotal),
            fmt(o.amountPaid),
            fmt(o.balance)
          ];
        });

        generateStructuredPDF({
          title: 'Sales & Revenue Performance Statement',
          subtitle: 'Official breakdown of customer sales orders, tax invoices, and payment statuses',
          reportType: 'sales',
          generatedBy: user?.name || 'Authorized Admin',
          fileName: `Sales_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
          kpis: [
            { label: 'Total Revenue', value: fmt(totalRevenue), color: '#3b82f6' },
            { label: 'Total Orders', value: SALES_ORDERS.length, color: '#10b981' },
            { label: 'Gross Margin', value: `${profitMargin}%`, color: '#8b5cf6' },
            { label: 'Outstanding Balance', value: fmt(SALES_ORDERS.reduce((s, o) => s + o.balance, 0)), color: '#ef4444' }
          ],
          headers,
          rows,
          totals: {
            label: 'Total Revenue Sum:',
            value: fmt(totalRevenue)
          }
        });
      } else if (reportType === 'stock') {
        const headers = ['SKU', 'Product Name', 'Category', 'Stock Qty', 'Min Stock', 'Unit Cost', 'Selling Price', 'Status'];
        const rows = PRODUCTS.map(p => {
          const cat = CATEGORIES.find(c => c.id === p.category)?.name || p.category;
          const status = p.stock === 0 ? 'OUT OF STOCK' : p.stock <= p.minStock ? 'LOW STOCK' : 'IN STOCK';
          return [
            p.sku,
            p.name,
            cat,
            p.stock,
            p.minStock,
            fmt(p.costPrice || p.price * 0.75),
            fmt(p.price),
            status
          ];
        });

        const totalStockUnits = PRODUCTS.reduce((s, p) => s + p.stock, 0);
        const totalValuation = PRODUCTS.reduce((s, p) => s + (p.stock * p.price), 0);

        generateStructuredPDF({
          title: 'Inventory Valuation & Warehouse Stock Report',
          subtitle: 'Real-time SKU quantities, minimum stock safety thresholds, and inventory valuation',
          reportType: 'stock',
          generatedBy: user?.name || 'Authorized Admin',
          fileName: `Inventory_Stock_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
          kpis: [
            { label: 'Total SKUs', value: PRODUCTS.length, color: '#3b82f6' },
            { label: 'Units in Stock', value: totalStockUnits, color: '#10b981' },
            { label: 'Low Stock Alerts', value: getLowStockProducts().length, color: '#f59e0b' },
            { label: 'Stock Valuation', value: fmt(totalValuation), color: '#8b5cf6' }
          ],
          headers,
          rows,
          totals: {
            label: 'Total Valuation:',
            value: fmt(totalValuation)
          }
        });
      } else if (reportType === 'service') {
        const headers = ['Job ID', 'Customer', 'Product', 'Type', 'Status', 'Technician', 'Service Fee', 'Billing'];
        const rows = SERVICE_JOBS.map(j => {
          const cust = getCustomer(j.customerId);
          const prod = getProduct(j.productId);
          const tech = getUser(j.assignedTo);
          return [
            j.id,
            cust?.name || 'Customer',
            prod?.name || 'Equipment',
            j.type?.toUpperCase(),
            j.status?.toUpperCase(),
            tech?.name || 'Unassigned',
            fmt(j.serviceFee || 0),
            j.billingStatus || 'unbilled'
          ];
        });

        generateStructuredPDF({
          title: 'Service, Maintenance & Repair Performance Report',
          subtitle: 'Detailed record of installations, warranty repairs, and technician assignments',
          reportType: 'service',
          generatedBy: user?.name || 'Authorized Admin',
          fileName: `Service_Performance_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
          kpis: [
            { label: 'Total Job Tickets', value: SERVICE_JOBS.length, color: '#3b82f6' },
            { label: 'Completed Jobs', value: SERVICE_JOBS.filter(j => j.status === 'completed').length, color: '#10b981' },
            { label: 'In Progress / Assigned', value: SERVICE_JOBS.filter(j => j.status !== 'completed').length, color: '#f59e0b' },
            { label: 'Under Warranty', value: SERVICE_JOBS.filter(j => j.warrantyValid).length, color: '#8b5cf6' }
          ],
          headers,
          rows
        });
      } else {
        // Financial Statement
        const headers = ['Receipt / PO Ref', 'Category', 'Party / Counterparty', 'Date', 'Method / Status', 'Amount (LKR)'];
        const rows = [
          ...PAYMENTS.map(p => {
            const c = getCustomer(p.customerId);
            return [
              p.id,
              'Customer Receipt',
              c?.name || 'Walk-in',
              p.date,
              p.method?.toUpperCase(),
              `+ ${fmt(p.amount)}`
            ];
          }),
          ...PURCHASE_ORDERS.map(po => {
            const s = SUPPLIERS.find(sup => sup.id === po.supplierId);
            return [
              po.id,
              'Supplier Payable',
              s?.name || 'Supplier',
              po.date,
              po.payableStatus?.toUpperCase(),
              `- ${fmt(po.grandTotal)}`
            ];
          })
        ];

        generateStructuredPDF({
          title: 'Corporate Financial Statement & Cash Flow Report',
          subtitle: 'Audit record of customer payment inflows, supplier purchase payables, and net position',
          reportType: 'finance',
          generatedBy: user?.name || 'Authorized Admin',
          fileName: `Financial_Statement_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
          kpis: [
            { label: 'Total Inflow Received', value: fmt(PAYMENTS.reduce((s, p) => s + p.amount, 0)), color: '#10b981' },
            { label: 'Supplier Purchases', value: fmt(totalCost), color: '#ef4444' },
            { label: 'Gross Operating Profit', value: fmt(grossProfit), color: '#3b82f6' },
            { label: 'Net Margin', value: `${profitMargin}%`, color: '#8b5cf6' }
          ],
          headers,
          rows
        });
      }

      toast.success('Well-structured PDF report generated and downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF report: ' + err.message);
    }
  };

  const exportCSV = () => {
    const data = reportType === 'sales' ? SALES_ORDERS : reportType === 'stock' ? PRODUCTS : reportType === 'finance' ? PAYMENTS
      : reportType === 'consolidated' ? [
        { department: 'Sales', amount: totalRevenue }, { department: 'Purchasing', amount: totalCost },
        { department: 'Service', amount: SERVICE_JOBS.reduce((a, j) => a + (j.serviceFee || 0), 0) }, { department: 'Finance (received)', amount: PAYMENTS.reduce((a, p) => a + p.amount, 0) },
      ] : SERVICE_JOBS;
    const header = Object.keys(data[0] || {}).filter(k => typeof data[0][k] !== 'object').join(',');
    const rows = data.map(r => Object.entries(r).filter(([_, v]) => typeof v !== 'object').map(([_, v]) => v).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
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
              <YAxis dataKey="name" type="category" stroke="var(--text-muted)" tick={{ fontSize: 11 }} width={70} />
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
