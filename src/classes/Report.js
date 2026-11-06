// Class: Report  (table: report)
// Report ⇢ SalesOrder, Product, Payment, ServiceJob, Invoice, PurchaseOrder (dependency: it only reads their data)
//
// The 3 report use cases of the use case diagram each have several reports:
//   Generate business report  (Admin / Manager)   – Sales, Product sales, Customer, Service
//   Generate stock report     (Storekeeper)       – Stock level, Stock movement, Low stock & reorder
//   Generate financial report (Finance Manager)   – Income & payments, Outstanding invoices, Purchases & supplier payments, Returns & refunds
// report.report_type is saved as the name of the report, e.g. "Sales report".
import { insertRow, readAll, run, table, today, money } from './db';

export const REPORTS = [
  { key: 'sales', group: 'Business', name: 'Sales report', perm: 'Generate business report', about: 'Sales orders and income for each day' },
  { key: 'product-sales', group: 'Business', name: 'Product sales report', perm: 'Generate business report', about: 'What was sold: quantity and value for each product and category' },
  { key: 'customers', group: 'Business', name: 'Customer report', perm: 'Generate business report', about: 'Orders, money spent and unpaid balance of each customer' },
  { key: 'service', group: 'Business', name: 'Service report', perm: 'Generate business report', about: 'Service jobs, their status, technicians and service income' },
  { key: 'stock-level', group: 'Stock', name: 'Stock level report', perm: 'Generate stock report', about: 'Quantity and value in stock for each product' },
  { key: 'stock-movement', group: 'Stock', name: 'Stock movement report', perm: 'Generate stock report', about: 'Every stock in, out and adjustment' },
  { key: 'low-stock', group: 'Stock', name: 'Low stock report', perm: 'Generate stock report', about: 'Products at or below the reorder level and what is already on order' },
  { key: 'income', group: 'Financial', name: 'Income & payments report', perm: 'Generate financial report', about: 'Money received, paid to suppliers and refunded' },
  { key: 'outstanding', group: 'Financial', name: 'Outstanding invoices report', perm: 'Generate financial report', about: 'Unpaid invoices grouped by how many days late' },
  { key: 'purchases', group: 'Financial', name: 'Supplier purchases report', perm: 'Generate financial report', about: 'Purchase orders of each supplier, paid and still to pay' },
  { key: 'returns', group: 'Financial', name: 'Returns & refunds report', perm: 'Generate financial report', about: 'Return requests, their status and refunds paid' },
];
export const reportByKey = (key) => REPORTS.find(r => r.key === key);
// a saved report_type back to its report (old rows only have "Business", "Stock" or "Financial")
export const reportOfType = (type = '') => REPORTS.find(r => r.name === type) || REPORTS.find(r => r.group === type);

const between = (rows, col, from, to) => rows.filter(r => r[col] >= from && r[col] <= to);
const sum = (rows, f) => rows.reduce((s, r) => s + Number(f(r) || 0), 0);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

export default class Report {
  // + generate()  – SD "Generate business / stock / financial report": check dates -> read data -> totals -> save report
  static async generate({ key, from, to, userId }) {
    const def = reportByKey(key);
    if (!def) throw new Error('Please choose a report');
    if (!from || !to || from > to || to > today()) throw new Error('Please choose valid dates (From must be before To, and To cannot be in the future)');
    const data = await Report.calculateTotals(key, from, to);
    const saved = await insertRow('report', { report_type: def.name, from_date: from, to_date: to, created_date: today(), user_id: userId });
    return { ...data, report: saved, key, name: def.name, group: def.group, from, to };
  }

