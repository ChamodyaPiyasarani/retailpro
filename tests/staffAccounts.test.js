// Unit tests: creating staff accounts (src/lib/staffAccounts.js) and the demo accounts on the login page
import { describe, test, expect, beforeEach, vi } from 'vitest';

const m = vi.hoisted(() => ({
  signUp: null,          // set per test
  updateResult: { error: null, data: [{ user_id: 'x' }] },
  calls: [],
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { signUp: (args) => { m.calls.push({ signUp: args }); return Promise.resolve(m.signUp(args)); } } }),
}));
vi.mock('../src/lib/supabaseClient', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (table) => ({
      update: (changes) => ({
        eq: (col, val) => {
          m.calls.push({ table, changes, where: { [col]: val } });
          const res = Promise.resolve(m.updateResult);
          res.select = () => Promise.resolve(m.updateResult);
          return res;
        },
      }),
    }),
  },
}));

const { createStaffAccount, updateStaffProfile } = await import('../src/lib/staffAccounts');
const { DEMO_ACCOUNTS } = await import('../src/config/demoAccounts');

beforeEach(() => {
  m.calls = [];
  m.updateResult = { error: null, data: [{ user_id: 'x' }] };
  m.signUp = () => ({ data: { user: { id: 'uuid-1', identities: [{}] }, session: null }, error: null });
});

describe('createStaffAccount', () => {
  const staff = { name: 'Ishara', email: ' tech3@gmail.com ', password: '123456', role: 'technician' };

  test('creates the account and saves the role on the profile', async () => {
    const r = await createStaffAccount(staff);
    expect(r).toEqual({ ok: true, authId: 'uuid-1', needsConfirmation: true });
    expect(m.calls[0].signUp.email).toBe('tech3@gmail.com');                     // spaces removed
    expect(m.calls[0].signUp.options.data.full_name).toBe('Ishara');
    expect(m.calls[1]).toEqual({ table: 'user', changes: { full_name: 'Ishara', user_type: 'technician', is_active: true, is_locked: false }, where: { user_id: 'uuid-1' } });
  });
  test('no e-mail confirmation needed when Supabase returns a session', async () => {
    m.signUp = () => ({ data: { user: { id: 'u2', identities: [{}] }, session: {} }, error: null });
    expect((await createStaffAccount(staff)).needsConfirmation).toBe(false);
  });
  test.each(['', '12345', null])('password "%s" is too short', async (pw) => {
    const r = await createStaffAccount({ ...staff, password: pw });
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/at least 6/);
    expect(m.calls).toHaveLength(0);
  });
  test('an e-mail that is already registered is refused', async () => {
    m.signUp = () => ({ data: { user: { id: 'u3', identities: [] }, session: null }, error: null });
    const r = await createStaffAccount(staff);
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/already exists/);
  });
  test('a Supabase Auth error is shown', async () => {
    m.signUp = () => ({ data: {}, error: { message: 'Invalid email' } });
    expect(await createStaffAccount(staff)).toEqual({ ok: false, message: 'Invalid email' });
  });
  test('the account is made but the role could not be saved', async () => {
    m.updateResult = { error: { message: 'permission denied' } };
    const r = await createStaffAccount(staff);
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/role could not be saved: permission denied/);
  });
});

describe('updateStaffProfile', () => {
  test('updates the profile found by e-mail', async () => {
    const r = await updateStaffProfile(' cashier@gmail.com ', { is_locked: true });
    expect(r).toEqual({ ok: true, found: true });
    expect(m.calls[0]).toEqual({ table: 'user', changes: { is_locked: true }, where: { email: 'cashier@gmail.com' } });
  });
  test('reports when no profile has that e-mail', async () => {
    m.updateResult = { error: null, data: [] };
    expect(await updateStaffProfile('nobody@x.lk', { is_locked: true })).toEqual({ ok: true, found: false });
  });
  test('reports a database error', async () => {
    m.updateResult = { error: { message: 'boom' }, data: null };
    expect(await updateStaffProfile('a@b.lk', {})).toEqual({ ok: false, message: 'boom' });
  });
});

describe('demo accounts on the login page', () => {
  test('one account for each of the six roles', () => {
    expect(DEMO_ACCOUNTS).toHaveLength(6);
    expect(new Set(DEMO_ACCOUNTS.map(a => a.label)).size).toBe(6);
    expect(new Set(DEMO_ACCOUNTS.map(a => a.email)).size).toBe(6);
  });
  test('the removed technician account (Kasun) is not offered', () => {
    expect(DEMO_ACCOUNTS.some(a => /kasun|tech2/i.test(a.email + a.label))).toBe(false);
  });
  test('every e-mail is valid', () => {
    for (const a of DEMO_ACCOUNTS) expect(a.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});
