// Class: SparePartRequest  (table: spare_part_request)   ServiceJob ◇—— SparePartRequest (aggregation)
import { insertRow, readOne, updateRow, readAll, today } from './db';
import Product from './Product';
import StockMovement from './StockMovement';

export default class SparePartRequest {
  // + request()  – extend "Request spare parts" (from "Update job status")
  static request(jobId, productId, quantity) {
    if (!productId || !(Number(quantity) > 0)) throw new Error('Please choose the spare part and quantity.');
    return insertRow('spare_part_request', { quantity: Number(quantity), status: 'Requested', request_date: today(), job_id: jobId, product_id: Number(productId) });
  }
  // + issue()  – SD "Issue spare parts": check stock -> stock movement (Out) -> reduce stock (include "Update stock quantity")
  static async issue(requestId, userId) {
    const r = await readOne('spare_part_request', 'request_id', requestId);
    if (r.status !== 'Requested') throw new Error('This request is already issued.');
    const { enough, stock } = await Product.checkStock(r.product_id, r.quantity);
    if (!enough) throw new Error(`Not enough stock (only ${stock}), reorder needed`);
    await StockMovement.recordOut({ product_id: r.product_id, quantity: r.quantity, user_id: userId, job_id: r.job_id });
    await updateRow('spare_part_request', 'request_id', requestId, { status: 'Issued' });
    await Product.reduceStock(r.product_id, r.quantity);   // saves a low-stock alert when needed
  }
  static getOpen() { return readAll('spare_part_request', { status: 'Requested' }, 'request_date'); }
}
