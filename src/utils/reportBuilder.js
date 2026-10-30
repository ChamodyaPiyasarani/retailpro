// ============================================================
// Builds grouped management reports.
// One report = title + KPI cards + sections.
// A section = heading + table. Table rows can be:
//   [cells]                 normal row
//   { group: 'Label' }      group heading row (e.g. a category)
//   { subtotal: [cells] }   subtotal row for the group above
// section.total = [cells]  grand-total row at the bottom
// The same object is used for the PDF, the CSV and the screen.
// ============================================================
import {
  SALES_ORDERS, SERVICE_JOBS, PRODUCTS, PURCHASE_ORDERS, PAYMENTS, SUPPLIER_PAYMENTS,
  CUSTOMERS, SUPPLIERS, CATEGORIES, RETURNS, STOCK_MOVEMENTS, getUser, fmt,
} from '../data/mockData';
import { SALES_HISTORY, SERVICE_HISTORY, PURCHASE_HISTORY, groupBy, sum, lastSixMonths } from '../data/reportData';

const pct = (a, b) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : '0.0%');
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ') : '');
const catName = (id) => CATEGORIES.find(c => c.id === id)?.name || id;
const custName = (id) => CUSTOMERS.find(c => c.id === id)?.name || 'Walk-in customer';
const supName = (id) => SUPPLIERS.find(s => s.id === id)?.name || id;
const product = (id) => PRODUCTS.find(p => p.id === id);

// ---------- Data sources (sample history + records made in the app) ----------
export function salesLines() {
  const live = SALES_ORDERS.flatMap(o => {
    const sub = o.items?.reduce((a, it) => a + it.total, 0) || 1;
    return (o.items || []).map(it => {
      const p = product(it.productId);
      const share = it.total / sub;
      return {
        invoiceNo: o.invoiceNo || o.id, date: o.date, month: o.date?.slice(0, 7), customerId: o.customerId,
        productId: it.productId, category: p?.category, qty: it.qty, unitPrice: it.unitPrice, unitCost: p?.cost || it.unitPrice * 0.75,
        discount: it.discount || 0, total: it.total, method: o.paymentMethod,
        paid: Math.round((o.amountPaid || 0) * share), balance: Math.round((o.balance || 0) * share),
      };
    });
  });
  return [...SALES_HISTORY, ...live];
}

export function serviceJobs() {
  const live = SERVICE_JOBS.map(j => ({
    id: j.id, date: j.createdAt, type: j.type, status: j.status, technician: getUser(j.assignedTo)?.name || 'Unassigned',
    warranty: !!j.warrantyValid, fee: j.serviceFee || 0, days: null,
  }));
  return [...SERVICE_HISTORY, ...live];
}

export function purchases() {
  const live = PURCHASE_ORDERS.map(po => ({
    id: po.id, date: po.date, supplierId: po.supplierId, qty: po.items?.reduce((a, it) => a + it.qty, 0) || 0,
    total: po.grandTotal || 0, status: po.status, onTime: true, paid: po.payableStatus === 'paid',
  }));
  return [...PURCHASE_HISTORY, ...live];
}

const invoicesOf = (lines) => new Set(lines.map(l => l.invoiceNo)).size;
const profitOf = (lines) => sum(lines, l => l.total - l.unitCost * l.qty);

