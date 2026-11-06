// Class: PurchaseOrder  (tables: purchase_order, purchase_order_item)
// status: Pending -> Approved / Rejected -> Received -> Paid
import { readAll, insertRow, updateRow, run, table, today } from './db';
import PurchaseOrderItem from './PurchaseOrderItem';

export default class PurchaseOrder {
  // + create()  – SD "Create purchase order" (include "Select supplier") and SD "Reorder low-stock items"
  static async create({ supplier_id, quotation_id = null, expected_date = null, items }, userId) {
    if (!supplier_id) throw new Error('Please select the supplier.');
    if (!items?.length) throw new Error('Add at least one product');
    const po = await insertRow('purchase_order', { order_date: today(), expected_date, total_amount: PurchaseOrder.calculateTotal(items),
      status: 'Pending', supplier_id: Number(supplier_id), user_id: userId, quotation_id: quotation_id ? Number(quotation_id) : null });
    for (const i of items) await insertRow('purchase_order_item', { quantity: Number(i.quantity), received_qty: 0, unit_cost: Number(i.unit_cost), po_id: po.po_id, product_id: Number(i.product_id) });
    return po;
  }
  // + addItem()  – adds a line to the order being made on the screen
  static addItem(items, { product_id, quantity, unit_cost }) {
    if (!product_id || !(Number(quantity) > 0) || !(Number(unit_cost) > 0)) throw new Error('Please choose the product, quantity and unit cost.');
    if (items.some(i => Number(i.product_id) === Number(product_id))) throw new Error('This product is already on the order.');
    return [...items, { product_id: Number(product_id), quantity: Number(quantity), unit_cost: Number(unit_cost) }];
  }
  // + calculateTotal()
  static calculateTotal(items) { return items.reduce((s, i) => s + PurchaseOrderItem.calculateSubtotal(i), 0); }
  // + approve()  – SD "Approve purchase orders"
  static approve(id) { return PurchaseOrder.updateStatus(id, 'Approved', 'Pending'); }
  // + reject()
  static reject(id) { return PurchaseOrder.updateStatus(id, 'Rejected', 'Pending'); }
  // + updateStatus()  – only allowed from the expected status
  static async updateStatus(id, status, mustBe = null) {
    if (mustBe) {
      const po = (await readAll('purchase_order', { po_id: id }))[0];
      if (po.status !== mustBe) throw new Error(`Only ${mustBe} orders can be changed to ${status}.`);
    }
    return updateRow('purchase_order', 'po_id', id, { status });
  }
  // + track()  – SD "Track purchase order status": orders with their items
  static async track() {
    const pos = await run(table('purchase_order').select('*').order('po_id', { ascending: false }));
    const items = await readAll('purchase_order_item');
    return pos.map(p => ({ ...p, items: items.filter(i => i.po_id === p.po_id) }));
  }
}
