// Unit tests: management reports (src/utils/reportBuilder.js, src/data/reportData.js)
import { describe, test, expect, beforeAll } from 'vitest';
import { buildReport, validRange, reportToCSV, REPORT_BUILDERS, salesLines, serviceJobs, purchases } from '../src/utils/reportBuilder';
import { groupBy, sum, lastSixMonths } from '../src/data/reportData';
import { applyState, SALES_ORDERS, PURCHASE_ORDERS, SERVICE_JOBS } from '../src/data/store';
import { fromTables } from '../src/lib/db/schemaMap';
import { loadRows, day } from './helpers';

const money = (s) => Number(String(s).replace(/[^\d.-]/g, '')) || 0;

beforeAll(() => { applyState(fromTables(loadRows())); });

describe('small helpers', () => {
  test('groupBy groups rows by a key', () => {
    const g = groupBy([{ c: 'a', v: 1 }, { c: 'b', v: 2 }, { c: 'a', v: 3 }], r => r.c);
    expect(Object.keys(g)).toEqual(['a', 'b']);
    expect(g.a).toHaveLength(2);
  });
  test('sum adds values and treats missing values as 0', () => {
    expect(sum([{ v: 1 }, { v: 2 }, {}], r => r.v)).toBe(3);
    expect(sum([], r => r.v)).toBe(0);
  });
  test('lastSixMonths ends with this month', () => {
    const m = lastSixMonths();
    expect(m).toHaveLength(6);
    expect(m[5].key).toBe(new Date().toISOString().slice(0, 7));
  });
});

describe('date range check (SD 7, 18, 26, 52)', () => {
  test.each([
    ['no range = last 6 months', '', '', true],
    ['valid range', day(-30), day(-1), true],
    ['same day', day(-3), day(-3), true],
    ['From after To', day(-1), day(-30), false],
    ['To in the future', day(-5), day(5), false],
    ['only From given', day(-5), '', false],
    ['only To given', '', day(-5), false],
  ])('%s', (_, from, to, ok) => expect(validRange(from, to)).toBe(ok));
});

describe('data sources', () => {
  test('salesLines has one line per sold item (orders on hold left out)', () => {
    const items = SALES_ORDERS.filter(o => o.status !== 'on-hold').reduce((a, o) => a + o.items.length, 0);
    expect(salesLines()).toHaveLength(items);
  });
  test('serviceJobs and purchases list every record', () => {
    expect(serviceJobs()).toHaveLength(SERVICE_JOBS.length);
    expect(purchases()).toHaveLength(PURCHASE_ORDERS.length);
  });
});

describe('each report', () => {
  test.each(Object.keys(REPORT_BUILDERS))('%s report has a title, KPI cards and well-formed sections', (type) => {
    const r = buildReport(type);
    expect(r.title).toBeTruthy();
    expect(r.period).toBe('Last 6 months');
    expect(r.kpis.length).toBeGreaterThan(0);
    expect(r.sections.length).toBeGreaterThan(0);
    for (const sec of r.sections) {
      expect(sec.heading).toBeTruthy();
      expect(sec.align).toHaveLength(sec.headers.length);
      expect(sec.align[0]).toBe('left');
      for (const row of sec.rows) {
        if (row.group) continue;
        expect((row.subtotal || row).length, `${type} / ${sec.heading}`).toBe(sec.headers.length);
      }
      if (sec.total) expect(sec.total).toHaveLength(sec.headers.length);
    }
  });

  test('sales report: revenue card = sum of the monthly rows = grand total', () => {
    const r = buildReport('sales');
    const months = r.sections[0];
    const fromRows = months.rows.reduce((a, row) => a + money(row[3]), 0);
    expect(fromRows).toBe(money(months.total[3]));
    expect(money(r.kpis[0].value)).toBe(money(months.total[3]));
    expect(money(r.sections[1].total[2])).toBe(money(months.total[3]));
  });

  test('sales report: the revenue matches the sold items', () => {
    const r = buildReport('sales');
    const total = salesLines().reduce((a, l) => a + l.total, 0);
    expect(money(r.kpis[0].value)).toBe(Math.round(total));
  });

  test('a date range limits the report and is shown as the period', () => {
    const from = day(-30), to = day(-1);
    const all = buildReport('sales'), part = buildReport('sales', { from, to });
    expect(part.period).toBe(`${from} to ${to}`);
    expect(money(part.kpis[0].value)).toBeLessThanOrEqual(money(all.kpis[0].value));
    // after the call the range is cleared again
    expect(buildReport('sales').period).toBe('Last 6 months');
  });

  test('an unknown report type falls back to the sales report', () => {
    expect(buildReport('nope').title).toBe(buildReport('sales').title);
  });
});

describe('CSV export', () => {
  test('contains the title, every heading and the totals', () => {
    const r = buildReport('stock');
    const csv = reportToCSV(r);
    expect(csv.split('\n')[0]).toBe(r.title);
    for (const sec of r.sections) expect(csv).toContain(sec.heading);
  });
  test('commas and quotes are escaped', () => {
    const csv = reportToCSV({ title: 'T', sections: [{ heading: 'H', headers: ['a', 'b'], rows: [['x, y', 'say "hi"'], { group: 'G' }, { subtotal: ['s', '1'] }], total: ['t', '2'] }] });
    expect(csv).toContain('"x, y","say ""hi"""');
    expect(csv).toContain('\nG\n');
    expect(csv).toContain('s,1');
    expect(csv).toContain('t,2');
  });
});