// ---------- Sales ----------
function salesReport() {
  const lines = salesLines();
  const months = lastSixMonths();
  const revenue = sum(lines, l => l.total);
  const profit = profitOf(lines);

  const byMonth = months.map(m => {
    const ls = lines.filter(l => l.month === m.key);
    const r = sum(ls, l => l.total), p = profitOf(ls);
    return [m.label, invoicesOf(ls), sum(ls, l => l.qty), fmt(r), fmt(p), pct(p, r)];
  });

  const catRows = [];
  Object.entries(groupBy(lines, l => l.category)).sort((a, b) => sum(b[1], l => l.total) - sum(a[1], l => l.total)).forEach(([cat, ls]) => {
    catRows.push({ group: catName(cat) });
    Object.entries(groupBy(ls, l => l.productId)).sort((a, b) => sum(b[1], l => l.total) - sum(a[1], l => l.total)).forEach(([pid, pl]) => {
      catRows.push([product(pid)?.name || pid, sum(pl, l => l.qty), fmt(sum(pl, l => l.total)), fmt(profitOf(pl))]);
    });
    catRows.push({ subtotal: [`${catName(cat)} subtotal`, sum(ls, l => l.qty), fmt(sum(ls, l => l.total)), fmt(profitOf(ls))] });
  });

  const top = Object.entries(groupBy(lines, l => l.productId))
    .map(([pid, pl]) => ({ pid, units: sum(pl, l => l.qty), rev: sum(pl, l => l.total) }))
    .sort((a, b) => b.rev - a.rev).slice(0, 5)
    .map((t, i) => [`${i + 1}`, product(t.pid)?.name || t.pid, catName(product(t.pid)?.category), t.units, fmt(t.rev), pct(t.rev, revenue)]);

  const byMethod = Object.entries(groupBy(lines, l => l.method)).sort((a, b) => sum(b[1], l => l.total) - sum(a[1], l => l.total))
    .map(([m, ls]) => [cap(m), invoicesOf(ls), fmt(sum(ls, l => l.total)), pct(sum(ls, l => l.total), revenue)]);

  const byCustomer = Object.entries(groupBy(lines, l => l.customerId || 'walk-in'))
    .map(([c, ls]) => ({ c, inv: invoicesOf(ls), rev: sum(ls, l => l.total), bal: sum(ls, l => l.balance) }))
    .sort((a, b) => b.rev - a.rev)
    .map(x => [x.c === 'walk-in' ? 'Walk-in customers' : custName(x.c), x.inv, fmt(x.rev), fmt(x.bal)]);

  return {
    title: 'Sales & Revenue Report',
    subtitle: `Sales for the last 6 months (${months[0].label} – ${months[5].label}), grouped by month, category, product, payment method and customer`,
    kpis: [
      { label: 'Revenue', value: fmt(revenue), color: '#3b82f6' },
      { label: 'Invoices', value: invoicesOf(lines), color: '#10b981' },
      { label: 'Gross profit', value: fmt(profit), color: '#8b5cf6' },
      { label: 'Margin', value: pct(profit, revenue), color: '#f59e0b' },
    ],
    sections: [
      { heading: '1. Sales by month', headers: ['Month', 'Invoices', 'Units', 'Revenue', 'Gross profit', 'Margin'], rows: byMonth,
        total: ['Total', invoicesOf(lines), sum(lines, l => l.qty), fmt(revenue), fmt(profit), pct(profit, revenue)] },
      { heading: '2. Sales by category and product', headers: ['Product', 'Units', 'Revenue', 'Gross profit'], rows: catRows,
        total: ['Grand total', sum(lines, l => l.qty), fmt(revenue), fmt(profit)] },
      { heading: '3. Top 5 products by revenue', headers: ['Rank', 'Product', 'Category', 'Units', 'Revenue', 'Share'], rows: top },
      { heading: '4. Sales by payment method', headers: ['Method', 'Invoices', 'Amount', 'Share'], rows: byMethod,
        total: ['Total', invoicesOf(lines), fmt(revenue), '100%'] },
      { heading: '5. Sales by customer', headers: ['Customer', 'Invoices', 'Revenue', 'Outstanding'], rows: byCustomer,
        total: ['Total', invoicesOf(lines), fmt(revenue), fmt(sum(lines, l => l.balance))] },
    ],
  };
}

