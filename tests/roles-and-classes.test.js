// Checks that the system matches the diagrams: permissions = use cases, the menu uses
// only real permissions, every role gets a home page, and every class has the
// methods drawn in the class diagram.
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MENU, ALL_PAGES, homeOf } from '../src/config/menu';

const sql = fs.readFileSync(path.resolve(__dirname, '../supabase/02_new_company_data.sql'), 'utf8');
const permissions = [...sql.matchAll(/^\s+\(\d+, '([^']+)', '(Administration|Stock|Sales|Purchasing|Service|Finance|Reports)'/gm)].map(m => m[1]);

describe('permissions (one per use case)', () => {
  it('there are 35 permissions (all use cases except Log in / Log out)', () => {
    expect(permissions).toHaveLength(35);
    expect(new Set(permissions).size).toBe(35);
  });
  it('every menu permission exists in the database', () => {
    const used = ALL_PAGES.flatMap(p => p.perms);
    for (const p of used) expect(permissions).toContain(p);
  });
  it('every permission opens at least one page', () => {
    const used = new Set(ALL_PAGES.flatMap(p => p.perms));
    for (const p of permissions) expect(used.has(p), p).toBe(true);
  });
});

describe('menu', () => {
  it('has no repeated page', () => {
    const paths = ALL_PAGES.map(p => p.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(MENU.length).toBeGreaterThan(0);
  });
  it('home page follows the permissions', () => {
    expect(homeOf(['View dashboard', 'Create sales order'])).toBe('/dashboard');
    expect(homeOf(['Create sales order'])).toBe('/sales-order');
    expect(homeOf(['View assigned jobs'])).toBe('/my-jobs');
    expect(homeOf([])).toBe('/no-access');
  });
});

// methods from the class diagram (Diagrams/new smaller version/2 - Class Diagram)
const CLASS_METHODS = {
  Permission: ['getAll', 'getByModule'],
  Role: ['create', 'update', 'delete', 'assignPermission', 'removePermission', 'getPermissions'],
  User: ['login', 'logout', 'resetPassword', 'changePassword', 'create', 'update', 'assignRole', 'deactivate', 'lockAccount', 'unlockAccount'],
  Technician: ['viewAssignedJobs', 'setAvailability', 'addSpecialisation', 'getAvailable'],
  Product: ['create', 'update', 'delete', 'search', 'checkStock', 'increaseStock', 'reduceStock', 'isLowStock'],
  StockAlert: ['create', 'resolve', 'getOpen'],
  StockMovement: ['recordIn', 'recordOut', 'recordAdjustment'],
  Supplier: ['create', 'update', 'delete', 'search', 'getProducts'],
  Customer: ['create', 'update', 'search', 'viewPurchaseHistory'],
  Discount: ['create', 'update', 'delete', 'validate', 'getRate'],
  SalesOrder: ['create', 'addItem', 'removeItem', 'calculateTotal', 'applyDiscount', 'save', 'cancel'],
  SalesOrderItem: ['calculateSubtotal'],
  Invoice: ['generate', 'markPaid', 'getOutstanding', 'isOverdue', 'sendReminder'],
  Warranty: ['create', 'isValid', 'checkStatus'],
  ReturnRequest: ['create', 'approve', 'reject', 'getPending'],
  Refund: ['checkAmount', 'process'],
  Quotation: ['request', 'enterPrice', 'accept', 'reject'],
  PurchaseOrder: ['create', 'addItem', 'calculateTotal', 'approve', 'reject', 'updateStatus', 'track'],
  PurchaseOrderItem: ['calculateSubtotal', 'receive'],
  Payment: ['record', 'checkAmount', 'viewAll'],
  CustomerPayment: ['pay', 'printReceipt'],
  SupplierPayment: ['recordCheque'],
  RepairNote: ['add', 'getByJob'],
  SparePartRequest: ['request', 'issue'],
  ServiceJob: ['register', 'assignTechnician', 'updateStatus', 'complete', 'viewHistory'],
  Report: ['generate', 'calculateTotals', 'export'],
};

describe('classes match the class diagram', () => {
  for (const [name, methods] of Object.entries(CLASS_METHODS)) {
    it(name, async () => {
      const cls = (await import(`../src/classes/${name}.js`)).default;
      for (const m of methods) expect(typeof cls[m], `${name}.${m}()`).toBe('function');
    });
  }
  it('Category class exists', async () => {
    expect((await import('../src/classes/Category.js')).default).toBeTruthy();
  });
});

describe('reports', () => {
  it('has at least 5 reports, each under one of the 3 report use cases', async () => {
    const { REPORTS, reportOfType } = await import('../src/classes/Report.js');
    expect(REPORTS.length).toBeGreaterThanOrEqual(5);
    const perms = ['Generate business report', 'Generate stock report', 'Generate financial report'];
    for (const r of REPORTS) { expect(perms).toContain(r.perm); expect(r.name.length).toBeLessThanOrEqual(30); }
    for (const p of perms) expect(REPORTS.filter(r => r.perm === p).length).toBeGreaterThanOrEqual(3);
    expect(new Set(REPORTS.map(r => r.key)).size).toBe(REPORTS.length);
    // a saved report_type opens the right report again (old rows saved only the group name)
    expect(reportOfType('Stock movement report').key).toBe('stock-movement');
    expect(reportOfType('Financial').group).toBe('Financial');
  });
});
