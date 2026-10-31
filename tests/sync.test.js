// Unit tests: loading from and saving to Supabase (src/lib/db/sync.js)
// Supabase is replaced by a small in-memory database, so every request the app
// sends can be checked.
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { loadRows } from './helpers';

const fake = vi.hoisted(() => {
  const db = { tables: {}, calls: [], failOn: null };
  const pkOf = { technician_specialisation: ['technician_id', 'specialisation'] };
  const done = (data = null, error = null) => Promise.resolve({ data, error });
  function from(table) {
    const q = { table, filters: [] };
    const builder = {
      select() { q.op = q.op || 'select'; return builder; },
      order(col) { q.order = col; return builder; },
      range(a, b) {
        const rows = [...(db.tables[table] || [])];
        return done(rows.slice(a, b + 1));
      },
      upsert(rows, opts) {
        db.calls.push({ op: 'upsert', table, rows, onConflict: opts?.onConflict });
        if (db.failOn === table) return done(null, { message: `${table} is broken` });
        const keys = opts.onConflict.split(',');
        const list = db.tables[table] || (db.tables[table] = []);
        for (const r of rows) {
          const i = list.findIndex(x => keys.every(k => x[k] === r[k]));
          if (i >= 0) list[i] = { ...list[i], ...r }; else list.push(r);
        }
        return done(rows);
      },
      update(changes) { q.op = 'update'; q.changes = changes; return builder; },
      delete() { q.op = 'delete'; return builder; },
      eq(col, val) {
        db.calls.push({ op: q.op, table, changes: q.changes, where: { [col]: val } });
        (db.tables[table] || []).filter(r => r[col] === val).forEach(r => Object.assign(r, q.changes));
        return done([]);
      },
      in(col, vals) {
        db.calls.push({ op: 'delete', table, where: { [col]: vals } });
        db.tables[table] = (db.tables[table] || []).filter(r => !vals.includes(r[col]));
        return done([]);
      },
      match(obj) {
        db.calls.push({ op: 'delete', table, match: obj });
        db.tables[table] = (db.tables[table] || []).filter(r => !Object.entries(obj).every(([k, v]) => String(r[k]) === String(v)));
        return done([]);
      },
    };
    return builder;
  }
  return { db, client: { from }, pkOf };
});

vi.mock('../src/lib/supabaseClient', () => ({ supabase: fake.client, isSupabaseConfigured: true }));

const { loadCompanyData, saveNow, closeCompanyData, getSyncStatus, onSyncStatus } = await import('../src/lib/db/sync');
const S = await import('../src/data/store');

const writes = () => fake.db.calls.filter(c => c.op !== 'select');
beforeEach(async () => {
  fake.db.tables = loadRows();
  fake.db.calls = [];
  fake.db.failOn = null;
  await loadCompanyData();
  fake.db.calls = [];
});

describe('loading', () => {
  test('fills every list from the database', () => {
    expect(S.PRODUCTS).toHaveLength(12);
    expect(S.CUSTOMERS).toHaveLength(5);
    expect(S.SALES_ORDERS).toHaveLength(63);
    expect(S.SERVICE_JOBS).toHaveLength(38);
    expect(getSyncStatus().state).toBe('saved');
  });
  test('reads more than 1000 rows in pages', async () => {
    const many = Array.from({ length: 2500 }, (_, i) => ({ audit_id: i + 1, action: 'test', detail: 'x', logged_at: '2026-10-01T00:00:00', user_id: null, details: {} }));
    fake.db.tables.audit_log = many;
    await loadCompanyData();
    expect(S.AUDIT_LOG).toHaveLength(2500);
  });
  test('status listeners are told about changes', async () => {
    const seen = [];
    const off = onSyncStatus(s => seen.push(s.state));
    await loadCompanyData();
    off();
    expect(seen).toContain('loading');
    expect(seen.at(-1)).toBe('saved');
  });
});

