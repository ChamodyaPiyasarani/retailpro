// ============================================================
// Report sample data (dummy history for the last 6 months)
// Used only by the Reports page so that grouped management
// reports have enough rows. The same numbers come out every
// time (seeded), so the reports look the same in the viva.
// ============================================================
import { format, subMonths, setDate } from 'date-fns';
import { PRODUCTS, CUSTOMERS, SUPPLIERS } from './mockData';

// Small seeded random number generator (mulberry32)
function seeded(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = seeded(20261102);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (min, max) => min + Math.floor(rnd() * (max - min + 1));
const dayInMonth = (monthsBack) => {
  const base = subMonths(new Date(), monthsBack);
  const maxDay = monthsBack === 0 ? Math.max(1, new Date().getDate() - 1) : 28;
  return format(setDate(base, int(1, maxDay)), 'yyyy-MM-dd');
};

// ---------- Sales lines (one row = one product on an invoice) ----------
const METHODS = ['cash', 'cash', 'card', 'card', 'transfer', 'credit'];
export const SALES_HISTORY = [];
let inv = 1;
for (let m = 5; m >= 0; m--) {
  const invoices = 6 + int(0, 4) + (5 - m);           // business grows a little each month
  for (let i = 0; i < invoices; i++) {
    const date = dayInMonth(m);
    const customer = rnd() < 0.25 ? null : pick(CUSTOMERS);
    const method = customer ? pick(METHODS) : pick(METHODS.slice(0, 5));
    const lines = int(1, 2);
    for (let l = 0; l < lines; l++) {
      const p = pick(PRODUCTS);
      const qty = p.price < 20000 ? int(1, 4) : 1;
      const discount = rnd() < 0.3 ? Math.round(p.price * qty * 0.03 / 100) * 100 : 0;
      const total = p.price * qty - discount;
      const paid = method === 'credit' ? Math.round(total * pick([0, 0.5, 1]) / 100) * 100 : total;
      SALES_HISTORY.push({
        invoiceNo: `INV-H${String(inv).padStart(3, '0')}`, date, month: date.slice(0, 7),
        customerId: customer?.id || null, productId: p.id, category: p.category,
        qty, unitPrice: p.price, unitCost: p.cost, discount, total, method, paid, balance: total - paid,
      });
    }
    inv++;
  }
}

// ---------- Service jobs ----------
const TECHS = ['Ruwan Jayasena', 'Kasun Wijesinghe', 'Ishara Nanayakkara'];
const SERVICE_TYPES = [
  { type: 'repair', fee: [3500, 12000] },
  { type: 'installation', fee: [5000, 15000] },
  { type: 'maintenance', fee: [2500, 7500] },
];
export const SERVICE_HISTORY = [];
for (let i = 1; i <= 34; i++) {
  const m = int(0, 5);
  const t = pick(SERVICE_TYPES);
  const status = m > 0 ? (rnd() < 0.9 ? 'completed' : 'cancelled') : pick(['completed', 'in-progress', 'assigned', 'open']);
  const warranty = t.type === 'repair' && rnd() < 0.4;
  SERVICE_HISTORY.push({
    id: `JOB-H${String(i).padStart(3, '0')}`, date: dayInMonth(m), type: t.type, status,
    technician: pick(TECHS), warranty, fee: warranty ? 0 : Math.round(int(t.fee[0], t.fee[1]) / 500) * 500,
    days: status === 'completed' ? int(1, 6) : null,
  });
}

// ---------- Purchases ----------
export const PURCHASE_HISTORY = [];
for (let i = 1; i <= 22; i++) {
  const m = int(0, 5);
  const s = pick(SUPPLIERS);
  const items = PRODUCTS.filter(p => p.supplierId === s.id);
  const p = pick(items.length ? items : PRODUCTS);
  const qty = p.cost < 20000 ? int(10, 30) : int(2, 6);
  const total = p.cost * qty;
  const status = m === 0 ? pick(['received', 'approved', 'ordered']) : 'received';
  const paid = status === 'received' && (m > 1 || rnd() < 0.5);
  PURCHASE_HISTORY.push({
    id: `PO-H${String(i).padStart(3, '0')}`, date: dayInMonth(m), supplierId: s.id, productId: p.id,
    qty, total, status, onTime: rnd() < 0.8, paid,
  });
}

// ---------- Helpers ----------
export const groupBy = (rows, keyFn) => rows.reduce((acc, r) => {
  const k = keyFn(r);
  (acc[k] = acc[k] || []).push(r);
  return acc;
}, {});
export const sum = (rows, fn) => rows.reduce((a, r) => a + (fn(r) || 0), 0);
export const lastSixMonths = () => Array.from({ length: 6 }, (_, i) => {
  const dt = subMonths(new Date(), 5 - i);
  return { key: format(dt, 'yyyy-MM'), label: format(dt, 'MMM yyyy'), short: format(dt, 'MMM') };
});
