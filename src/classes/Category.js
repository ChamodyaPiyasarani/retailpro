// Class: Category  (table: category)   Category ◇—— Product (aggregation)
import { readAll, insertRow, updateRow, deleteRow, run, table } from './db';

const check = async ({ category_name }, exceptId = null) => {
  const name = String(category_name || '').trim();
  if (!name) throw new Error('Please enter the category name.');
  let q = table('category').select('category_id').ilike('category_name', name);
  if (exceptId) q = q.neq('category_id', exceptId);
  if ((await run(q)).length) throw new Error('A category with this name already exists.');
  return name;
};

export default class Category {
  // + create()
  static async create(data) {
    const name = await check(data);
    return insertRow('category', { category_name: name, description: data.description || null, is_active: data.is_active ?? true });
  }
  // + update()
  static async update(id, data) {
    const name = await check(data, id);
    return updateRow('category', 'category_id', id, { category_name: name, description: data.description || null, is_active: data.is_active ?? true });
  }
  // + delete()  – a category that still has products cannot be deleted
  static async delete(id) {
    const products = await readAll('product', { category_id: id });
    if (products.length) throw new Error(`This category still has ${products.length} product(s). Move or delete them first.`);
    return deleteRow('category', 'category_id', id);
  }
  // + getAll()
  static getAll() { return readAll('category', {}, 'category_name'); }
}
