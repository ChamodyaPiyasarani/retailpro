// Unit tests: how app records are turned into database rows and back (src/lib/db/schemaMap.js)
import { describe, test, expect, beforeEach } from 'vitest';
import {
  idNum, toCode, roleKeyFrom, defaultRoles, ROLE_LABELS, toTables, fromTables, PK, TABLE_ORDER, LOAD_TABLES, E,
} from '../src/lib/db/schemaMap';
import { loadRows, norm } from './helpers';

let R;
beforeEach(() => { R = loadRows(); });

describe('id helpers', () => {
  test('idNum reads the number at the end of a code', () => {
    expect(idNum('P001')).toBe(1);
    expect(idNum('SO-062')).toBe(62);
    expect(idNum('INV-2026-007')).toBe(7);
    expect(idNum(15)).toBe(15);
  });
  test('idNum returns null for empty or text without a number', () => {
    expect(idNum(null)).toBeNull();
    expect(idNum(undefined)).toBeNull();
    expect(idNum('')).toBeNull();
    expect(idNum('walk-in')).toBeNull();
  });
  test('toCode builds the app code from a key', () => {
    expect(toCode('P', 1)).toBe('P001');
    expect(toCode('JOB-', 38)).toBe('JOB-038');
    expect(toCode('SO-', 1234)).toBe('SO-1234');
    expect(toCode('RS', 2, 3)).toBe('RS002');
    expect(toCode('P', null)).toBeNull();
  });
  test('toCode and idNum are the reverse of each other', () => {
    for (const n of [1, 9, 10, 99, 100, 5000]) expect(idNum(toCode('C', n))).toBe(n);
  });
});

describe('roles', () => {
  test('roleKeyFrom understands every role name used in the database', () => {
    expect(roleKeyFrom('Admin / Manager')).toBe('admin');
    expect(roleKeyFrom('Sales Staff / Cashier')).toBe('sales');
    expect(roleKeyFrom('Storekeeper')).toBe('storekeeper');
    expect(roleKeyFrom('Purchasing Manager')).toBe('purchase');
    expect(roleKeyFrom('Finance Manager')).toBe('finance');
    expect(roleKeyFrom('Technician / Service Engineer')).toBe('technician');
    expect(roleKeyFrom('technician')).toBe('technician');
  });
  test('roleKeyFrom returns null for unknown or empty names', () => {
    expect(roleKeyFrom('')).toBeNull();
    expect(roleKeyFrom(null)).toBeNull();
    expect(roleKeyFrom('Gardener')).toBeNull();
  });
  test('defaultRoles has the six roles, active, not yet linked to the database', () => {
    const r = defaultRoles();
    expect(Object.keys(r)).toEqual(Object.keys(ROLE_LABELS));
    expect(Object.keys(r)).toHaveLength(6);
    for (const v of Object.values(r)) { expect(v.active).toBe(true); expect(v.dbId).toBeNull(); }
  });
});

describe('table lists', () => {
  test('every table has a primary key', () => {
    for (const t of TABLE_ORDER) expect(PK[t], t).toBeTruthy();
  });
  test('every table the app reads is also written', () => {
    for (const t of LOAD_TABLES) expect(TABLE_ORDER).toContain(t);
  });
  test('a table is written after the tables it points to', () => {
    const before = (a, b) => expect(TABLE_ORDER.indexOf(a), `${a} before ${b}`).toBeLessThan(TABLE_ORDER.indexOf(b));
    before('role', 'user'); before('user', 'technician'); before('technician', 'technician_specialisation');
    before('category', 'product'); before('supplier', 'product'); before('product', 'batch');
    before('customer', 'sales_order'); before('sales_order', 'sales_order_item'); before('product', 'sales_order_item');
    before('supplier', 'purchase_order'); before('purchase_order', 'purchase_order_item'); before('purchase_order', 'payable');
    before('customer', 'service_job'); before('product', 'service_job'); before('service_job', 'service_visit_log');
    before('sales_order', 'invoice'); before('invoice', 'payment'); before('payment', 'transaction');
    before('exchange_request', 'refund'); before('payment', 'refund'); before('user', 'audit_log');
  });
  test('technician_specialisation has a two-column key (multivalued attribute)', () => {
    expect(PK.technician_specialisation).toEqual(['technician_id', 'specialisation']);
  });
});