// ---------- Stock ----------
function stockReport() {
  const status = (p) => (p.stock === 0 ? 'Out of stock' : p.stock <= p.minStock ? 'Low stock' : 'In stock');
  const rows = [];
  CATEGORIES.forEach(c => {
    const ps = PRODUCTS.filter(p => p.category === c.id);
    if (!ps.length) return;
    rows.push({ group: c.name });
    ps.forEach(p => rows.push([p.sku, p.name, p.stock, p.minStock, fmt(p.stock * p.cost), fmt(p.stock * p.price), status(p)]));
    rows.push({ subtotal: [`${c.name} subtotal`, `${ps.length} product${ps.length === 1 ? "" : "s"}`, sum(ps, p => p.stock), '', fmt(sum(ps, p => p.stock * p.cost)), fmt(sum(ps, p => p.stock * p.price)), ''] });
  });
  const low = PRODUCTS.filter(p => p.stock <= p.minStock);
  const lowRows = low.map(p => [p.sku, p.name, p.stock, p.minStock, p.minStock - p.stock, Math.max(p.minStock * 2 - p.stock, 1), supName(p.supplierId)]);
  const movRows = ['in', 'out', 'adj'].map(t => {
    const ms = STOCK_MOVEMENTS.filter(m => m.type === t);
    return [{ in: 'Stock in (purchases)', out: 'Stock out (sales / service)', adj: 'Adjustments' }[t], ms.length, sum(ms, m => Math.abs(m.qty))];
  });
  const costValue = sum(PRODUCTS, p => p.stock * p.cost);
  const retailValue = sum(PRODUCTS, p => p.stock * p.price);
  return {
    title: 'Stock & Valuation Report',
    subtitle: 'Stock on hand grouped by category, with value at cost and at selling price, and the reorder list',
    kpis: [
      { label: 'Products', value: PRODUCTS.length, color: '#3b82f6' },
      { label: 'Units on hand', value: sum(PRODUCTS, p => p.stock), color: '#10b981' },
      { label: 'Value at cost', value: fmt(costValue), color: '#8b5cf6' },
      { label: 'Low stock', value: low.length, color: '#ef4444' },
    ],
    sections: [
      { heading: '1. Stock value by category', headers: ['SKU', 'Product', 'Qty', 'Min', 'Cost value', 'Retail value', 'Status'], rows,
        total: ['Grand total', `${PRODUCTS.length} products`, sum(PRODUCTS, p => p.stock), '', fmt(costValue), fmt(retailValue), ''] },
      { heading: '2. Reorder list (stock at or below minimum)', headers: ['SKU', 'Product', 'Qty', 'Min', 'Short by', 'Suggested order', 'Supplier'],
        rows: lowRows.length ? lowRows : [['—', 'No products below minimum stock', '', '', '', '', '']] },
      { heading: '3. Stock movements summary', headers: ['Movement', 'Records', 'Units'], rows: movRows,
        total: ['Total', STOCK_MOVEMENTS.length, sum(STOCK_MOVEMENTS, m => Math.abs(m.qty))] },
    ],
  };
}

