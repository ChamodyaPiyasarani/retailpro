// Class: SupplierPayment  (is a Payment)  – cheque payment to a supplier for a received purchase order
import Payment from './Payment';
import PurchaseOrder from './PurchaseOrder';
import { readAll } from './db';

export default class SupplierPayment extends Payment {
  // + recordCheque()  – SD "Record supplier payment"
  static async recordCheque({ po_id, amount, cheque_no, user_id }) {
    const po = (await readAll('purchase_order', { po_id: Number(po_id) }))[0];
    if (!po || po.status !== 'Received') throw new Error('Only received purchase orders can be paid.');
    if (!String(cheque_no || '').trim()) throw new Error('Please enter the cheque number.');
    if (Math.abs(Number(amount) - Number(po.total_amount)) > 0.001) throw new Error('Amount is not correct');
    const p = await SupplierPayment.record({ amount, method: 'Cheque', payment_type: 'Supplier', cheque_no: cheque_no.trim(), user_id, po_id: po.po_id });
    await PurchaseOrder.updateStatus(po.po_id, 'Paid', 'Received');
    return p;
  }
}
