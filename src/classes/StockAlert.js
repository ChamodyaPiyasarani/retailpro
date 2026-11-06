// Class: StockAlert  (table: stock_alert)
import { readAll, insertRow, run, table, today } from './db';

export default class StockAlert {
  // + create()  – only one open alert per product
  static async create(productId) {
    const open = await run(table('stock_alert').select('*').eq('product_id', productId).eq('status', 'Open'));
    if (open.length) return open[0];
    return insertRow('stock_alert', { alert_date: today(), status: 'Open', product_id: productId });
  }
  // + resolve()  – close the open alerts of these products
  static async resolve(productIds) {
    const ids = [].concat(productIds);
    if (!ids.length) return [];
    return run(table('stock_alert').update({ status: 'Resolved', resolved_date: today() }).in('product_id', ids).eq('status', 'Open').select());
  }
  // + getOpen()
  static getOpen() { return readAll('stock_alert', { status: 'Open' }, 'alert_date'); }
}