// ---------- Service ----------
function serviceReport() {
  const jobs = serviceJobs();
  const done = (js) => js.filter(j => j.status === 'completed').length;
  const open = (js) => js.filter(j => !['completed', 'cancelled'].includes(j.status)).length;
  const fees = sum(jobs, j => j.fee);
  const byType = Object.entries(groupBy(jobs, j => j.type)).map(([t, js]) =>
    [cap(t), js.length, done(js), open(js), js.filter(j => j.warranty).length, fmt(sum(js, j => j.fee))]);
  const byStatus = Object.entries(groupBy(jobs, j => j.status)).sort((a, b) => b[1].length - a[1].length)
    .map(([s, js]) => [cap(s), js.length, pct(js.length, jobs.length)]);
  const byTech = Object.entries(groupBy(jobs, j => j.technician)).map(([t, js]) => {
    const timed = js.filter(j => j.days);
    return [t, js.length, done(js), timed.length ? (sum(timed, j => j.days) / timed.length).toFixed(1) : '—', fmt(sum(js, j => j.fee))];
  });
  const months = lastSixMonths();
  const byMonth = months.map(m => {
    const js = jobs.filter(j => j.date?.startsWith(m.key));
    return [m.label, js.length, done(js), fmt(sum(js, j => j.fee))];
  });
  return {
    title: 'Service & Repairs Report',
    subtitle: 'Installation, repair and maintenance jobs grouped by type, status, technician and month',
    kpis: [
      { label: 'Jobs', value: jobs.length, color: '#3b82f6' },
      { label: 'Completed', value: done(jobs), color: '#10b981' },
      { label: 'Open', value: open(jobs), color: '#f59e0b' },
      { label: 'Service fees', value: fmt(fees), color: '#8b5cf6' },
    ],
    sections: [
      { heading: '1. Jobs by type', headers: ['Type', 'Jobs', 'Completed', 'Open', 'Warranty', 'Fees'], rows: byType,
        total: ['Total', jobs.length, done(jobs), open(jobs), jobs.filter(j => j.warranty).length, fmt(fees)] },
      { heading: '2. Jobs by status', headers: ['Status', 'Jobs', 'Share'], rows: byStatus, total: ['Total', jobs.length, '100%'] },
      { heading: '3. Technician performance', headers: ['Technician', 'Jobs', 'Completed', 'Avg. days', 'Fees'], rows: byTech,
        total: ['Total', jobs.length, done(jobs), '', fmt(fees)] },
      { heading: '4. Jobs by month', headers: ['Month', 'Jobs', 'Completed', 'Fees'], rows: byMonth },
    ],
  };
}

// ---------- Purchasing ----------
function purchaseReport() {
  const pos = purchases();
  const total = sum(pos, p => p.total);
  const bySup = SUPPLIERS.map(s => {
    const ps = pos.filter(p => p.supplierId === s.id);
    return [s.name, ps.length, sum(ps, p => p.qty), fmt(sum(ps, p => p.total)), pct(ps.filter(p => p.onTime).length, ps.length), `${s.rating} / 5`];
  });
  const months = lastSixMonths();
  const byMonth = months.map(m => {
    const ps = pos.filter(p => p.date?.startsWith(m.key));
    return [m.label, ps.length, fmt(sum(ps, p => p.total))];
  });
  const pending = pos.filter(p => p.status !== 'received')
    .map(p => [p.id, p.date, supName(p.supplierId), cap(p.status), fmt(p.total)]);
  return {
    title: 'Purchasing Report',
    subtitle: 'Purchase orders grouped by supplier and month, with supplier delivery performance',
    kpis: [
      { label: 'Purchase orders', value: pos.length, color: '#3b82f6' },
      { label: 'Purchased', value: fmt(total), color: '#ef4444' },
      { label: 'Suppliers', value: SUPPLIERS.length, color: '#10b981' },
      { label: 'Not received', value: pending.length, color: '#f59e0b' },
    ],
    sections: [
      { heading: '1. Purchases by supplier', headers: ['Supplier', 'Orders', 'Units', 'Amount', 'On time', 'Rating'], rows: bySup,
        total: ['Total', pos.length, sum(pos, p => p.qty), fmt(total), pct(pos.filter(p => p.onTime).length, pos.length), ''] },
      { heading: '2. Purchases by month', headers: ['Month', 'Orders', 'Amount'], rows: byMonth },
      { heading: '3. Orders not yet received', headers: ['PO', 'Date', 'Supplier', 'Status', 'Amount'],
        rows: pending.length ? pending : [['—', '', 'All orders received', '', '']] },
    ],
  };
}

