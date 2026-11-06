// Discount Form – SD "Manage discounts"
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Discount from '../classes/Discount';
import { today, addDays } from '../classes/db';
import { PageHeader, Modal, Field, Badge, useLoad, useAction, Loading } from '../components/ui';

export default function DiscountsPage() {
  const { data, error, reload } = useLoad(() => Discount.getAll());
  const { act, busy } = useAction();
  const [form, setForm] = useState(null);
  if (!data) return <Loading error={error} />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const save = async () => { if (await act(() => form.discount_id ? Discount.update(form.discount_id, form) : Discount.create(form), 'Discount saved')) { setForm(null); reload(); } };
  const remove = async (d) => { if (window.confirm(`Delete ${d.discount_code}?`) && await act(() => Discount.delete(d.discount_id), r => r === 'inactive' ? 'Code was used before, so it is now inactive' : 'Discount deleted')) reload(); };
  const state = (d) => !d.is_active ? 'Cancelled' : d.end_date < today() ? 'Expired' : d.start_date > today() ? 'Pending' : 'Active';
  return (
    <div>
      <PageHeader title="Discounts" subtitle="Discount codes the cashier can apply to a sales order">
        <button id="add-discount" className="btn btn-primary" onClick={() => setForm({ discount_code: '', rate: 10, description: '', start_date: today(), end_date: addDays(today(), 30), is_active: true })}><Plus size={15} /> New discount</button>
      </PageHeader>
      <div className="table-container"><table className="table">
        <thead><tr><th>Code</th><th>Rate</th><th>Description</th><th>From</th><th>To</th><th>Status</th><th></th></tr></thead>
        <tbody>{data.map(d => (
          <tr key={d.discount_id}><td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{d.discount_code}</td><td>{Number(d.rate)}%</td><td>{d.description}</td><td>{d.start_date}</td><td>{d.end_date}</td>
            <td><Badge text={state(d)} /></td>
            <td className="table-action-cell"><button className="btn btn-ghost btn-sm" onClick={() => setForm(d)}><Pencil size={14} /> Edit</button><button className="btn btn-ghost btn-sm text-danger" onClick={() => remove(d)}><Trash2 size={14} /></button></td></tr>
        ))}</tbody>
      </table></div>
      {form && (
        <Modal title={form.discount_id ? 'Edit discount' : 'New discount'} onClose={() => setForm(null)}
          footer={<><button className="btn btn-outline" onClick={() => setForm(null)}>Cancel</button><button id="save-discount" className="btn btn-primary" disabled={busy} onClick={save}>Save</button></>}>
          <div className="form-row-2"><Field label="Code *"><input id="discount-code" className="form-input" value={form.discount_code} onChange={set('discount_code')} /></Field>
            <Field label="Rate (%) *"><input id="discount-rate" type="number" className="form-input" value={form.rate} onChange={set('rate')} /></Field></div>
          <Field label="Description"><input className="form-input" value={form.description || ''} onChange={set('description')} /></Field>
          <div className="form-row-2"><Field label="Start date *"><input type="date" className="form-input" value={form.start_date} onChange={set('start_date')} /></Field>
            <Field label="End date *"><input type="date" className="form-input" value={form.end_date} onChange={set('end_date')} /></Field></div>
          <label style={{ display: 'flex', gap: 8 }}><input type="checkbox" checked={!!form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        </Modal>
      )}
    </div>
  );
}