describe('database -> app (fromTables)', () => {
  test('loads all company records', () => {
    const s = fromTables(R);
    expect(s.products).toHaveLength(R.product.length);
    expect(s.customers).toHaveLength(R.customer.length);
    expect(s.suppliers).toHaveLength(R.supplier.length);
    expect(s.salesOrders).toHaveLength(R.sales_order.length);
    expect(s.purchaseOrders).toHaveLength(R.purchase_order.length);
    expect(s.serviceJobs).toHaveLength(R.service_job.length);
    expect(s.users).toHaveLength(R.user.filter(u => u.is_active).length);
  });
  test('app codes are made from the primary keys', () => {
    const s = fromTables(R);
    expect(s.products[0].id).toBe('P001');
    expect(s.salesOrders.map(o => o.id)).toContain('SO-001');
    expect(s.serviceJobs.map(j => j.id)).toContain('JOB-001');
    expect(s.categories[0].id).toBe('CAT001');
  });
  test('numbers stored as text become numbers', () => {
    const s = fromTables(R);
    const p = s.products.find(x => x.id === 'P001');
    expect(typeof p.price).toBe('number');
    expect(p.price).toBe(185000);
    expect(s.suppliers[0].rating).toBe(4.5);              // NUMERIC(2,1)
    expect(s.suppliers[0].paymentTerms).toBe(30);         // INTEGER days
  });
  test('technician skills come from technician_specialisation (one row per skill)', () => {
    const s = fromTables(R);
    const tech = s.users.find(u => u.role === 'technician');
    expect(tech.technicianId).toBe(1);
    expect(tech.skills.sort()).toEqual(['installation', 'maintenance', 'repair']);
  });
  test('roles are linked to their database rows', () => {
    const s = fromTables(R);
    for (const k of Object.keys(ROLE_LABELS)) expect(s.roles[k].dbId, k).toBeTruthy();
  });
  test('order lines, visits and settings are attached', () => {
    const s = fromTables(R);
    const lines = s.salesOrders.reduce((a, o) => a + o.items.length, 0);
    expect(lines).toBe(R.sales_order_item.length);
    const visits = s.serviceJobs.reduce((a, j) => a + j.visits.length, 0);
    expect(visits).toBe(R.service_visit_log.length);
    expect(s.settings.technicianMaxJobs).toBe(3);
    expect(s.settings.enableWarrantyCheck).toBe(true);
    expect(s.settings.businessName).toBe('Rajida Holdings (Pvt) Ltd');
  });
  test('customer and supplier payments are separated', () => {
    const s = fromTables(R);
    const sup = R.payment.filter(p => p.payment_type === 'supplier').length;
    expect(s.supplierPayments).toHaveLength(sup);
    expect(s.payments).toHaveLength(R.payment.length - sup);
  });
  test('a locked user is shown as inactive, a deleted user is not loaded', () => {
    R.user[1].is_locked = true;
    R.user[2].is_active = false;
    const s = fromTables(R);
    expect(s.users.find(u => u.id === R.user[1].user_id).active).toBe(false);
    expect(s.users.find(u => u.id === R.user[2].user_id)).toBeUndefined();
  });
});

