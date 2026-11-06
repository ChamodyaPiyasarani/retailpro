// Category Form – SD "Manage categories"
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Category from '../classes/Category';
import { readAll } from '../classes/db';
import { PageHeader, Modal, Field, Badge, useLoad, useAction, Loading } from '../components/ui';

export default function CategoriesPage() {
  const { data, error, reload } = useLoad(async () => ({ cats: await Category.getAll(), products: await readAll('product') }));
  const { act, busy } = useAction();
  const [form, setForm] = useState(null);
  if (!data) return <Loading error={error} />;
  const save = async () => { if (await act(() => form.category_id ? Category.update(form.category_id, form) : Category.create(form), 'Category saved')) { setForm(null); reload(); } };
  const remove = async (c) => { if (window.confirm(`Delete ${c.category_name}?`) && await act(() => Category.delete(c.category_id), 'Category deleted')) reload(); };
  return (
    <div>
      <PageHeader title="Categories" subtitle="Groups of products"><button id="add-category" className="btn btn-primary" onClick={() => setForm({ category_name: '', description: '', is_active: true })}><Plus size={15} /> New category</button></PageHeader>
      <div className="table-container"><table className="table">
        <thead><tr><th>Category</th><th>Description</th><th>Products</th><th>Status</th><th></th></tr></thead>
        <tbody>{data.cats.map(c => (
          <tr key={c.category_id}><td style={{ fontWeight: 600 }}>{c.category_name}</td><td>{c.description}</td><td>{data.products.filter(p => p.category_id === c.category_id).length}</td>
            <td><Badge text={c.is_active ? 'Active' : 'Cancelled'} /></td>
            <td className="table-action-cell"><button className="btn btn-ghost btn-sm" onClick={() => setForm(c)}><Pencil size={14} /> Edit</button><button className="btn btn-ghost btn-sm text-danger" onClick={() => remove(c)}><Trash2 size={14} /></button></td></tr>
        ))}</tbody>
      </table></div>
      {form && (
        <Modal title={form.category_id ? 'Edit category' : 'New category'} onClose={() => setForm(null)}
          footer={<><button className="btn btn-outline" onClick={() => setForm(null)}>Cancel</button><button id="save-category" className="btn btn-primary" disabled={busy} onClick={save}>Save</button></>}>
          <Field label="Category name *"><input id="category-name" className="form-input" value={form.category_name} onChange={e => setForm({ ...form, category_name: e.target.value })} /></Field>
          <Field label="Description"><input className="form-input" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <label style={{ display: 'flex', gap: 8 }}><input type="checkbox" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        </Modal>
      )}
    </div>
  );
}
