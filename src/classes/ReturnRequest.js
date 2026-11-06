// Class: ReturnRequest  (table: return_request)
import { readAll, insertRow, updateRow, run, table, today } from './db';
import Warranty from './Warranty';

export default class ReturnRequest {
  // + create()  – SD "Create return request" (include "Check warranty status")
  static async create({ invoice_id, product_id, reason }) {
    if (!invoice_id || !product_id || !String(reason || '').trim()) throw new Error('Please enter the invoice number, product and reason.');
    const w = await Warranty.checkStatus(invoice_id, product_id);
    if (!w.found) throw new Error(w.message);
    if (!w.valid) throw new Error('Warranty expired, return not allowed');
    const open = await run(table('return_request').select('*').eq('order_id', w.invoice.order_id).eq('product_id', Number(product_id)).in('status', ['Pending', 'Approved']));
    if (open.length) throw new Error('There is already an open return request for this product on this invoice.');
    return insertRow('return_request', { request_date: today(), reason: reason.trim(), status: 'Pending', order_id: w.invoice.order_id, product_id: Number(product_id) });
  }
  // + approve()  – SD "Approve refund requests"
  static approve(id) { return updateRow('return_request', 'request_id', id, { status: 'Approved', approved_date: today() }); }
  // + reject()
  static reject(id) { return updateRow('return_request', 'request_id', id, { status: 'Rejected', approved_date: today() }); }
  // + getPending()
  static getPending() { return readAll('return_request', { status: 'Pending' }, 'request_date'); }
  // + markRefunded()  – SD "Process approved refund"
  static markRefunded(id) { return updateRow('return_request', 'request_id', id, { status: 'Refunded' }); }

  static getAll() { return readAll('return_request', {}, 'request_id'); }
}
