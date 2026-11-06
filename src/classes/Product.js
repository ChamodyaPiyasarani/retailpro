// Class: Product  (table: product)
import { readAll, readOne, insertRow, updateRow, deleteRow, run, table } from './db';
import StockAlert from './StockAlert';

const clean = (d) => {
  const p = {
    product_name: String(d.product_name || '').trim(), brand: String(d.brand || '').trim() || null, model: String(d.model || '').trim() || null,
    unit_price: Number(d.unit_price), cost_price: Number(d.cost_price), stock_qty: Number(d.stock_qty ?? 0),
    reorder_level: Number(d.reorder_level ?? 0), warranty_months: Number(d.warranty_months ?? 0),
    is_active: d.is_active ?? true, category_id: d.category_id ? Number(d.category_id) : null,
  };
  if (!p.product_name || !p.category_id) throw new Error('Please enter the product name and choose a category.');
  if (!(p.unit_price > 0) || !(p.cost_price >= 0)) throw new Error('Please enter a valid selling price and cost price.');
  if (p.cost_price > p.unit_price) throw new Error('The cost price cannot be more than the selling price.');
  if ([p.stock_qty, p.reorder_level, p.warranty_months].some(n => !Number.isInteger(n) || n < 0)) throw new Error('Stock, reorder level and warranty must be whole numbers (0 or more).');
  return p;
};

export default class Product {
  // + create()  – SD "Manage products" (includes "Choose category")
  static create(data) { return insertRow('product', clean(data)); }
  // + update()
  static update(id, data) { return updateRow('product', 'product_id', id, clean(data)); }
  // + delete()  – a product that has been sold or ordered is kept, so it is only made inactive
  static async delete(id) {
    const used = (await readAll('sales_order_item', { product_id: id })).length + (await readAll('purchase_order_item', { product_id: id })).length
      + (await readAll('service_job', { product_id: id })).length;
    if (used) { await updateRow('product', 'product_id', id, { is_active: false }); return 'inactive'; }
    await run(table('product_supplier').delete().eq('product_id', id));
    await run(table('stock_alert').delete().eq('product_id', id));
    await deleteRow('product', 'product_id', id);
    return 'deleted';
  }
  // + search()
  static async search(text = '') {
    const all = await readAll('product', {}, 'product_name');
    const t = text.trim().toLowerCase();
    return t ? all.filter(p => [p.product_name, p.brand, p.model].some(v => String(v || '').toLowerCase().includes(t))) : all;
  }
  // + checkStock()  – SD "Create sales order" (include "Check stock"): enough stock for this quantity?
  static async checkStock(id, quantity = 1) {
    const p = await readOne('product', 'product_id', id);
    return { product: p, enough: !!p && p.stock_qty >= quantity, stock: p ? p.stock_qty : 0 };
  }
  // + increaseStock()  – SD "Receive stock" (include "Update stock quantity")
  static async increaseStock(id, quantity) {
    const p = await readOne('product', 'product_id', id);
    return updateRow('product', 'product_id', id, { stock_qty: p.stock_qty + Number(quantity) });
  }
  // + reduceStock()  – used by sales, adjustments and spare parts.
  // When the stock is now at or below the reorder level a low-stock alert is saved.
  static async reduceStock(id, quantity) {
    const p = await readOne('product', 'product_id', id);
    if (p.stock_qty < quantity) throw new Error(`Not enough stock of ${p.product_name} (only ${p.stock_qty}).`);
    const after = await updateRow('product', 'product_id', id, { stock_qty: p.stock_qty - Number(quantity) });
    if (Product.isLowStock(after)) await StockAlert.create(id);
    return after;
  }
  // + isLowStock()
  static isLowStock(p) { return !!p && p.stock_qty <= p.reorder_level; }

  static getAll() { return readAll('product', {}, 'product_name'); }
  static find(id) { return readOne('product', 'product_id', id); }
}
