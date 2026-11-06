// Class: Role  (tables: role, role_permission)
// A role (e.g. Storekeeper) has many permissions; a permission can belong to many roles (M:N).
import { readAll, readOne, insertRow, updateRow, deleteRow, run, table, today } from './db';

export default class Role {
  // + create()  – save the role, then save one role_permission row for each ticked permission
  static async create({ role_name, description, is_active = true }, permissionIds = []) {
    const name = String(role_name || '').trim();
    if (!name) throw new Error('Please enter the role name.');
    const used = await run(table('role').select('role_id').ilike('role_name', name));
    if (used.length) throw new Error('A role with this name already exists.');
    const role = await insertRow('role', { role_name: name, description, is_active });
    for (const pid of permissionIds) await Role.assignPermission(role.role_id, pid);
    return role;
  }

  // + update()  – change the role and make its permissions match the ticked list
  static async update(roleId, changes, permissionIds = null) {
    if (changes.role_name !== undefined) {
      const name = String(changes.role_name).trim();
      if (!name) throw new Error('Please enter the role name.');
      const used = await run(table('role').select('role_id').ilike('role_name', name).neq('role_id', roleId));
      if (used.length) throw new Error('A role with this name already exists.');
      changes = { ...changes, role_name: name };
    }
    const role = await updateRow('role', 'role_id', roleId, changes);
    if (permissionIds) {
      const now = (await readAll('role_permission', { role_id: roleId })).map(r => r.permission_id);
      for (const pid of permissionIds) if (!now.includes(pid)) await Role.assignPermission(roleId, pid);
      for (const pid of now) if (!permissionIds.includes(pid)) await Role.removePermission(roleId, pid);
    }
    return role;
  }

  // + delete()  – a role that is still given to users cannot be deleted
  static async delete(roleId) {
    const users = await readAll('user', { role_id: roleId });
    if (users.length) throw new Error(`This role is given to ${users.length} user(s). Change their role first.`);
    await deleteRow('role', 'role_id', roleId);   // its role_permission rows are removed too (on delete cascade)
  }

  // + assignPermission()
  static assignPermission(roleId, permissionId) {
    return insertRow('role_permission', { role_id: roleId, permission_id: permissionId, granted_date: today() });
  }

  // + removePermission()
  static removePermission(roleId, permissionId) {
    return run(table('role_permission').delete().eq('role_id', roleId).eq('permission_id', permissionId));
  }

  // + getPermissions()  – names of the functions this role may use
  static async getPermissions(roleId) {
    const links = await readAll('role_permission', { role_id: roleId });
    if (!links.length) return [];
    const perms = await run(table('permission').select('*').in('permission_id', links.map(l => l.permission_id)));
    return perms.map(p => p.permission_name);
  }

  static find(roleId) { return readOne('role', 'role_id', roleId); }
}
