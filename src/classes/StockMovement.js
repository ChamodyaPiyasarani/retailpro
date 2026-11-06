// Class: StockMovement  (table: stock_movement)
import { insertRow, readAll, today } from './db';

const save = (type, { product_id, quantity, reason, user_id, po_id = null, job_id = null }) =>
  insertRow('stock_movement', { movement_type: type, quantity: Number(quantity), reason, movement_date: today(), product_id, user_id, po_id, job_id });

export default class StockMovement {
  // + recordIn()  – goods received for a purchase order
  static recordIn(d) { return save('In', { reason: 'Goods received from supplier', ...d }); }
  // + recordOut()  – spare part issued for a service job
  static recordOut(d) { return save('Out', { reason: 'Spare part issued for repair', ...d }); }
  // + recordAdjustment()  – damaged / returned goods (quantity can be + or −)
  static recordAdjustment(d) { return save('Adjustment', d); }

  static getAll() { return readAll('stock_movement', {}, 'movement_id'); }
}
