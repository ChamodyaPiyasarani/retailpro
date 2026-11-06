// Role Form – SD "Manage roles and permissions" (include: Assign permissions to role)
import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import Role from '../classes/Role';
import Permission from '../classes/Permission';
import { readAll } from '../classes/db';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Modal, Field, Badge, useLoad, useAction, Loading } from '../components/ui';

export default function RolesPage() {
  const { refresh } = useAuth();
  const { data, error, reload } = useLoad(async () => ({ roles: await readAll('role', {}, 'role_id'), perms: await Permission.getAll(), links: await readAll('role_permission'), users: await readAll('user') }));
  const { act, busy } = useAction();
  const [form, setForm] = useState(null);
  if (!data) return <Loading error={error} />;
  const permsOf = (roleId) => data.links.filter(l => l.role_id === roleId).map(l => l.permission_id);
  const modules = [...new Set(data.perms.map(p => p.module))];
  const tick = (pid) => setForm({ ...form, perms: form.perms.includes(pid) ? form.perms.filter(x => x !== pid) : [...form.perms, pid] });

  const save = async () => {
    const ok = await act(() => form.role_id
      ? Role.update(form.role_id, { role_name: form.role_name, description: form.description, is_active: form.is_active }, form.perms)
      : Role.create({ role_name: form.role_name, description: form.description, is_active: form.is_active }, form.perms), 'Role saved');
    if (ok) { setForm(null); reload(); refresh(); }
  };
  const remove = async (r) => { if (window.confirm(`Delete the role "${r.role_name}"?`) && await act(() => Role.delete(r.role_id), 'Role deleted')) reload(); };

  return (
    <div>
      <PageHeader title="Roles & Permissions" subtitle="Which functions each role may use">
        <button id="add-role" className="btn btn-primary" onClick={() => setForm({ role_name: '', description: '', is_active: true, perms: [] })}><Plus size={15} /> New role</button>
      </PageHeader>
      <div className="table-container"><table className="table">
        <thead><tr><th>Role</th><th>Description</th><th>Users</th><th>Permissions</th><th>Status</th><th></th></tr></thead>
        <tbody>{data.roles.map(r => (
          <tr key={r.role_id}>
            <td style={{ fontWeight: 600 }}>{r.role_name}</td><td>{r.description}</td><td>{data.users.filter(u => u.role_id === r.role_id).length}</td>
            <td style={{ fontSize: 12 }}>{data.perms.filter(p => permsOf(r.role_id).includes(p.permission_id)).map(p => p.permission_name).join(', ') || '—'}</td>
            <td><Badge text={r.is_active ? 'Active' : 'Cancelled'} /></td>
            <td className="table-action-cell">
              <button className="btn btn-ghost btn-sm" onClick={() => setForm({ ...r, perms: permsOf(r.role_id) })}><Pencil size={14} /> Edit</button>
              <button className="btn btn-ghost btn-sm text-danger" onClick={() => remove(r)}><Trash2 size={14} /></button>
            </td>
          </tr>
        ))}</tbody>
      </table></div>
      {form && (
        <Modal wide title={form.role_id ? 'Edit role' : 'New role'} onClose={() => setForm(null)}
          footer={<><button className="btn btn-outline" onClick={() => setForm(null)}>Cancel</button><button id="save-role" className="btn btn-primary" disabled={busy} onClick={save}>Save</button></>}>
          <Field label="Role name *"><input id="role-name" className="form-input" value={form.role_name} onChange={e => setForm({ ...form, role_name: e.target.value })} /></Field>
          <Field label="Description"><input className="form-input" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} /> Active (can be given to users)</label>
          <div className="form-label">Tick the permissions of this role</div>
          {modules.map(m => (
            <div key={m} style={{ marginBottom: 10 }}><div style={{ fontWeight: 700, fontSize: 13, margin: '6px 0' }}>{m}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 4 }}>
                {data.perms.filter(p => p.module === m).map(p => (
                  <label key={p.permission_id} style={{ fontSize: 13, display: 'flex', gap: 6 }}><input type="checkbox" checked={form.perms.includes(p.permission_id)} onChange={() => tick(p.permission_id)} />{p.permission_name}</label>
                ))}
              </div></div>
          ))}
        </Modal>
      )}
    </div>
  );
}