// ---------- Finance ----------
function financeReport() {
  const lines = salesLines();
  const pos = purchases();
  const recRows = Object.entries(groupBy(lines.filter(l => l.customerId), l => l.customerId)).map(([c, ls]) =>
    ({ c, inv: invoicesOf(ls), billed: sum(ls, l => l.total), paid: sum(ls, l => l.paid), bal: sum(ls, l => l.balance) }))
    .sort((a, b) => b.bal - a.bal)
    .map(x => [custName(x.c), x.inv, fmt(x.billed), fmt(x.paid), fmt(x.bal)]);
  const named = lines.filter(l => l.customerId);
  const received = sum(lines, l => l.paid);
  const byMethod = Object.entries(groupBy(lines.filter(l => l.paid > 0), l => l.method))
    .map(([m, ls]) => [cap(m), invoicesOf(ls), fmt(sum(ls, l => l.paid)), pct(sum(ls, l => l.paid), received)]);
  const paySup = SUPPLIERS.map(s => {
    const ps = pos.filter(p => p.supplierId === s.id && p.status === 'received');
    const paid = sum(ps.filter(p => p.paid), p => p.total);
    return [s.name, `${s.paymentTerms} days`, fmt(sum(ps, p => p.total)), fmt(paid), fmt(sum(ps, p => p.total) - paid)];
  });
  const recvd = pos.filter(p => p.status === 'received');
  const months = lastSixMonths();
  const cash = months.map(m => {
    const inflow = sum(lines.filter(l => l.month === m.key), l => l.paid);
    const outflow = sum(pos.filter(p => p.paid && p.date?.startsWith(m.key)), p => p.total);
    return [m.label, fmt(inflow), fmt(outflow), fmt(inflow - outflow)];
  });
  const inflowAll = received, outflowAll = sum(pos.filter(p => p.paid), p => p.total);
  const refunds = sum(RETURNS, r => r.refundAmount || 0);
  return {
    title: 'Financial Statement',
    subtitle: 'Money owed by customers, payments received, money owed to suppliers and monthly cash flow',
    kpis: [
      { label: 'Received', value: fmt(inflowAll), color: '#10b981' },
      { label: 'Paid to suppliers', value: fmt(outflowAll), color: '#ef4444' },
      { label: 'Customers owe', value: fmt(sum(lines, l => l.balance)), color: '#f59e0b' },
      { label: 'Refunds', value: fmt(refunds), color: '#8b5cf6' },
    ],
    sections: [
      { heading: '1. Outstanding by customer (receivables)', headers: ['Customer', 'Invoices', 'Billed', 'Paid', 'Outstanding'], rows: recRows,
        total: ['Total', invoicesOf(named), fmt(sum(named, l => l.total)), fmt(sum(named, l => l.paid)), fmt(sum(named, l => l.balance))] },
      { heading: '2. Payments received by method', headers: ['Method', 'Invoices', 'Amount', 'Share'], rows: byMethod,
        total: ['Total', '', fmt(received), '100%'] },
      { heading: '3. Payables by supplier', headers: ['Supplier', 'Terms', 'Received goods', 'Paid', 'Pending'], rows: paySup,
        total: ['Total', '', fmt(sum(recvd, p => p.total)), fmt(sum(recvd.filter(p => p.paid), p => p.total)), fmt(sum(recvd.filter(p => !p.paid), p => p.total))] },
      { heading: '4. Monthly cash flow', headers: ['Month', 'Money in', 'Money out', 'Net'], rows: cash,
        total: ['Total', fmt(inflowAll), fmt(outflowAll), fmt(inflowAll - outflowAll)] },
    ],
    // also used by the old "customer payments" figure
    extra: { payments: PAYMENTS.length, supplierPayments: SUPPLIER_PAYMENTS.length },
  };
}

