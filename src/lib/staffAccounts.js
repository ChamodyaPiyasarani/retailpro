// Staff accounts in Supabase Auth, managed by the Admin from the Users page.
// A second Supabase client (that does not save a session) is used for sign-up,
// so creating a new account does NOT sign the Admin out.
import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const signupClient = isSupabaseConfigured
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'rp-staff-signup' },
    })
  : null;

// Create the Supabase Auth account + fill in the staff profile (user table)
export async function createStaffAccount({ name, email, password, role }) {
  if (!isSupabaseConfigured) return { ok: true, skipped: true };
  if (!password || password.length < 6) return { ok: false, message: 'Password must be at least 6 characters.' };

  const { data, error } = await signupClient.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: name } },
  });
  if (error) return { ok: false, message: error.message };
  // Supabase returns a user with no identities when the e-mail is already registered
  if (!data.user || (Array.isArray(data.user.identities) && data.user.identities.length === 0)) {
    return { ok: false, message: 'A user with this e-mail already exists.' };
  }

  // The database trigger has created the profile row; set the role and status (Admin's session)
  const { error: pErr } = await supabase.from('user')
    .update({ full_name: name, user_type: role, is_active: true, is_locked: false })
    .eq('user_id', data.user.id);
  if (pErr) return { ok: false, message: 'Account created, but the role could not be saved: ' + pErr.message };

  return { ok: true, authId: data.user.id, needsConfirmation: !data.session };
}

// Update name / role / lock status of an existing staff profile (matched by e-mail)
export async function updateStaffProfile(email, changes) {
  if (!isSupabaseConfigured) return { ok: true, skipped: true };
  const { data, error } = await supabase.from('user').update(changes).eq('email', email.trim()).select('user_id');
  if (error) return { ok: false, message: error.message };
  return { ok: true, found: (data || []).length > 0 };
}
