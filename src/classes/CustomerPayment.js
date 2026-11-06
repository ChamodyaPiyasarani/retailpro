// Class: CustomerPayment  (is a Payment)  – payment from a customer for an invoice
import Payment from './Payment';
import Invoice from './Invoice';
import { run, table } from './db';

export default class CustomerPayment extends Payment {
  // SD "Process customer payment": check amount -> save payment -> mark invoice paid -> print receipt
  static async pay({ invoice_id, amount, method, user_id }) {
    const inv = await Invoice.find(Number(invoice_id));
    if (!inv) throw new Error('No invoice with this number.');
    if (inv.status === 'Paid') throw new Error('This invoice is already paid.');
    const due = Number(inv.amount) - Number(inv.paid_amount);
    if (!method) throw new Error('Please choose the payment method.');
    if (!CustomerPayment.checkAmount(amount, due)) throw new Error('Amount is not correct');
    const count = (await run(table('payment').select('payment_id').eq('payment_type', 'Customer'))).length;
    const p = await CustomerPayment.record({ amount, method, payment_type: 'Customer', receipt_no: `RCP-${String(count + 1).padStart(4, '0')}`, user_id, invoice_id: inv.invoice_id });
    const invoice = await Invoice.markPaid(inv.invoice_id, amount);
    return { payment: p, invoice, receipt: CustomerPayment.printReceipt(p, invoice) };
  }
  // + printReceipt()
  static printReceipt(p, inv) {
    return { receipt_no: p.receipt_no, date: p.payment_date, invoice: `INV-${inv.invoice_id}`, amount: Number(p.amount), method: p.method,
      balance: Number(inv.amount) - Number(inv.paid_amount) };
  }
}