// ---------- Consolidated ----------
function consolidatedReport() {
  const lines = salesLines(), jobs = serviceJobs(), pos = purchases();
  const revenue = sum(lines, l => l.total), purchased = sum(pos, p => p.total), fees = sum(jobs, j => j.fee);
  const stockValue = sum(PRODUCTS, p => p.stock * p.cost);
  const months = lastSixMonths();
  const monthly = months.map(m => {
    const r = sum(lines.filter(l => l.month === m.key), l => l.total);
    const s = sum(jobs.filter(j => j.date?.startsWith(m.key)), j => j.fee);
    const p = sum(pos.filter(x => x.date?.startsWith(m.key)), x => x.total);
    return [m.label, fmt(r), fmt(s), fmt(p), fmt(r + s - p)];
  });
  const dept = [
    { group: 'Sales' },
    ['Invoices / revenue', `${invoicesOf(lines)} invoices`, fmt(revenue)],
    ['Customers still owe', `${CUSTOMERS.length} customers`, fmt(sum(lines, l => l.balance))],
    { group: 'Purchasing' },
    ['Purchase orders', `${pos.length} orders`, fmt(purchased)],
    ['Orders not yet received', `${pos.filter(p => p.status !== 'received').length} orders`, fmt(sum(pos.filter(p => p.status !== 'received'), p => p.total))],
    { group: 'Inventory' },
    ['Stock value at cost', `${PRODUCTS.length} products`, fmt(stockValue)],
    ['Low stock products', `${PRODUCTS.filter(p => p.stock <= p.minStock).length} products`, ''],
    { group: 'Service' },
    ['Service jobs', `${jobs.length} jobs`, fmt(fees)],
    ['Returns / exchanges', `${RETURNS.length} requests`, fmt(sum(RETURNS, r => r.refundAmount || 0))],
  ];
  return {
    title: 'Consolidated Business Report',
    subtitle: 'All departments in one summary: sales, purchasing, inventory, service and finance',
    kpis: [
      { label: 'Revenue', value: fmt(revenue), color: '#3b82f6' },
      { label: 'Service fees', value: fmt(fees), color: '#10b981' },
      { label: 'Purchases', value: fmt(purchased), color: '#ef4444' },
      { label: 'Stock value', value: fmt(stockValue), color: '#8b5cf6' },
    ],
    sections: [
      { heading: '1. Department summary', headers: ['Measure', 'Count', 'Amount'], rows: dept },
      { heading: '2. Monthly overview', headers: ['Month', 'Sales', 'Service fees', 'Purchases', 'Net'], rows: monthly,
        total: ['Total', fmt(revenue), fmt(fees), fmt(purchased), fmt(revenue + fees - purchased)] },
    ],
  };
}

export const REPORT_BUILDERS = {
  consolidated: consolidatedReport, sales: salesReport, stock: stockReport,
  service: serviceReport, purchase: purchaseReport, finance: financeReport,
};
// A column is right-aligned when every value in it is a number, money, % or blank
const isNumeric = (v) => /^(LKR\s?)?[-\d.,%\s/]*$|^—$/.test(String(v ?? '').replace(/\u00a0/g, ' ')) || /^\d+ (products|orders|invoices|jobs|customers|requests|days|product)$/.test(String(v));
function withAlign(report) {
  report.sections.forEach(sec => {
    const plain = sec.rows.filter(r => !r.group).map(r => r.subtotal || r);
    sec.align = sec.headers.map((_, i) => (i === 0 ? 'left' : plain.every(r => isNumeric(r[i])) ? 'right' : 'left'));
  });
  return report;
}
export const buildReport = (type) => withAlign((REPORT_BUILDERS[type] || salesReport)());

// CSV text: every section one after another
export function reportToCSV(report) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const out = [esc(report.title), ''];
  report.sections.forEach(sec => {
    out.push(esc(sec.heading));
    out.push(sec.headers.map(esc).join(','));
    sec.rows.forEach(r => {
      if (r.group) out.push(esc(r.group));
      else out.push((r.subtotal || r).map(esc).join(','));
    });
    if (sec.total) out.push(sec.total.map(esc).join(','));
    out.push('');
  });
  return out.join('\n');
}