describe('app -> database (toTables)', () => {
  // Every table: loading the company data and writing it back gives the same rows (nothing lost or changed)
  test.each(TABLE_ORDER)('round trip keeps every row and column of %s', (t) => {
    const T = toTables(fromTables(R));
    const key = (r) => [].concat(PK[t]).map(c => r[c]).join('|');
    const db = new Map((R[t] || []).map(r => [key(r), r]));
    const app = new Map((T[t] || []).map(r => [key(r), r]));
    expect([...app.keys()].sort()).toEqual([...db.keys()].sort());
    for (const [k, row] of app) {
      for (const c of Object.keys(row)) expect(norm(row[c]), `${t} ${k} ${c}`).toEqual(norm(db.get(k)[c]));
    }
  });

  test('uses the File Design column names', () => {
    const T = toTables(fromTables(R));
    expect(T.sales_order[0]).toHaveProperty('sales_order_id');
    expect(T.sales_order[0]).toHaveProperty('user_id');
    expect(T.service_job[0]).toHaveProperty('service_job_id');
    expect(T.exchange_request[0]).toHaveProperty('exchange_request_id');
    expect(T.technician[0]).not.toHaveProperty('specialisation');
    expect(T.supplier[0]).not.toHaveProperty('outstanding_amount');
  });

  test('a new technician gets a new number and his own skills', () => {
    const s = fromTables(R);
    s.users.push({ id: 'new-tech-uuid', name: 'Saman Perera', email: 'saman@x.lk', role: 'technician', skills: ['repair', 'installation'], active: true });
    const T = toTables(s);
    const row = T.technician.find(t => t.user_id === 'new-tech-uuid');
    expect(row.technician_id).toBe(2);
    expect(T.technician_specialisation.filter(x => x.technician_id === 2).map(x => x.specialisation)).toEqual(['repair', 'installation']);
  });

  test('a new technician never reuses the number of a technician who left', () => {
    // technician 1's account is deleted (not loaded) - his old jobs still point to number 1
    R.user.find(u => u.user_type === 'technician').is_active = false;
    const s = fromTables(R);
    s.users.push({ id: 'saman', name: 'Saman', email: 's@x.lk', role: 'technician', skills: ['repair'] });
    const T = toTables(s);
    expect(T.technician.find(t => t.user_id === 'saman').technician_id).toBe(2);
    expect(T.service_job.filter(j => j.technician_id === 2)).toHaveLength(0);
  });

  test('removing a skill removes only that row', () => {
    const s = fromTables(R);
    const tech = s.users.find(u => u.role === 'technician');
    tech.skills = tech.skills.filter(x => x !== 'maintenance');
    const T = toTables(s);
    expect(T.technician_specialisation.map(x => x.specialisation).sort()).toEqual(['installation', 'repair']);
  });

  test('a reference to an unknown record is kept as text in details', () => {
    const s = fromTables(R);
    s.salesOrders[0].customerId = 'C999';
    const row = toTables(s).sales_order.find(o => o.sales_order_id === 1);
    expect(row.customer_id).toBeNull();
    expect(row.details.customerId).toBe('C999');
  });

  test('screen-only values go into details and come back', () => {
    const row = E.product.toRow({ id: 'P020', name: 'Test', emoji: '🧪', price: 10 }, { exists: () => false, user: () => null });
    expect(row.product_id).toBe(20);
    expect(row.details.emoji).toBe('🧪');
    const back = E.product.fromRow(row, { appUser: () => null });
    expect(back.emoji).toBe('🧪');
    expect(back.id).toBe('P020');
  });

  test('special key ranges: supplier payments, credit requests, child rows', () => {
    const s = fromTables(R);
    const T = toTables(s);
    for (const p of T.payment.filter(x => x.payment_type === 'supplier')) expect(p.payment_id).toBeGreaterThan(50000);
    for (const a of T.credit_account.filter(x => x.requested_limit !== null)) expect(a.account_id).toBeGreaterThan(1000);
    for (const it of T.sales_order_item) expect(Math.floor(it.item_id / 1000)).toBe(it.sales_order_id);
  });

  test('every customer has a credit account with the same number', () => {
    const T = toTables(fromTables(R));
    for (const c of T.customer) expect(T.credit_account.find(a => a.account_id === c.customer_id)).toBeTruthy();
  });

  test('a supplier payment lowers the amount owed on the payable', () => {
    const s = fromTables(R);
    const po = s.purchaseOrders.find(p => p.payableStatus && p.payableStatus !== 'none');
    const before = toTables(s).payable.find(p => p.po_id === idNum(po.id)).amount_due;
    s.supplierPayments.push({ id: 'SPAY-999', purchaseOrderId: po.id, supplierId: po.supplierId, amount: 1000, date: '2026-10-01', method: 'transfer' });
    const after = toTables(s).payable.find(p => p.po_id === idNum(po.id)).amount_due;
    expect(after).toBe(before - 1000);
  });

  test('a refund payment is a negative transaction', () => {
    const s = fromTables(R);
    s.payments.push({ id: 'PAY-500', amount: 2000, date: '2026-10-01', method: 'cash', note: 'Refund RET-001' });
    const tr = toTables(s).transaction.find(t => t.transaction_id === 500);
    expect(tr.amount).toBe(-2000);
    expect(tr.transaction_type).toBe('refund');
  });
});
