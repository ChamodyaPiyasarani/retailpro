// ============================================================
// Loads the company data from Supabase after sign-in and saves
// every change made in the app back to the database.
//
// How saving works: every 1.5 seconds (and straight after each
// action message) the app's records are turned into table rows
// (schemaMap.toTables). Rows that are new or changed since the last
// save are upserted; rows that disappeared are deleted.
// ============================================================
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { toTables, fromTables, LOAD_TABLES, TABLE_ORDER, PK } from './schemaMap';
import { applyState, currentState, clearStore } from '../../data/store';

let saved = {};          // table -> Map(pk -> JSON of the row as saved)
let timer = null;
let busy = false;
let again = false;
const listeners = new Set();
let status = { state: 'idle', message: '', at: null };

// primary key columns of a table (some tables have a key of two columns) and the row's key text
const pkCols = (t) => [].concat(PK[t]);
const keyOf = (t, r) => pkCols(t).map(c => r[c]).join('|');

const setStatus = (s) => { status = { ...status, ...s }; listeners.forEach(fn => fn(status)); };
export const onSyncStatus = (fn) => { listeners.add(fn); fn(status); return () => listeners.delete(fn); };
export const getSyncStatus = () => status;

// Read a whole table (1000 rows per request)
async function selectAll(table) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select('*').order(pkCols(table)[0]).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...data);
    if (data.length < 1000) return out;
  }
}

const snapshotOf = (tables) => Object.fromEntries(Object.entries(tables).map(([t, rows]) =>
  [t, new Map(rows.map(r => [keyOf(t, r), JSON.stringify(r)]))]));

// Load every table and fill the app's lists
export async function loadCompanyData() {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured (.env is missing).');
  setStatus({ state: 'loading', message: 'Loading company data…' });
  const rows = {};
  await Promise.all(LOAD_TABLES.map(async t => { rows[t] = await selectAll(t); }));
  applyState(fromTables(rows));
  saved = snapshotOf(toTables(currentState()));
  setStatus({ state: 'saved', message: 'All changes saved', at: new Date() });
  return rows;
}

// Write the differences to the database
async function saveChanges() {
  if (busy) { again = true; return; }
  busy = true;
  try {
    const now = toTables(currentState());
    const work = [];
    for (const t of TABLE_ORDER) {
      const cur = new Map((now[t] || []).map(r => [keyOf(t, r), r]));
      const old = saved[t] || new Map();
      const changed = [...cur.entries()].filter(([k, r]) => old.get(k) !== JSON.stringify(r)).map(([, r]) => r);
      const removed = [...old.keys()].filter(k => !cur.has(k));
      if (changed.length || removed.length) work.push({ t, changed, removed, cur });
    }
    if (!work.length) return;
    setStatus({ state: 'saving', message: 'Saving…' });
    const errors = [];
    // 1) new and changed rows, parents first
    for (const { t, changed } of work) {
      if (!changed.length) continue;
      if (t === 'user') {
        // staff profiles are created by Supabase Auth, so they are only updated here
        for (const r of changed) {
          const { user_id, ...rest } = r;
          const { error } = await supabase.from('user').update(rest).eq('user_id', user_id);
          if (error) errors.push(`${t}: ${error.message}`);
          remember(t, r);
        }
        continue;
      }
      let { error } = await supabase.from(t).upsert(changed, { onConflict: pkCols(t).join(',') });
      if (error) {
        // find the row that failed, save the others
        for (const r of changed) {
          const res = await supabase.from(t).upsert([r], { onConflict: pkCols(t).join(',') });
          if (res.error) errors.push(`${t} ${keyOf(t, r)}: ${res.error.message}`);
        }
      }
      changed.forEach(r => remember(t, r));
    }
    // 2) removed rows, children first
    for (const { t, removed } of [...work].reverse()) {
      if (!removed.length) continue;
      // a technician row is never deleted: his old service jobs still point to it
      if (t === 'technician') { removed.forEach(k => saved[t]?.delete(k)); continue; }
      if (t === 'user') {
        for (const id of removed) {
          const { error } = await supabase.from('user').update({ is_active: false, is_locked: true }).eq('user_id', id);
          if (error) errors.push(`${t}: ${error.message}`);
        }
      } else {
        if (pkCols(t).length > 1) {
          // two-column key: delete row by row
          for (const k of removed) {
            const vals = k.split('|');
            const match = Object.fromEntries(pkCols(t).map((c, i) => [c, vals[i]]));
            const { error } = await supabase.from(t).delete().match(match);
            if (error) errors.push(`${t}: ${error.message}`);
          }
        } else {
          const ids = removed.map(k => (isNaN(Number(k)) ? k : Number(k)));
          const { error } = await supabase.from(t).delete().in(PK[t], ids);
          if (error) errors.push(`${t}: ${error.message}`);
        }
      }
      removed.forEach(k => saved[t]?.delete(k));
    }
    if (errors.length) {
      console.error('Database save problems:', errors);
      setStatus({ state: 'error', message: `Not saved: ${errors[0]}`, at: new Date() });
    } else {
      setStatus({ state: 'saved', message: 'All changes saved', at: new Date() });
    }
  } catch (e) {
    console.error(e);
    setStatus({ state: 'error', message: `Not saved: ${e.message}`, at: new Date() });
  } finally {
    busy = false;
    if (again) { again = false; saveChanges(); }
  }
}
function remember(t, r) {
  if (!saved[t]) saved[t] = new Map();
  saved[t].set(keyOf(t, r), JSON.stringify(r));
}

let soon = null;
export const saveSoon = () => { clearTimeout(soon); soon = setTimeout(saveChanges, 150); };
export const saveNow = () => saveChanges();

export function startAutoSave() {
  stopAutoSave();
  timer = setInterval(saveChanges, 1500);
}
export function stopAutoSave() {
  if (timer) clearInterval(timer);
  timer = null;
}
// Sign-out: save what is left, stop saving and empty the lists
export async function closeCompanyData() {
  stopAutoSave();
  try { await saveChanges(); } catch { /* ignore */ }
  saved = {};
  clearStore();
  setStatus({ state: 'idle', message: '' });
}
