// Product Form – SD "Manage products" (include: Choose category)
import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import Product from '../classes/Product';
import Category from '../classes/Category';
import { money } from '../classes/db';
import { PageHeader, Modal, Field, Badge, useLoad, useAction, Loading, nameOf } from '../components/ui';

const blank = { product_name: '', brand: '', model: '', unit_price: '', cost_price: '', stock_qty: 0, reorder_level: 5, warranty_months: 12, is_active: true, category_id: '' };

export default function ProductsPage() {
  const [q, setQ] = useState('');
  const { data, error, reload } = useLoad(async () => ({ products: await Product.search(q), cats: await Category.getAll() }), [q]);
  const { act, busy } = useAction();
  const [form, setForm] = useState(null);
  if (!data) return <Loading error={error} />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const save = async () => { if (await act(() => form.product_id ? Product.update(form.product_id, form) : Product.create(form), 'Product saved')) { setForm(null); reload(); } };
  const remove = async (p) => {
    if (!window.confirm(`Delete ${p.product_name}?`)) return;
    if (await act(() => Product.delete(p.product_id), r => r === 'inactive' ? 'Product was sold before, so it is now inactive' : 'Product deleted')) reload();
  };
  return (
    <div>
      <PageHeader title="Products" subtitle="Computer hardware sold by Rajida Holdings">
        <button id="add-product" className="btn btn-primary" onClick={() => setForm({ ...blank, category_id: data.cats[0]?.category_id || '' })}><Plus size={15} /> New product</button>
      </PageHeader>
      <div className="search-bar" style={{ marginBottom: 14, maxWidth: 360 }}><Search size={15} /><input placeholder="Search name, brand or model" value={q} onChange={e => setQ(e.target.value)} /></div>
      <div className="table-container"><table className="table">
        <thead><tr><th>Product</th><th>Brand / model</th><th>Category</th><th>Price</th><th>Cost</th><th>Stock</th><th>Reorder</th><th>Warranty</th><th>Status</th><th></th></tr></thead>
        <tbody>{data.products.map(p => (
          <tr key={p.product_id}>
            <td style={{ fontWeight: 600 }}>{p.product_name}</td><td style={{ fontSize: 12 }}>{p.brand} {p.model}</td><td>{nameOf(data.cats, 'category_id', p.category_id, 'category_name')}</td>
            <td>{money(p.unit_price)}</td><td>{money(p.cost_price)}</td><td className={p.stock_qty <= p.reorder_level ? 'text-danger' : ''}>{p.stock_qty}</td><td>{p.reorder_level}</td>
            <td>{p.warranty_months} months</td><td><Badge text={p.is_active ? 'Active' : 'Cancelled'} /></td>
            <td className="table-action-cell"><button className="btn btn-ghost btn-sm" onClick={() => setForm(p)}><Pencil size={14} /> Edit</button>
              <button className="btn btn-ghost btn-sm text-danger" onClick={() => remove(p)}><Trash2 size={14} /></button></td>
          </tr>
        ))}</tbody>
      </table></div>
      {form && (
        <Modal title={form.product_id ? 'Edit product' : 'New product'} onClose={() => setForm(null)}
          footer={<><button className="btn btn-outline" onClick={() => setForm(null)}>Cancel</button><button id="save-product" className="btn btn-primary" disabled={busy} onClick={save}>Save</button></>}>
          <Field label="Product name *"><input id="product-name" className="form-input" value={form.product_name} onChange={set('product_name')} /></Field>
          <div className="form-row-2"><Field label="Brand"><input className="form-input" value={form.brand || ''} onChange={set('brand')} /></Field><Field label="Model"><input className="form-input" value={form.model || ''} onChange={set('model')} /></Field></div>
          <Field label="Category *"><select id="product-category" className="form-select" value={form.category_id} onChange={set('category_id')}>
            <option value="">— choose —</option>{data.cats.filter(c => c.is_active || c.category_id === form.category_id).map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}</select></Field>
          <div className="form-row-2"><Field label="Selling price (Rs.) *"><input id="product-price" type="number" className="form-input" value={form.unit_price} onChange={set('unit_price')} /></Field>
            <Field label="Cost price (Rs.) *"><input id="product-cost" type="number" className="form-input" value={form.cost_price} onChange={set('cost_price')} /></Field></div>
          <div className="form-row-3"><Field label="Stock"><input type="number" className="form-input" value={form.stock_qty} onChange={set('stock_qty')} /></Field>
            <Field label="Reorder level"><input type="number" className="form-input" value={form.reorder_level} onChange={set('reorder_level')} /></Field>
            <Field label="Warranty (months)"><input type="number" className="form-input" value={form.warranty_months} onChange={set('warranty_months')} /></Field></div>
          <label style={{ display: 'flex', gap: 8 }}><input type="checkbox" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Still sold (active)</label>
        </Modal>
      )}
    </div>
  );
}
