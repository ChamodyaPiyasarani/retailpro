// Class: Customer  (table: customer)
import { readAll, insertRow, updateRow, run, table, today } from './db';

const clean = (d) => {
  const c = { name: String(d.name || '').trim(), phone: String(d.phone || '').trim(), email: String(d.email || '').trim() || null, address: String(d.address || '').trim() || null };
  if (!c.name || !c.phone) throw new Error('Please enter the customer name and phone.');
  if (!/^(?:\+94|0)\d{9}$/.test(c.phone.replace(/[\s-]/g, ''))) throw new Error('Please enter a valid phone number (e.g. 0771234567).');
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email)) throw new Error('Please enter a valid e-mail.');
  return c;
};

export default class Customer {
  // + create()
  static async create(data) {
    const c = clean(data);
    if ((await readAll('customer', { phone: c.phone })).length) throw new Error('A customer with this phone number already exists.');
    return insertRow('customer', { ...c, registered_date: today() });
  }
  // + update()
  static update(id, data) { return updateRow('customer', 'customer_id', id, clean(data)); }
  // + search()  – by name or phone
  static async search(text = '') {
    const all = await readAll('customer', {}, 'name');
    const t = text.trim().toLowerCase();
    return t ? all.filter(c => c.name.toLowerCase().includes(t) || String(c.phone).includes(t)) : all;
  }
  // + viewPurchaseHistory()  – SD "View customer purchase history": orders of the customer with their items
  static async viewPurchaseHistory(customerId) {
    const orders = await run(table('sales_order').select('*').eq('customer_id', customerId).order('order_date', { ascending: false }));
    if (!orders.length) return [];
    const ids = orders.map(o => o.order_id);
    const items = await run(table('sales_order_item').select('*').in('order_id', ids));
    const invoices = await run(table('invoice').select('*').in('order_id', ids));
    return orders.map(o => ({ ...o, items: items.filter(i => i.order_id === o.order_id), invoice: invoices.find(i => i.order_id === o.order_id) }));
  }
  static getAll() { return readAll('customer', {}, 'name'); }
}
