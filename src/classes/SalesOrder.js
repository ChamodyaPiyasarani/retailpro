// Class: SalesOrder  (tables: sales_order, sales_order_item)
// SD "Create sales order": add items (check stock) -> apply discount -> save order and items
// -> reduce stock -> create warranties -> generate invoice
import { insertRow, readAll, run, table, today } from './db';
import Product from './Product';
import Discount from './Discount';
import Warranty from './Warranty';
import Invoice from './Invoice';
import SalesOrderItem from './SalesOrderItem';

export default class SalesOrder {
  // + create()  – a new order for a customer (kept on the screen until it is saved)
  static create(customerId) {
    return { customer_id: customerId ? Number(customerId) : null, items: [], discount: null, subtotal: 0, discount_amount: 0, total_amount: 0 };
  }
  // + addItem()  – checks the stock first
  static async addItem(order, productId, quantity) {
    quantity = Number(quantity);
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Please enter a quantity of 1 or more.');
    const inCart = order.items.find(i => i.product_id === Number(productId));
    const { product, enough } = await Product.checkStock(Number(productId), quantity + (inCart?.quantity || 0));
    if (!product || !product.is_active) throw new Error('This product cannot be sold.');
    if (!enough) throw new Error('Not enough stock');
    const items = inCart
      ? order.items.map(i => i === inCart ? { ...i, quantity: i.quantity + quantity } : i)
      : [...order.items, { product_id: product.product_id, product_name: product.product_name, unit_price: Number(product.unit_price), quantity, warranty_months: product.warranty_months }];
    return SalesOrder.calculateTotal({ ...order, items });
  }
  // + removeItem()
  static removeItem(order, productId) { return SalesOrder.calculateTotal({ ...order, items: order.items.filter(i => i.product_id !== productId) }); }
  // + calculateTotal()
  static calculateTotal(order) {
    const items = order.items.map(i => ({ ...i, subtotal: SalesOrderItem.calculateSubtotal(i) }));
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const discount_amount = Math.round(subtotal * Discount.getRate(order.discount)) / 100;
    return { ...order, items, subtotal, discount_amount, total_amount: subtotal - discount_amount };
  }
  // + applyDiscount()  – extend "Apply discount"
  static async applyDiscount(order, code) {
    const d = await Discount.validate(code);
    if (!d) throw new Error('This discount code is not valid today.');
    return SalesOrder.calculateTotal({ ...order, discount: d });
  }
  // + save()
  static async save(order, userId) {
    if (!order.customer_id) throw new Error('Please select the customer.');
    if (!order.items.length) throw new Error('Please add at least one product.');
    for (const i of order.items) {           // check again: another cashier may have sold the last one
      const { enough } = await Product.checkStock(i.product_id, i.quantity);
      if (!enough) throw new Error(`Not enough stock of ${i.product_name}.`);
    }
    const o = await insertRow('sales_order', { order_date: today(), subtotal: order.subtotal, discount_amount: order.discount_amount,
      total_amount: order.total_amount, status: 'Completed', customer_id: order.customer_id, user_id: userId, discount_id: order.discount?.discount_id || null });
    const saved = [];
    for (const i of order.items) {
      const row = await insertRow('sales_order_item', { quantity: i.quantity, unit_price: i.unit_price, subtotal: i.subtotal, order_id: o.order_id, product_id: i.product_id });
      saved.push(row);
      await Product.reduceStock(i.product_id, i.quantity);                  // saves a low-stock alert when needed
      if (i.warranty_months > 0) await Warranty.create(row.item_id, o.order_date, i.warranty_months);
    }
    const invoice = await Invoice.generate({ order_id: o.order_id, amount: o.total_amount });
    return { order: o, items: saved, invoice };
  }
  // sales history: orders with customer, cashier, number of items and the invoice status, newest first
  static async getHistory({ text = '', status = '', from = '', to = '' } = {}) {
    const [orders, items, invs, customers, users] = await Promise.all([readAll('sales_order', {}, 'order_id'), readAll('sales_order_item'), readAll('invoice'), readAll('customer'), readAll('user')]);
    const t = text.trim().toLowerCase().replace(/^so-?/, '');
    return orders.reverse().map(o => {
      const c = customers.find(x => x.customer_id === o.customer_id);
      const inv = invs.find(i => i.order_id === o.order_id);
      return { ...o, customer_name: c?.name || '—', phone: c?.phone, cashier: users.find(u => u.user_id === o.user_id)?.name || '—',
        item_count: items.filter(i => i.order_id === o.order_id).reduce((s, i) => s + i.quantity, 0), invoice: inv };
    }).filter(o => (!status || o.status === status || o.invoice?.status === status) && (!from || o.order_date >= from) && (!to || o.order_date <= to)
      && (!t || String(o.order_id) === t || (!/^\d+$/.test(t) && o.customer_name.toLowerCase().includes(t)) || (t.length >= 5 && String(o.phone || '').includes(t))));
  }
  // + cancel()
  static cancel(orderId) { return run(table('sales_order').update({ status: 'Cancelled' }).eq('order_id', orderId).select()); }
}
