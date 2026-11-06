// Class: SalesOrderItem  (table: sales_order_item)   part of SalesOrder (composition)
export default class SalesOrderItem {
  // + calculateSubtotal()
  static calculateSubtotal(item) { return Number(item.quantity) * Number(item.unit_price); }
}
