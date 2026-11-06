// Class: Warranty  (table: warranty)   one warranty for each sold item that has warranty months
import { insertRow, readAll, run, table, today, addMonths } from './db';

export default class Warranty {
  // + create()
  static create(itemId, startDate, months) {
    return insertRow('warranty', { start_date: startDate, end_date: addMonths(startDate, months), status: 'Active', item_id: itemId });
  }
  // + isValid()  – the end date has not passed
  static isValid(w) { return !!w && w.end_date >= today(); }
  // + checkStatus()  – SD "Check warranty status": find the warranty of a product on an invoice
  static async checkStatus(invoiceId, productId) {
    const inv = (await run(table('invoice').select('*').eq('invoice_id', Number(invoiceId))))[0];
    if (!inv || !inv.order_id) return { found: false, valid: false, message: 'No sales invoice with this number.' };
    const items = await run(table('sales_order_item').select('*').eq('order_id', inv.order_id).eq('product_id', Number(productId)));
    if (!items.length) return { found: false, valid: false, message: 'This product is not on this invoice.' };
    const w = (await readAll('warranty', { item_id: items[0].item_id }))[0];
    if (!w) return { found: false, valid: false, message: 'This product was sold without a warranty.' };
    const valid = Warranty.isValid(w);
    if (!valid && w.status !== 'Expired') await run(table('warranty').update({ status: 'Expired' }).eq('warranty_id', w.warranty_id));
    return { found: true, valid, warranty: w, item: items[0], invoice: inv,
      message: valid ? `Under warranty until ${w.end_date}` : `Warranty expired on ${w.end_date}` };
  }
}
