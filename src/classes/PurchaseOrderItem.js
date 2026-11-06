// Class: PurchaseOrderItem  (table: purchase_order_item)   part of PurchaseOrder (composition)
import { readOne, updateRow } from './db';

export default class PurchaseOrderItem {
  // + calculateSubtotal()
  static calculateSubtotal(item) { return Number(item.quantity) * Number(item.unit_cost); }
  // + receive()  – SD "Receive stock": save the received quantity of the item
  static async receive(itemId, quantity) {
    const it = await readOne('purchase_order_item', 'item_id', itemId);
    return updateRow('purchase_order_item', 'item_id', itemId, { received_qty: Number(it.received_qty) + Number(quantity) });
  }
}
