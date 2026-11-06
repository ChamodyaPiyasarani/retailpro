// Class: Invoice  (table: invoice)   a sales invoice (order_id) or a service invoice (job_id)
import { insertRow, readOne, readAll, updateRow, run, table, today, addDays } from './db';

export default class Invoice {
  // + generate()  – SD "Create sales order" (include "Generate invoice") and SD "Update job status"
  static generate({ order_id = null, job_id = null, amount }) {
    return insertRow('invoice', { invoice_date: today(), amount, paid_amount: 0, due_date: addDays(today(), 14), status: 'Unpaid', order_id, job_id });
  }
  // + markPaid()  – SD "Process customer payment"
  static async markPaid(invoiceId, amountPaid) {
    const inv = await readOne('invoice', 'invoice_id', invoiceId);
    const paid = Number(inv.paid_amount) + Number(amountPaid);
    return updateRow('invoice', 'invoice_id', invoiceId, { paid_amount: paid, status: paid >= Number(inv.amount) ? 'Paid' : 'Unpaid' });
  }
  // + getOutstanding()  – SD "View outstanding invoices"
  static async getOutstanding() {
    const rows = await run(table('invoice').select('*').eq('status', 'Unpaid').order('due_date'));
    return rows.map(i => ({ ...i, balance: Number(i.amount) - Number(i.paid_amount), overdue: Invoice.isOverdue(i) }));
  }
  // + isOverdue()
  static isOverdue(inv) { return inv.status === 'Unpaid' && inv.due_date < today(); }
  // + sendReminder()  – extend "Send payment reminder": opens an e-mail to the customer
  static sendReminder(inv, customer) {
    if (!customer?.email) throw new Error('This customer has no e-mail address.');
    const balance = Number(inv.amount) - Number(inv.paid_amount);
    const body = `Dear ${customer.name},%0D%0A%0D%0AThis is a reminder that invoice INV-${inv.invoice_id} (due ${inv.due_date}) has Rs. ${balance.toFixed(2)} still to pay.%0D%0A%0D%0AThank you,%0D%0ARajida Holdings`;
    window.location.href = `mailto:${customer.email}?subject=Payment reminder – INV-${inv.invoice_id}&body=${body}`;
    return true;
  }
  static find(id) { return readOne('invoice', 'invoice_id', id); }

  // invoice history: every invoice (sales and service) with its customer and balance, newest first
  static async getAll({ text = '', status = '', from = '', to = '' } = {}) {
    const [invs, orders, jobs, customers] = await Promise.all([readAll('invoice', {}, 'invoice_id'), readAll('sales_order'), readAll('service_job'), readAll('customer')]);
    const t = text.trim().toLowerCase().replace(/^inv-?/, '');
    return invs.reverse().map(i => {
      const cid = i.order_id ? orders.find(o => o.order_id === i.order_id)?.customer_id : jobs.find(j => j.job_id === i.job_id)?.customer_id;
      const c = customers.find(x => x.customer_id === cid);
      return { ...i, customer: c, customer_name: c?.name || '—', balance: Number(i.amount) - Number(i.paid_amount), overdue: Invoice.isOverdue(i), order_status: orders.find(o => o.order_id === i.order_id)?.status };
    }).filter(i => (!status || (status === 'Overdue' ? i.overdue : i.status === status))
      && (!from || i.invoice_date >= from) && (!to || i.invoice_date <= to)
      && (!t || String(i.invoice_id) === t || (!/^\d+$/.test(t) && i.customer_name.toLowerCase().includes(t)) || (t.length >= 5 && String(i.customer?.phone || '').includes(t))));
  }

  // one invoice with everything about it: customer, items or job, payments, returns, refunds, warranties
  static async getDetails(invoiceId) {
    const inv = await readOne('invoice', 'invoice_id', invoiceId);
    if (!inv) throw new Error('No invoice with this number.');
    const products = await readAll('product');
    const pname = (id) => products.find(p => p.product_id === id)?.product_name || `#${id}`;
    const order = inv.order_id ? await readOne('sales_order', 'order_id', inv.order_id) : null;
    const job = inv.job_id ? await readOne('service_job', 'job_id', inv.job_id) : null;
    const cid = (order || job)?.customer_id;
    const customer = cid ? await readOne('customer', 'customer_id', cid) : null;
    const items = order ? (await readAll('sales_order_item', { order_id: order.order_id }, 'item_id')).map(i => ({ ...i, product_name: pname(i.product_id) })) : [];
    const warranties = items.length ? await run(table('warranty').select('*').in('item_id', items.map(i => i.item_id))) : [];
    const discount = order?.discount_id ? await readOne('discount', 'discount_id', order.discount_id) : null;
    const payments = await readAll('payment', { invoice_id: inv.invoice_id }, 'payment_id');
    const users = await readAll('user');
    const returns = order ? (await readAll('return_request', { order_id: order.order_id }, 'request_id')).map(r => ({ ...r, product_name: pname(r.product_id) })) : [];
    const refunds = returns.length ? await run(table('refund').select('*').in('request_id', returns.map(r => r.request_id))) : [];
    return {
      invoice: { ...inv, balance: Number(inv.amount) - Number(inv.paid_amount), overdue: Invoice.isOverdue(inv) }, order, job: job && { ...job, product_name: pname(job.product_id) }, customer, discount,
      items: items.map(i => ({ ...i, warranty: warranties.find(w => w.item_id === i.item_id) })),
      payments: payments.map(p => ({ ...p, user_name: users.find(u => u.user_id === p.user_id)?.name || '' })),
      returns: returns.map(r => ({ ...r, refund: refunds.find(f => f.request_id === r.request_id) })),
    };
  }
}