  // + calculateTotals()  – reads the tables of one report and works out its totals
  static async calculateTotals(key, from, to) {
    const products = await readAll('product', {}, 'product_name');
    const pname = (id) => products.find(p => p.product_id === id)?.product_name || `#${id}`;
    const customers = await readAll('customer');
    const cname = (id) => customers.find(c => c.customer_id === id)?.name || '—';

    if (key === 'sales') {
      const all = between(await readAll('sales_order'), 'order_date', from, to);
      const orders = all.filter(o => o.status === 'Completed');
      const days = {};
      orders.forEach(o => { const d = days[o.order_date] ||= { n: 0, sub: 0, disc: 0, tot: 0 }; d.n++; d.sub += Number(o.subtotal); d.disc += Number(o.discount_amount); d.tot += Number(o.total_amount); });
      const rows = Object.entries(days).sort((a, b) => a[0].localeCompare(b[0]));
      const total = sum(orders, o => o.total_amount);
      return {
        summary: [['Completed sales orders', orders.length], ['Cancelled orders', all.length - orders.length], ['Sales before discount', money(sum(orders, o => o.subtotal))],
          ['Discounts given', money(sum(orders, o => o.discount_amount))], ['Sales income', money(total)], ['Average order value', money(orders.length ? total / orders.length : 0)]],
        head: ['Date', 'Orders', 'Before discount', 'Discount', 'Total'],
        rows: rows.map(([d, v]) => [d, v.n, money(v.sub), money(v.disc), money(v.tot)]),
        chart: { title: 'Sales income by day', data: rows.map(([d, v]) => ({ label: d.slice(5), value: v.tot })) },
      };
    }
    if (key === 'product-sales') {
      const orders = between(await readAll('sales_order', { status: 'Completed' }), 'order_date', from, to);
      const ids = new Set(orders.map(o => o.order_id));
      const items = (await readAll('sales_order_item')).filter(i => ids.has(i.order_id));
      const cats = await readAll('category');
      const by = {};
      items.forEach(i => { const v = by[i.product_id] ||= { qty: 0, value: 0 }; v.qty += i.quantity; v.value += Number(i.subtotal); });
      const rows = Object.entries(by).map(([id, v]) => { const p = products.find(x => x.product_id === Number(id)); return [p?.product_name || id, cats.find(c => c.category_id === p?.category_id)?.category_name || '—', v.qty, v.value]; })
        .sort((a, b) => b[3] - a[3]);
      const byCat = {};
      rows.forEach(r => { byCat[r[1]] = (byCat[r[1]] || 0) + r[3]; });
      return {
        summary: [['Different products sold', rows.length], ['Items sold', sum(rows, r => r[2])], ['Sales value', money(sum(rows, r => r[3]))],
          ['Best seller', rows[0] ? `${rows[0][0]} (${money(rows[0][3])})` : '—'], ...Object.entries(byCat).map(([c, v]) => [`Category: ${c}`, money(v)])],
        head: ['Product', 'Category', 'Quantity sold', 'Sales value'],
        rows: rows.map(r => [r[0], r[1], r[2], money(r[3])]),
        chart: { title: 'Sales value by product', data: rows.slice(0, 10).map(r => ({ label: r[0].slice(0, 14), value: r[3] })) },
      };
    }
    if (key === 'customers') {
      const orders = between(await readAll('sales_order', { status: 'Completed' }), 'order_date', from, to);
      const invoices = await readAll('invoice', { status: 'Unpaid' });
      const allOrders = await readAll('sales_order');
      const jobs = await readAll('service_job');
      const ownerOf = (i) => (i.order_id ? allOrders.find(o => o.order_id === i.order_id)?.customer_id : jobs.find(j => j.job_id === i.job_id)?.customer_id);
      const unpaid = (cid) => sum(invoices.filter(i => ownerOf(i) === cid), i => Number(i.amount) - Number(i.paid_amount));
      const rows = customers.map(c => { const mine = orders.filter(o => o.customer_id === c.customer_id); return [c.name, c.phone, mine.length, sum(mine, o => o.total_amount), mine.map(o => o.order_date).sort().pop() || '—', unpaid(c.customer_id)]; })
        .filter(r => r[2] > 0 || r[5] > 0).sort((a, b) => b[3] - a[3]);
      return {
        summary: [['Customers who bought', rows.filter(r => r[2] > 0).length], ['New customers in these dates', between(customers, 'registered_date', from, to).length],
          ['Total spent', money(sum(rows, r => r[3]))], ['Top customer', rows[0] ? `${rows[0][0]} (${money(rows[0][3])})` : '—'], ['Unpaid balance (today)', money(sum(rows, r => r[5]))]],
        head: ['Customer', 'Phone', 'Orders', 'Spent', 'Last order', 'Unpaid now'],
        rows: rows.map(r => [r[0], r[1], r[2], money(r[3]), r[4], money(r[5])]),
        chart: { title: 'Money spent by customer', data: rows.slice(0, 10).map(r => ({ label: r[0].split(' ')[0], value: r[3] })) },
      };
    }
    if (key === 'service') {
      const jobs = between(await readAll('service_job', {}, 'job_id'), 'request_date', from, to);
      const techs = await readAll('technician');
      const users = await readAll('user');
      const tname = (id) => users.find(u => u.user_id === techs.find(t => t.technician_id === id)?.user_id)?.name || 'Not assigned';
      const status = ['Pending', 'Assigned', 'In Progress', 'Completed'].map(s => [`Status ${s}`, jobs.filter(j => j.status === s).length]);
      const done = jobs.filter(j => j.status === 'Completed' && j.completed_date);
      const byTech = {};
      jobs.forEach(j => { const k = tname(j.technician_id); byTech[k] = (byTech[k] || 0) + 1; });
      return {
        summary: [['Service jobs', jobs.length], ...status, ['Service income', money(sum(done, j => j.service_charge))],
          ['Average days to complete', done.length ? (sum(done, j => daysBetween(j.request_date, j.completed_date)) / done.length).toFixed(1) : '—']],
        head: ['Job', 'Date', 'Customer', 'Product', 'Type', 'Technician', 'Status', 'Charge'],
        rows: jobs.map(j => [`JOB-${j.job_id}`, j.request_date, cname(j.customer_id), pname(j.product_id), j.job_type, tname(j.technician_id), j.status, money(j.service_charge)]),
        chart: { title: 'Jobs by technician', data: Object.entries(byTech).map(([k, n]) => ({ label: k.split(' ')[0], value: n })) },
      };
    }
    if (key === 'stock-level') {
      const act = products.filter(p => p.is_active);
      return {
        summary: [['Products for sale', act.length], ['Items in stock', sum(act, p => p.stock_qty)], ['Stock value (cost price)', money(sum(act, p => p.stock_qty * Number(p.cost_price)))],
          ['Stock value (selling price)', money(sum(act, p => p.stock_qty * Number(p.unit_price)))], ['Low-stock products', act.filter(p => p.stock_qty <= p.reorder_level).length],
          ['Out of stock', act.filter(p => p.stock_qty === 0).length]],
        head: ['Product', 'In stock', 'Reorder level', 'Cost price', 'Stock value', 'Status'],
        rows: act.map(p => [p.product_name, p.stock_qty, p.reorder_level, money(p.cost_price), money(p.stock_qty * Number(p.cost_price)), p.stock_qty <= p.reorder_level ? 'Low stock' : 'OK']),
        chart: { title: 'Quantity in stock', data: act.map(p => ({ label: p.product_name.slice(0, 14), value: p.stock_qty })) },
      };
    }
    if (key === 'stock-movement') {
      const moves = between(await readAll('stock_movement', {}, 'movement_id'), 'movement_date', from, to);
      const users = await readAll('user');
      const by = {};
      moves.forEach(m => { const v = by[m.product_id] ||= { in: 0, out: 0 }; if (m.movement_type === 'Out' || m.quantity < 0) v.out += Math.abs(m.quantity); else v.in += m.quantity; });
      return {
        summary: [['Movements', moves.length], ['Stock in (received from suppliers)', sum(moves.filter(m => m.movement_type === 'In'), m => m.quantity)],
          ['Stock out (spare parts issued)', sum(moves.filter(m => m.movement_type === 'Out'), m => Math.abs(m.quantity))],
          ['Adjustments', moves.filter(m => m.movement_type === 'Adjustment').length], ['Items removed by adjustment', sum(moves.filter(m => m.movement_type === 'Adjustment' && m.quantity < 0), m => -m.quantity)]],
        head: ['Date', 'Type', 'Product', 'Quantity', 'Reason', 'Reference', 'By'],
        rows: moves.map(m => [m.movement_date, m.movement_type, pname(m.product_id), m.quantity, m.reason || '', m.po_id ? `PO-${m.po_id}` : m.job_id ? `JOB-${m.job_id}` : '', users.find(u => u.user_id === m.user_id)?.name || '']),
        chart: { title: 'Items in and out by product', data: Object.entries(by).map(([id, v]) => ({ label: pname(Number(id)).slice(0, 14), value: v.in, value2: v.out })), labels: ['In', 'Out'] },
      };
    }
    if (key === 'low-stock') {
      const low = products.filter(p => p.is_active && p.stock_qty <= p.reorder_level);
      const alerts = await readAll('stock_alert');
      const pos = (await readAll('purchase_order')).filter(p => ['Pending', 'Approved'].includes(p.status));
      const poItems = pos.length ? await run(table('purchase_order_item').select('*').in('po_id', pos.map(p => p.po_id))) : [];
      const onOrder = (pid) => sum(poItems.filter(i => i.product_id === pid), i => i.quantity - i.received_qty);
      return {
        summary: [['Low-stock products', low.length], ['Out of stock', low.filter(p => p.stock_qty === 0).length], ['Open low-stock alerts', alerts.filter(a => a.status === 'Open').length],
          ['Alerts made in these dates', between(alerts, 'alert_date', from, to).length], ['Low products already on order', low.filter(p => onOrder(p.product_id) > 0).length]],
        head: ['Product', 'In stock', 'Reorder level', 'Suggested order', 'Already on order', 'Alert date'],
        rows: low.map(p => [p.product_name, p.stock_qty, p.reorder_level, Math.max(p.reorder_level * 2 - p.stock_qty, 1), onOrder(p.product_id), alerts.find(a => a.product_id === p.product_id && a.status === 'Open')?.alert_date || '—']),
        chart: { title: 'Stock against reorder level', data: low.map(p => ({ label: p.product_name.slice(0, 14), value: p.stock_qty, value2: p.reorder_level })), labels: ['In stock', 'Reorder level'] },
      };
    }
    if (key === 'income') {
      const pays = between(await readAll('payment', {}, 'payment_id'), 'payment_date', from, to);
      const refunds = between(await readAll('refund'), 'refund_date', from, to);
      const cin = sum(pays.filter(p => p.payment_type === 'Customer'), p => p.amount);
      const sout = sum(pays.filter(p => p.payment_type === 'Supplier'), p => p.amount);
      const ref = sum(refunds, r => r.amount);
      const methods = {};
      pays.filter(p => p.payment_type === 'Customer').forEach(p => { methods[p.method] = (methods[p.method] || 0) + Number(p.amount); });
      const days = {};
      pays.forEach(p => { const d = days[p.payment_date] ||= { in: 0, out: 0 }; if (p.payment_type === 'Customer') d.in += Number(p.amount); else d.out += Number(p.amount); });
      refunds.forEach(r => { (days[r.refund_date] ||= { in: 0, out: 0 }).out += Number(r.amount); });
      return {
        summary: [['Money received from customers', money(cin)], ...Object.entries(methods).map(([m, v]) => [`– received by ${m}`, money(v)]), ['Paid to suppliers', money(sout)], ['Refunds paid', money(ref)], ['Net cash', money(cin - sout - ref)]],
        head: ['Date', 'Type', 'Reference', 'Method', 'Receipt / cheque', 'Amount'],
        rows: [...pays.map(p => [p.payment_date, p.payment_type + ' payment', p.invoice_id ? `INV-${p.invoice_id}` : `PO-${p.po_id}`, p.method, p.receipt_no || p.cheque_no || '', money(p.payment_type === 'Supplier' ? -p.amount : p.amount)]),
          ...refunds.map(r => [r.refund_date, 'Refund', `RET-${r.request_id}`, r.method, '', money(-r.amount)])].sort((a, b) => a[0].localeCompare(b[0])),
        chart: { title: 'Money in and out by day', data: Object.entries(days).sort((a, b) => a[0].localeCompare(b[0])).map(([d, v]) => ({ label: d.slice(5), value: v.in, value2: v.out })), labels: ['In', 'Out'] },
      };
    }
    if (key === 'outstanding') {
      const invs = (await readAll('invoice', { status: 'Unpaid' }, 'due_date')).filter(i => i.invoice_date <= to);
      const orders = await readAll('sales_order');
      const jobs = await readAll('service_job');
      const custOf = (i) => cname(i.order_id ? orders.find(o => o.order_id === i.order_id)?.customer_id : jobs.find(j => j.job_id === i.job_id)?.customer_id);
      const bal = (i) => Number(i.amount) - Number(i.paid_amount);
      const late = (i) => Math.max(daysBetween(i.due_date, today()), 0);
      const BANDS = ['Not due yet', '1–30 days late', '31–60 days late', 'More than 60 days late'];
      const band = (i) => { const d = late(i); return BANDS[d === 0 ? 0 : d <= 30 ? 1 : d <= 60 ? 2 : 3]; };
      const bands = BANDS.map(b => [b, sum(invs.filter(i => band(i) === b), bal)]);
      return {
        summary: [['Unpaid invoices', invs.length], ['Total still to receive', money(sum(invs, bal))], ...bands.map(([b, v]) => [b, money(v)])],
        head: ['Invoice', 'For', 'Customer', 'Invoice date', 'Due date', 'Days late', 'Amount', 'Paid', 'Balance'],
        rows: invs.map(i => [`INV-${i.invoice_id}`, i.order_id ? `SO-${i.order_id}` : `JOB-${i.job_id}`, custOf(i), i.invoice_date, i.due_date, late(i), money(i.amount), money(i.paid_amount), money(bal(i))]),
        chart: { title: 'Balance by days late', data: bands.map(([b, v]) => ({ label: b, value: v })) },
      };
    }
    if (key === 'purchases') {
      const pos = between(await readAll('purchase_order', {}, 'po_id'), 'order_date', from, to);
      const sups = await readAll('supplier');
      const pays = await readAll('payment', { payment_type: 'Supplier' });
      const paidOf = (po) => sum(pays.filter(p => p.po_id === po.po_id), p => p.amount);
      const real = pos.filter(p => p.status !== 'Rejected');
      const by = {};
      real.forEach(p => { const k = sups.find(s => s.supplier_id === p.supplier_id)?.supplier_name || '—'; const v = by[k] ||= { n: 0, total: 0, paid: 0 }; v.n++; v.total += Number(p.total_amount); v.paid += paidOf(p); });
      return {
        summary: [['Purchase orders', pos.length], ['Rejected', pos.length - real.length], ['Total ordered', money(sum(real, p => p.total_amount))],
          ['Paid to suppliers', money(sum(real, paidOf))], ['Received but not paid yet', money(sum(real.filter(p => p.status === 'Received'), p => Number(p.total_amount) - paidOf(p)))],
          ...['Pending', 'Approved', 'Received', 'Paid'].map(s => [`Status ${s}`, pos.filter(p => p.status === s).length])],
        head: ['Supplier', 'Orders', 'Total ordered', 'Paid', 'Not paid'],
        rows: Object.entries(by).map(([k, v]) => [k, v.n, money(v.total), money(v.paid), money(v.total - v.paid)]),
        chart: { title: 'Ordered and paid by supplier', data: Object.entries(by).map(([k, v]) => ({ label: k.split(' ')[0], value: v.total, value2: v.paid })), labels: ['Ordered', 'Paid'] },
      };
    }
    if (key === 'returns') {
      const reqs = between(await readAll('return_request', {}, 'request_id'), 'request_date', from, to);
      const refunds = await readAll('refund');
      const st = ['Pending', 'Approved', 'Rejected', 'Refunded'].map(s => [s, reqs.filter(r => r.status === s).length]);
      return {
        summary: [['Return requests', reqs.length], ...st.map(([s, n]) => [`Status ${s}`, n]), ['Refunds paid', money(sum(refunds.filter(f => reqs.some(r => r.request_id === f.request_id)), f => f.amount))]],
        head: ['Request', 'Date', 'Order', 'Product', 'Reason', 'Status', 'Refund'],
        rows: reqs.map(r => { const f = refunds.find(x => x.request_id === r.request_id); return [`RET-${r.request_id}`, r.request_date, `SO-${r.order_id}`, pname(r.product_id), r.reason, r.status, f ? money(f.amount) : '—']; }),
        chart: { title: 'Return requests by status', data: st.map(([s, n]) => ({ label: s, value: n })) },
      };
    }
    throw new Error('Unknown report');
  }

