// Class: Payment  (table: payment)
// CustomerPayment and SupplierPayment are kinds of Payment (generalization),
// so they "extend" this class and use its record() and checkAmount().
import { insertRow, run, table, today } from './db';

export default class Payment {
  // + record()
  static record({ amount, method, payment_type, receipt_no = null, cheque_no = null, user_id, invoice_id = null, po_id = null }) {
    return insertRow('payment', { payment_date: today(), amount: Number(amount), method, payment_type, receipt_no, cheque_no, user_id, invoice_id, po_id });
  }
  // + checkAmount()  – more than 0 and not more than the amount to pay
  static checkAmount(amount, due) { const a = Number(amount); return a > 0 && a <= Number(due) + 0.001; }
  // + viewAll()  – SD "View all payments": by type and dates
  static async viewAll({ type = '', from, to }) {
    let q = table('payment').select('*').gte('payment_date', from).lte('payment_date', to).order('payment_date', { ascending: false });
    if (type) q = q.eq('payment_type', type);
    const rows = await run(q);
    return { rows, total: rows.reduce((s, p) => s + Number(p.amount), 0) };
  }
}
