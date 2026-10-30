// Customers saved in the Supabase "customer" table (real CRUD).
// Table columns (File Design): customer_id, name, phone, email, address,
// customer_type, registered_date.
// The app shows customer_id 1, 2, 3 … as C001, C002, C003 …
// Credit limit is not a column of CUSTOMER (it belongs to CREDIT_ACCOUNT),
// so it stays in the app's sample data.
import { supabase, isSupabaseConfigured } from './supabaseClient';

export const canUseCustomerDb = (user) => isSupabaseConfigured && user?.source === 'supabase';

const toAppId = (dbId) => `C${String(dbId).padStart(3, '0')}`;

// database row -> app customer
export const fromRow = (row, old = {}) => ({
  creditLimit: 50000, creditUsed: 0, balance: 0, ...old,
  id: toAppId(row.customer_id), dbId: row.customer_id,
  name: row.name || '', phone: row.phone || '', email: row.email || '', address: row.address || '',
  customerType: row.customer_type || 'retail', createdAt: row.registered_date || old.createdAt,
});

// app form -> database row
const toRow = (c) => ({
  name: c.name?.trim(), phone: c.phone?.trim(), email: c.email?.trim() || null, address: c.address?.trim() || null,
  customer_type: c.customerType || 'retail',
});

// Read all customers. If the table is still empty, add the 5 sample customers
// first (in order) so they get ids 1–5 = C001–C005, matching the sample sales.
// Only one load at a time, so the samples are never added twice
let loading = null;
export function loadCustomers(samples = []) {
  if (!loading) loading = doLoad(samples).finally(() => { loading = null; });
  return loading;
}

async function doLoad(samples) {
  let { data, error } = await supabase.from('customer').select('*').order('customer_id');
  if (error) return { ok: false, message: error.message };
  if (data.length === 0 && samples.length) {
    const seed = samples.map(c => ({ ...toRow(c), registered_date: c.createdAt }));
    const ins = await supabase.from('customer').insert(seed).select('*');
    if (ins.error) return { ok: false, message: ins.error.message };
    data = ins.data.sort((a, b) => a.customer_id - b.customer_id);
  }
  return { ok: true, rows: data };
}

export async function insertCustomer(form) {
  const { data, error } = await supabase.from('customer')
    .insert({ ...toRow(form), registered_date: new Date().toISOString().slice(0, 10) })
    .select('*').single();
  return error ? { ok: false, message: error.message } : { ok: true, row: data };
}

export async function updateCustomer(dbId, form) {
  const { data, error } = await supabase.from('customer').update(toRow(form)).eq('customer_id', dbId).select('*').single();
  return error ? { ok: false, message: error.message } : { ok: true, row: data };
}

export async function deleteCustomer(dbId) {
  const { error } = await supabase.from('customer').delete().eq('customer_id', dbId);
  if (!error) return { ok: true };
  // 23503 = the customer is still used by sales orders, complaints, etc.
  if (error.code === '23503') return { ok: false, message: 'This customer has sales or other records, so it cannot be deleted.' };
  return { ok: false, message: error.message };
}
