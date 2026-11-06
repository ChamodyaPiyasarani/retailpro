// ============================================================
// "Database" in the sequence diagrams = the Supabase database.
// Every class in this folder uses these small helpers to talk to it.
// ============================================================
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// run a Supabase query and give back the rows (or throw a clear error)
export async function run(query) {
  if (!isSupabaseConfigured) throw new Error('The database is not connected. Add the Supabase keys to the .env file.');
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

// the table "user" has to be written with quotes in SQL; Supabase does that for us
export const table = (name) => supabase.from(name);

// read all rows of a table, optionally filtered: readAll('product', { category_id: 2 })
export async function readAll(name, filters = {}, orderBy = null) {
  let q = table(name).select('*');
  for (const [col, val] of Object.entries(filters)) q = val === null ? q.is(col, null) : q.eq(col, val);
  if (orderBy) q = q.order(orderBy, { ascending: true });
  return run(q);
}

// read one row by its primary key
export async function readOne(name, pkColumn, id) {
  const rows = await run(table(name).select('*').eq(pkColumn, id));
  return rows[0] || null;
}

// insert one row and return it (with the new id made by the database)
export const insertRow = async (name, row) => (await run(table(name).insert(row).select()))[0];
// update a row by its primary key and return it
export const updateRow = async (name, pkColumn, id, changes) => (await run(table(name).update(changes).eq(pkColumn, id).select()))[0];
// delete a row by its primary key
export const deleteRow = (name, pkColumn, id) => run(table(name).delete().eq(pkColumn, id));

// dates as YYYY-MM-DD (the format of DATE columns)
export const today = () => new Date().toISOString().slice(0, 10);
export const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
export const addMonths = (date, n) => { const d = new Date(date); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10); };

// money as Sri Lankan rupees
export const money = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
