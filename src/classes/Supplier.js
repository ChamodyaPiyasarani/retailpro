// Class: Supplier  (tables: supplier, product_supplier)   Supplier 1..* —— 0..* Product "supplies" (M:N)
import { readAll, insertRow, updateRow, deleteRow, run, table } from './db';

const clean = (d) => {
  const s = { supplier_name: String(d.supplier_name || '').trim(), contact_person: String(d.contact_person || '').trim() || null,
    phone: String(d.phone || '').trim() || null, email: String(d.email || '').trim() || null, address: String(d.address || '').trim() || null, is_active: d.is_active ?? true };
  if (!s.supplier_name || !s.phone) throw new Error('Please enter the supplier name and phone.');
  if (!/^(?:\+94|0)\d{9}$/.test(s.phone.replace(/[\s-]/g, ''))) throw new Error('Please enter a valid phone number (e.g. 0112345678).');
  if (s.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.email)) throw new Error('Please enter a valid e-mail.');
  return s;
};

export default class Supplier {
  // + create()  – SD "Manage suppliers": save supplier, then one product_supplier row for each ticked product
  static async create(data, productIds = []) {
    const s = await insertRow('supplier', clean(data));
    await Supplier.assignProducts(s.supplier_id, productIds);
    return s;
  }
  // + update()
  static async update(id, data, productIds = null) {
    const s = await updateRow('supplier', 'supplier_id', id, clean(data));
    if (productIds) await Supplier.assignProducts(id, productIds);
    return s;
  }
  // + delete()  – a supplier with purchase orders or quotations is kept but made inactive
  static async delete(id) {
    const used = (await readAll('purchase_order', { supplier_id: id })).length + (await readAll('quotation', { supplier_id: id })).length;
    if (used) { await updateRow('supplier', 'supplier_id', id, { is_active: false }); return 'inactive'; }
    await deleteRow('supplier', 'supplier_id', id);   // product_supplier rows are removed too (cascade)
    return 'deleted';
  }
  // + search()
  static async search(text = '') {
    const all = await readAll('supplier', {}, 'supplier_name');
    const t = text.trim().toLowerCase();
    return t ? all.filter(s => [s.supplier_name, s.contact_person, s.phone].some(v => String(v || '').toLowerCase().includes(t))) : all;
  }
  // + getProducts()  – ids of the products this supplier supplies
  static async getProducts(id) { return (await readAll('product_supplier', { supplier_id: id })).map(r => r.product_id); }
  // + assignProducts()  – make the product_supplier rows match the ticked products
  static async assignProducts(id, productIds) {
    const now = await Supplier.getProducts(id);
    for (const pid of productIds) if (!now.includes(pid)) await insertRow('product_supplier', { product_id: pid, supplier_id: id });
    for (const pid of now) if (!productIds.includes(pid)) await run(table('product_supplier').delete().eq('supplier_id', id).eq('product_id', pid));
  }
  static getAll() { return readAll('supplier', {}, 'supplier_name'); }
}
