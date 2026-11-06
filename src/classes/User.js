// Class: User  (table: "user")
// Passwords are not kept in our table: Supabase Auth keeps them encrypted
// and checks them when a staff member logs in.
import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { run, table, readOne, insertRow, updateRow, today } from './db';
import Role from './Role';
import Technician from './Technician';

export const PASSWORD_NOTE = '(kept encrypted by Supabase Auth)';

// a second connection that does not keep a session, so the Admin is not
// logged out when he creates an account for a new staff member
const signupClient = isSupabaseConfigured
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'rp-new-staff' } })
  : null;

const findByEmail = async (email) =>
  (await run(table('user').select('*').ilike('email', String(email || '').trim())))[0] || null;

export default class User {
  // + login()  – SD "Log in": validate user details, find the user, read the role permissions, save last login time
  static async login(email, password) {
    if (!String(email || '').trim() || !password) throw new Error('Please enter your e-mail and password.');
    if (!isSupabaseConfigured) throw new Error('The database is not connected. Add the Supabase keys to the .env file.');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error('Invalid e-mail or password');
    return User.loadSession(email);
  }

  // after Supabase Auth accepted the password (or after a page refresh): load the staff member and his permissions
  static async loadSession(email) {
    const user = await findByEmail(email);
    if (!user || !user.is_active) {
      await supabase.auth.signOut();
      throw new Error(user ? 'Your account is locked. Please contact the Admin.' : 'Invalid e-mail or password');
    }
    const role = user.role_id ? await Role.find(user.role_id) : null;
    if (!role || !role.is_active) { await supabase.auth.signOut(); throw new Error('Your account has no active role. Please contact the Admin.'); }
    const permissions = await Role.getPermissions(role.role_id);
    const tech = (await run(table('technician').select('*').eq('user_id', user.user_id)))[0] || null;
    await updateRow('user', 'user_id', user.user_id, { last_login: new Date().toISOString() });
    return { ...user, role, permissions, technician: tech };
  }

  // + logout()  – SD "Log out": end the session
  static logout() {
    return isSupabaseConfigured ? supabase.auth.signOut() : null;
  }

  // + resetPassword()  – find the user by e-mail and send the reset link to his e-mail
  static async resetPassword(email) {
    if (!String(email || '').trim()) throw new Error('Please enter your e-mail.');
    const user = await findByEmail(email).catch(() => null);
    // the same message is shown even when no user is found, so nobody can test which e-mails exist
    if (user) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + window.location.pathname });
      if (error) throw new Error(error.message);
    }
    return 'Reset link sent to your e-mail';
  }

  // + changePassword()  – the signed-in user sets a new password (after opening the reset link)
  static async changePassword(newPassword) {
    if (!newPassword || newPassword.length < 6) throw new Error('The password must have at least 6 characters.');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  // + create()  – SD "Manage user accounts": save the user with a role (and a technician record for technicians)
  static async create({ name, email, phone, password, role_id }, technicianDetails = null) {
    name = String(name || '').trim(); email = String(email || '').trim().toLowerCase();
    if (!name || !email || !role_id) throw new Error('Please enter the name, e-mail and role.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('Please enter a valid e-mail.');
    if (await findByEmail(email)) throw new Error('This e-mail is already used by another user.');
    if (!password || password.length < 6) throw new Error('The password must have at least 6 characters.');
    // Supabase Auth keeps the password (encrypted) and checks it at log in
    const { error } = await signupClient.auth.signUp({ email, password, options: { data: { name } } });
    if (error && !/already registered/i.test(error.message)) throw new Error(error.message);
    const user = await insertRow('user', { name, email, phone, password: PASSWORD_NOTE, is_active: true, created_date: today(), role_id });
    const role = await Role.find(role_id);
    if (role && /technician/i.test(role.role_name)) await Technician.create({ user_id: user.user_id, ...(technicianDetails || {}) });
    return user;
  }

  // + update()
  static async update(userId, { name, email, phone, role_id }, technicianDetails = null) {
    email = String(email || '').trim().toLowerCase();
    const other = await findByEmail(email);
    if (other && other.user_id !== userId) throw new Error('This e-mail is already used by another user.');
    const user = await updateRow('user', 'user_id', userId, { name: String(name).trim(), email, phone });
    if (role_id) await User.assignRole(userId, role_id, technicianDetails);
    return user;
  }

  // + assignRole()  – a user who becomes a Technician also gets a technician record
  static async assignRole(userId, roleId, technicianDetails = null) {
    await updateRow('user', 'user_id', userId, { role_id: roleId });
    const role = await Role.find(roleId);
    const tech = (await run(table('technician').select('*').eq('user_id', userId)))[0];
    if (role && /technician/i.test(role.role_name) && !tech) await Technician.create({ user_id: userId, ...(technicianDetails || {}) });
  }

  // + deactivate()  – the user can no longer log in (his old records stay)
  static deactivate(userId) { return updateRow('user', 'user_id', userId, { is_active: false }); }

  // + lockAccount()
  static lockAccount(userId) { return updateRow('user', 'user_id', userId, { is_active: false }); }

  // + unlockAccount()
  static unlockAccount(userId) { return updateRow('user', 'user_id', userId, { is_active: true }); }

  static find(userId) { return readOne('user', 'user_id', userId); }
}
