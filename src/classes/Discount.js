// Class: Discount  (table: discount)
import { readAll, insertRow, updateRow, deleteRow, run, table, today } from './db';

const clean = (d) => {
  const x = { discount_code: String(d.discount_code || '').trim().toUpperCase(), rate: Number(d.rate), description: d.description || null,
    start_date: d.start_date, end_date: d.end_date, is_active: d.is_active ?? true };
  if (!x.discount_code || !x.start_date || !x.end_date) throw new Error('Please enter the code, start date and end date.');
  if (!(x.rate > 0 && x.rate <= 100)) throw new Error('The rate must be between 1 and 100 (%).');
  if (x.end_date < x.start_date) throw new Error('The end date cannot be before the start date.');
  return x;
};

export default class Discount {
  // + create()
  static async create(data) {
    const x = clean(data);
    if ((await run(table('discount').select('discount_id').eq('discount_code', x.discount_code))).length) throw new Error('This discount code already exists.');
    return insertRow('discount', x);
  }
  // + update()
  static update(id, data) { return updateRow('discount', 'discount_id', id, clean(data)); }
  // + delete()  – a code already used on a sales order is kept but made inactive
  static async delete(id) {
    if ((await readAll('sales_order', { discount_id: id })).length) { await updateRow('discount', 'discount_id', id, { is_active: false }); return 'inactive'; }
    await deleteRow('discount', 'discount_id', id); return 'deleted';
  }
  // + validate()  – SD "Create sales order" (extend "Apply discount"): code exists, active and today is inside its dates
  static async validate(code) {
    const c = String(code || '').trim().toUpperCase();
    const d = (await run(table('discount').select('*').eq('discount_code', c)))[0];
    const t = today();
    if (!d || !d.is_active || d.start_date > t || d.end_date < t) return null;
    return d;
  }
  // + getRate()
  static getRate(discount) { return discount ? Number(discount.rate) : 0; }

  static getAll() { return readAll('discount', {}, 'discount_id'); }
}