describe('saving', () => {
  test('nothing is written when nothing changed', async () => {
    await saveNow();
    expect(writes()).toHaveLength(0);
  });

  test('a changed record is saved as one upsert of that row only', async () => {
    S.getProduct('P001').stock = 99;
    await saveNow();
    const w = writes();
    expect(w).toHaveLength(1);
    expect(w[0]).toMatchObject({ op: 'upsert', table: 'product', onConflict: 'product_id' });
    expect(w[0].rows).toHaveLength(1);
    expect(w[0].rows[0]).toMatchObject({ product_id: 1, stock_qty: 99 });
    expect(fake.db.tables.product.find(p => p.product_id === 1).stock_qty).toBe(99);
    // saving again writes nothing more
    fake.db.calls = [];
    await saveNow();
    expect(writes()).toHaveLength(0);
  });

  test('a new record is inserted with its child rows, parents first', async () => {
    const id = S.newSaleId();
    S.SALES_ORDERS.push({ id, date: S.today(), customerId: 'C001', status: 'completed', paymentMethod: 'cash', subtotal: 185000, discount: 0, tax: 0,
      grandTotal: 185000, amountPaid: 185000, balance: 0, invoiceNo: S.newInvNo(), paymentStatus: 'paid', items: [{ productId: 'P001', name: 'CPU', qty: 1, unitPrice: 185000, discount: 0, total: 185000 }] });
    await saveNow();
    const tables = writes().map(c => c.table);
    expect(tables).toEqual(expect.arrayContaining(['sales_order', 'sales_order_item', 'invoice', 'warranty_record']));
    expect(tables.indexOf('sales_order')).toBeLessThan(tables.indexOf('sales_order_item'));
    expect(tables.indexOf('sales_order')).toBeLessThan(tables.indexOf('invoice'));
    expect(fake.db.tables.sales_order.find(o => o.sales_order_id === 64)).toBeTruthy();
  });

  test('a removed record is deleted (children before parents)', async () => {
    const i = S.SALES_ORDERS.findIndex(o => o.id === 'SO-063');
    S.SALES_ORDERS.splice(i, 1);
    S.PAYMENTS.splice(0, S.PAYMENTS.length, ...S.PAYMENTS.filter(p => p.salesOrderId !== 'SO-063'));
    await saveNow();
    const dels = writes().filter(c => c.op === 'delete');
    const t = dels.map(d => d.table);
    expect(t).toContain('sales_order');
    expect(t).toContain('sales_order_item');
    expect(t.indexOf('sales_order_item')).toBeLessThan(t.indexOf('sales_order'));
    expect(fake.db.tables.sales_order.find(o => o.sales_order_id === 63)).toBeUndefined();
  });

  test('a removed staff member is deactivated and locked, never deleted', async () => {
    const u = S.USERS.find(x => x.role === 'finance');
    S.USERS.splice(S.USERS.indexOf(u), 1);
    await saveNow();
    const c = writes().find(x => x.table === 'user');
    expect(c).toMatchObject({ op: 'update', changes: { is_active: false, is_locked: true }, where: { user_id: u.id } });
    expect(writes().some(x => x.table === 'user' && x.op === 'delete')).toBe(false);
  });

  test('a staff profile change is an update (accounts are made by Supabase Auth)', async () => {
    const u = S.USERS.find(x => x.role === 'sales');
    u.name = 'New Name';
    await saveNow();
    const c = writes().find(x => x.table === 'user');
    expect(c.op).toBe('update');
    expect(c.changes.full_name).toBe('New Name');
    expect(c.where).toEqual({ user_id: u.id });
  });

  test('a technician row is never deleted (his old jobs still point to it)', async () => {
    const t = S.USERS.find(x => x.role === 'technician');
    S.USERS.splice(S.USERS.indexOf(t), 1);
    await saveNow();
    expect(writes().some(x => x.table === 'technician' && x.op === 'delete')).toBe(false);
    expect(fake.db.tables.technician).toHaveLength(1);
  });

  test('removing a technician skill deletes that one row with both key columns', async () => {
    const t = S.USERS.find(x => x.role === 'technician');
    t.skills = t.skills.filter(s => s !== 'maintenance');
    await saveNow();
    const d = writes().find(x => x.table === 'technician_specialisation');
    expect(d).toMatchObject({ op: 'delete', match: { technician_id: '1', specialisation: 'maintenance' } });
    expect(fake.db.tables.technician_specialisation.map(r => r.specialisation).sort()).toEqual(['installation', 'repair']);
  });

  test('adding a skill upserts on the two-column key', async () => {
    const t = S.USERS.find(x => x.role === 'technician');
    t.skills = [...t.skills, 'inspection'];
    await saveNow();
    const u = writes().find(x => x.table === 'technician_specialisation');
    expect(u).toMatchObject({ op: 'upsert', onConflict: 'technician_id,specialisation' });
    expect(u.rows).toEqual([{ technician_id: 1, specialisation: 'inspection' }]);
  });

  test('a database error is shown as "Not saved" and the other rows are still saved', async () => {
    fake.db.failOn = 'complaint';
    S.COMPLAINTS[0].status = 'closed';
    S.getProduct('P002').stock = 7;
    await saveNow();
    expect(getSyncStatus().state).toBe('error');
    expect(getSyncStatus().message).toMatch(/Not saved: complaint/);
    expect(fake.db.tables.product.find(p => p.product_id === 2).stock_qty).toBe(7);
  });
});

describe('sign-out', () => {
  test('saves what is left, then empties the lists', async () => {
    S.getProduct('P003').stock = 42;
    await closeCompanyData();
    expect(fake.db.tables.product.find(p => p.product_id === 3).stock_qty).toBe(42);
    expect(S.PRODUCTS).toHaveLength(0);
    expect(S.SALES_ORDERS).toHaveLength(0);
    expect(getSyncStatus().state).toBe('idle');
  });
});
