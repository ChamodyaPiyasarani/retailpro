// User Form – SD "Manage user accounts" (include: Assign role to user, extend: Lock / unlock account)
import { useState } from 'react';
import { Plus, Lock, Unlock, Pencil } from 'lucide-react';
import User from '../classes/User';
import Technician from '../classes/Technician';
import { readAll } from '../classes/db';
import { PageHeader, Modal, Field, Badge, useLoad, useAction, Loading } from '../components/ui';

const blank = { name: '', email: '', phone: '', password: '', role_id: '', experience_years: 0, specialisations: '' };

export default function UsersPage() {
  const { data, error, reload } = useLoad(async () => ({ users: await readAll('user', {}, 'user_id'), roles: await readAll('role', {}, 'role_id'), techs: await Technician.getAll() }));
  const { act, busy } = useAction();
  const [form, setForm] = useState(null);   // null = closed
  if (!data) return <Loading error={error} />;
  const roleOf = (id) => data.roles.find(r => r.role_id === id);
  const isTechRole = (id) => /technician/i.test(roleOf(Number(id))?.role_name || '');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    const tech = { experience_years: form.experience_years, specialisations: String(form.specialisations).split(',').map(s => s.trim()).filter(Boolean) };
    const ok = await act(() => form.user_id ? User.update(form.user_id, { ...form, role_id: Number(form.role_id) }, tech) : User.create({ ...form, role_id: Number(form.role_id) }, tech), 'User saved');
    if (ok) { setForm(null); reload(); }
  };
  const toggleLock = async (u) => { if (await act(() => u.is_active ? User.lockAccount(u.user_id) : User.unlockAccount(u.user_id), 'Account status updated')) reload(); };

  return (
    <div>
      <PageHeader title="User Accounts" subtitle="Staff who can log in, and their roles">
        <button id="add-user" className="btn btn-primary" onClick={() => setForm({ ...blank, role_id: data.roles[0]?.role_id })}><Plus size={15} /> New user</button>
      </PageHeader>
      <div className="table-container"><table className="table">
        <thead><tr><th>Name</th><th>E-mail</th><th>Phone</th><th>Role</th><th>Last log in</th><th>Status</th><th></th></tr></thead>
        <tbody>{data.users.map(u => (
          <tr key={u.user_id}>
            <td style={{ fontWeight: 600 }}>{u.name}</td><td>{u.email}</td><td>{u.phone || '—'}</td><td>{roleOf(u.role_id)?.role_name || '—'}</td>
            <td style={{ fontSize: 12 }}>{u.last_login ? new Date(u.last_login).toLocaleString() : '—'}</td>
            <td><Badge text={u.is_active ? 'Active' : 'Locked'} /></td>
            <td className="table-action-cell">
              <button className="btn btn-ghost btn-sm" onClick={() => { const t = data.techs.find(x => x.user_id === u.user_id); setForm({ ...u, password: '', experience_years: t?.experience_years || 0, specialisations: (t?.specialisations || []).join(', ') }); }}><Pencil size={14} /> Edit</button>
              <button className="btn btn-ghost btn-sm" onClick={() => toggleLock(u)}>{u.is_active ? <><Lock size={14} /> Lock</> : <><Unlock size={14} /> Unlock</>}</button>
            </td>
          </tr>
        ))}</tbody>
      </table></div>

      {form && (
        <Modal title={form.user_id ? 'Edit user' : 'New user'} onClose={() => setForm(null)}
          footer={<><button className="btn btn-outline" onClick={() => setForm(null)}>Cancel</button><button id="save-user" className="btn btn-primary" disabled={busy} onClick={save}>Save</button></>}>
          <Field label="Name *"><input id="user-name" className="form-input" value={form.name} onChange={set('name')} /></Field>
          <Field label="E-mail *"><input id="user-email" className="form-input" value={form.email} onChange={set('email')} /></Field>
          <Field label="Phone"><input className="form-input" value={form.phone || ''} onChange={set('phone')} /></Field>
          {!form.user_id && <Field label="Password * (at least 6 characters)" hint="Kept encrypted by Supabase Auth, not in our table"><input id="user-password" type="password" className="form-input" value={form.password} onChange={set('password')} /></Field>}
          <Field label="Role *">
            <select id="user-role" className="form-select" value={form.role_id} onChange={set('role_id')}>
              {data.roles.filter(r => r.is_active || r.role_id === form.role_id).map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
            </select>
          </Field>
          {isTechRole(form.role_id) && (<>
            <Field label="Years of experience"><input type="number" min="0" className="form-input" value={form.experience_years} onChange={set('experience_years')} /></Field>
            <Field label="Specialisations (comma between them)" hint="e.g. Repair, Installation"><input id="user-specialisations" className="form-input" value={form.specialisations} onChange={set('specialisations')} /></Field>
          </>)}
        </Modal>
      )}
    </div>
  );
}
