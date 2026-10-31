// Small helpers used by the Reports page (grouping and totals).
// All report figures come from the records loaded from Supabase.
import { format, subMonths } from 'date-fns';

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
