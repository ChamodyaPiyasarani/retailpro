// Class: Quotation  (table: quotation)
import { insertRow, updateRow, readAll, today } from './db';

export default class Quotation {
  // + request()  – SD "Request supplier quotation"
  static request({ supplier_id, product_id, quantity }) {
    if (!supplier_id || !product_id || !(Number(quantity) > 0)) throw new Error('Please choose the supplier, product and quantity.');
    return insertRow('quotation', { request_date: today(), quantity: Number(quantity), status: 'Requested', supplier_id: Number(supplier_id), product_id: Number(product_id) });
  }
  // + enterPrice()  – the price the supplier sent
  static enterPrice(id, quoted_price, valid_until) {
    if (!(Number(quoted_price) > 0)) throw new Error('Please enter the quoted price.');
    return updateRow('quotation', 'quotation_id', id, { quoted_price: Number(quoted_price), valid_until: valid_until || null });
  }
  // + accept()
  static async accept(id, quoted_price, valid_until) {
    if (quoted_price !== undefined) await Quotation.enterPrice(id, quoted_price, valid_until);
    return updateRow('quotation', 'quotation_id', id, { status: 'Accepted' });
  }
  // + reject()
  static async reject(id, quoted_price, valid_until) {
    if (quoted_price) await Quotation.enterPrice(id, quoted_price, valid_until);
    return updateRow('quotation', 'quotation_id', id, { status: 'Rejected' });
  }
  static getAll() { return readAll('quotation', {}, 'quotation_id'); }
}
