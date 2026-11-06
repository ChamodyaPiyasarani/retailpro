// Class: Refund  (table: refund)
import { insertRow, readOne, run, table, today } from './db';
import ReturnRequest from './ReturnRequest';

export default class Refund {
  // + checkAmount()  – the refund cannot be more than the price paid for the item
  static async checkAmount(requestId, amount) {
    const r = await readOne('return_request', 'request_id', requestId);
    const items = await run(table('sales_order_item').select('*').eq('order_id', r.order_id).eq('product_id', r.product_id));
    const paid = items[0] ? Number(items[0].unit_price) : 0;
    return { ok: Number(amount) > 0 && Number(amount) <= paid, paid };
  }
  // + process()  – SD "Process approved refund": save refund, mark the request refunded
  static async process({ request_id, amount, method }) {
    const r = await readOne('return_request', 'request_id', request_id);
    if (!r || r.status !== 'Approved') throw new Error('Only approved requests can be refunded.');
    if (!method) throw new Error('Please choose the refund method.');
    const { ok, paid } = await Refund.checkAmount(request_id, amount);
    if (!ok) throw new Error(`Refund amount is too high (the item was sold for Rs. ${paid.toFixed(2)}).`);
    const refund = await insertRow('refund', { refund_date: today(), amount: Number(amount), method, request_id });
    await ReturnRequest.markRefunded(request_id);
    return refund;
  }
}