  // + export()  – download the report as a PDF
  static async export(rep) {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const doc = new jsPDF({ orientation: rep.head.length > 6 ? 'landscape' : 'portrait' });
    doc.setFontSize(16); doc.text(`Rajida Holdings – ${rep.name}`, 14, 18);
    doc.setFontSize(10); doc.text(`${rep.group} report.  From ${rep.from} to ${rep.to}   (made on ${today()})`, 14, 25);
    autoTable(doc, { startY: 30, head: [['Item', 'Value']], body: rep.summary.map(r => r.map(String)) });
    autoTable(doc, { startY: doc.lastAutoTable.finalY + 8, head: [rep.head], body: rep.rows.map(r => r.map(String)) });
    doc.save(`${rep.name.replace(/[^a-z]+/gi, '-')}-${rep.from}-to-${rep.to}.pdf`);
  }

  // + getDashboardSummary()  – SD "View dashboard": today's sales, low stock, pending jobs and orders
  static async getDashboardSummary() {
    const t = today();
    const orders = await readAll('sales_order', { status: 'Completed' });
    const todays = orders.filter(o => o.order_date === t);
    const products = await readAll('product');
    const jobs = await readAll('service_job');
    const pos = await readAll('purchase_order');
    const returns = await run(table('return_request').select('*').eq('status', 'Pending'));
    const unpaid = await readAll('invoice', { status: 'Unpaid' });
    const customers = await readAll('customer');
    const month = t.slice(0, 7);
    const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().slice(0, 10); })
      .map(day => ({ day: day.slice(5), sales: orders.filter(o => o.order_date === day).reduce((s, o) => s + Number(o.total_amount), 0) }));
    return {
      salesToday: todays.reduce((s, o) => s + Number(o.total_amount), 0), ordersToday: todays.length,
      lowStock: products.filter(p => p.is_active && p.stock_qty <= p.reorder_level),
      pendingJobs: jobs.filter(j => j.status !== 'Completed').length, pendingPOs: pos.filter(p => p.status === 'Pending').length,
      pendingReturns: returns.length, last7,
      salesMonth: orders.filter(o => o.order_date.startsWith(month)).reduce((s, o) => s + Number(o.total_amount), 0),
      unpaidTotal: unpaid.reduce((s, i) => s + Number(i.amount) - Number(i.paid_amount), 0), overdue: unpaid.filter(i => i.due_date < t).length,
      latest: [...orders].sort((a, b) => b.order_id - a.order_id).slice(0, 6).map(o => ({ ...o, customer_name: customers.find(c => c.customer_id === o.customer_id)?.name || '—' })),
    };
  }
  // saved reports (report history), newest first, with the name of the user who made each one
  static async getAll() {
    const users = await readAll('user');
    return (await readAll('report', {}, 'report_id')).reverse().map(r => ({ ...r, user_name: users.find(u => u.user_id === r.user_id)?.name || '—', def: reportOfType(r.report_type) }));
  }
}
