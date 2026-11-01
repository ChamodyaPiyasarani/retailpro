// Unit tests: what each role sees on the dashboard (src/pages/DashboardPage.jsx)
import { describe, test, expect } from 'vitest';
import { DASHBOARD_VIEW } from '../src/pages/DashboardPage.jsx';
import { PERMISSIONS } from '../src/config/defaultPermissions.js';

describe('dashboard per role', () => {
  test('every role that can open the dashboard has its own view', () => {
    for (const role of Object.keys(PERMISSIONS).filter(r => PERMISSIONS[r].includes('dashboard'))) expect(DASHBOARD_VIEW[role]).toBeTruthy();
  });
  test('only the Admin / Manager gets the overall system dashboard (use case "View overall system dashboard")', () => {
    expect(Object.keys(DASHBOARD_VIEW).filter(r => DASHBOARD_VIEW[r].overall)).toEqual(['admin']);
    expect(DASHBOARD_VIEW.admin.cards).toHaveLength(8);
  });
  test('company revenue and payments are shown only to the manager and finance', () => {
    const who = k => Object.keys(DASHBOARD_VIEW).filter(r => DASHBOARD_VIEW[r].cards.includes(k)).sort();
    expect(who('revenue')).toEqual(['admin', 'finance']);
    expect(who('payments')).toEqual(['admin', 'finance']);
  });
  test('the technician sees only his own jobs', () => {
    expect(DASHBOARD_VIEW.technician.cards).toEqual(['jobs']);
    expect(DASHBOARD_VIEW.technician.charts).toBe(false);
  });
});
