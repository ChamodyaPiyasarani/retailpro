import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { USERS, ROLES, AUDIT_LOG } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// Turn a role name from the database ("Sales Staff / Cashier", "storekeeper"...) into the app's role key
const roleKeyFrom = (name) => {
  const n = (name || '').toLowerCase();
  if (!n) return null;
  if (n.includes('admin') || (n.includes('manager') && !n.includes('purchas') && !n.includes('financ'))) return 'admin';
  if (n.includes('sales') || n.includes('cashier')) return 'sales';
  if (n.includes('store')) return 'storekeeper';
  if (n.includes('purchas')) return 'purchase';
  if (n.includes('financ')) return 'finance';
  if (n.includes('tech') || n.includes('engineer')) return 'technician';
  return ROLES[n] ? n : null;
};

const auditLogin = (u) => AUDIT_LOG.unshift({
  id: `AL${Date.now()}`, action: 'LOGIN', userId: u.id,
  detail: `${u.name} (${ROLES[u.role]?.label || u.role}) signed in successfully`,
  timestamp: new Date().toISOString(),
});

const AuthContext = createContext(null);

// Role-based permission map strictly aligned with the system Use-Case Specification
export const PERMISSIONS = {
  admin: [
    'dashboard', 'users', 'settings', 'reports',
    'customers', 'products', 'categories', 'stock', 'stock-movements', 'stock-adjustments',
    'sales', 'pos', 'invoices',
    'suppliers', 'purchase-orders',
    'service-jobs', 'service-history',
    'returns', 'complaints', 'warranty',
    'payments', 'payables', 'finance-reports',
  ],
  sales: [
    'dashboard', 'pos', 'sales', 'invoices', 'customers',
    'products', 'stock', 'warranty', // Check product warranty status
    'service-jobs', // Register installation / delivery request linked to sales order
    'returns', 'complaints', // Process exchange request, check warranty, process refund, log complaints
    'reports', // Generate sales report
  ],
  storekeeper: [
    'dashboard',
    'products', 'categories', // Add / update product info, categorise product, track serials
    'stock', 'stock-movements', 'stock-adjustments', // Real-time stock, low stock alert, stock in/out, verify consistency
    'service-jobs', // Issue spare parts for service job
    'returns', // Receive returned/exchanged items, inspect condition, update stock or write off
    'reports', // Generate stock report
  ],
  purchase: [
    'dashboard',
    'suppliers', // Manage supplier info, view supplier history & performance
    'purchase-orders', // Create PO, select supplier/quote, track status, receive stock into inventory, urgent reorder
    'products', 'stock', // View stock to reorder frequently exchanged products
    'reports', // Purchasing & inventory reports
  ],
  finance: [
    'dashboard',
    'payments', 'payables', // Manage customer & supplier payments, payment history, refund payments, reconcile sales/purchases
    'invoices', // Track outstanding invoices, send payment reminder, flag overdue
    'returns', // Process approved refund payment
    'customers', // Approve credit limits for customers
    'sales', // View financial order transactions & dues
    'service-jobs', // Track service job billing
    'reports', // Generate financial reports, real-time analytics
  ],
  technician: [
    'dashboard',
    'service-jobs', // View assigned jobs, installation completion, log maintenance visit, repair/fault details, request spare parts, recommend exchange
    'service-history', // View service visit history
    'products', 'stock', // View spare parts inventory
  ],
};

// Action-level permissions: which BUTTONS each role may use (from the proposed use case diagram).
// Pages a role can open are in PERMISSIONS; inside a page, a button shows only if its action is listed here.
export const ACTIONS = {
  admin: [ // supervisory: approve, assign, review
    'product.add', 'product.edit',
    'service.create', 'service.assign',
    'return.approve', 'complaint.escalate', 'complaint.resolve',
    'user.manage', 'settings.manage', 'report.export', 'report.schedule',
  ],
  sales: [
    'sale.create',
    'customer.add', 'customer.edit', 'customer.delete',
    'service.create',
    'return.create', 'complaint.create', 'complaint.escalate',
    'report.export',
  ],
  storekeeper: [
    'product.add', 'product.edit', 'product.delete',
    'stock.adjust', 'stock.verify', 'stock.alert',
    'service.issueParts', 'return.inspect',
    'report.export',
  ],
  purchase: [
    'po.create', 'po.receive', 'po.approve', 'po.edit', 'po.reorder', 'quote.request',
    'supplier.add', 'supplier.edit',
    'report.export',
  ],
  finance: [
    'payment.record', 'payment.remind', 'payment.flagOverdue', 'payable.pay',
    'refund.pay', 'customer.edit', // customer.edit = approve credit limit
    'service.bill', 'payment.reconcile', 'report.schedule',
    'report.export',
  ],
  technician: [
    'service.updateStatus', 'service.logVisit', 'service.recordRepair',
  ],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load the staff profile (user + role tables) for a Supabase Auth user
  const loadProfile = useCallback(async (authUser) => {
    const { data: profile, error: pErr } = await supabase
      .from('user')
      .select('user_id, full_name, email, is_active, is_locked, user_type, role:role_id ( role_name )')
      .eq('user_id', authUser.id)
      .maybeSingle();
    if (pErr) return { error: 'Could not load your staff profile. ' + pErr.message };
    if (profile && (profile.is_locked || profile.is_active === false)) {
      return { error: 'Your account has been locked by Administrator. Contact management.' };
    }
    // demo record with the same e-mail keeps the links to the sample data (orders, jobs...)
    const demo = USERS.find(u => u.email.toLowerCase() === (authUser.email || '').toLowerCase());
    const role = roleKeyFrom(profile?.role?.role_name) || roleKeyFrom(profile?.user_type) || demo?.role;
    if (!role) return { error: 'No role is assigned to this account. Ask the Administrator to assign one.' };
    return {
      user: {
        ...(demo || {}),
        id: demo?.id || authUser.id,
        authId: authUser.id,
        name: profile?.full_name || demo?.name || authUser.email,
        email: authUser.email,
        avatar: demo?.avatar || '👤',
        role,
        source: 'supabase',
        permissions: PERMISSIONS[role] || [],
      },
    };
  }, []);

  // Keep the user signed in after a page refresh (Supabase session)
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled || !data?.session?.user) return;
      const res = await loadProfile(data.session.user);
      if (!cancelled && res.user) setUser(res.user);
    });
    return () => { cancelled = true; };
  }, [loadProfile]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    const fail = (message) => { setError(message); setLoading(false); return { success: false, message }; };

    // 1) Supabase Auth (used when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set)
    if (isSupabaseConfigured) {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authErr) return fail(authErr.message === 'Invalid login credentials' ? 'Invalid email or password.' : authErr.message);
      const res = await loadProfile(data.user);
      if (res.error) { await supabase.auth.signOut(); return fail(res.error); }
      await supabase.from('user').update({ last_login_at: new Date().toISOString() }).eq('user_id', data.user.id);
      setUser(res.user);
      auditLogin(res.user);
      setLoading(false);
      return { success: true };
    }

    // 2) Demo mode (no Supabase keys): check the sample users
    await new Promise(r => setTimeout(r, 300));
    const found = USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) return fail('User account not found. Please check your email.');
    if (!found.active) return fail('Your account has been locked by Administrator. Contact management.');
    if (found.password !== password) return fail('Invalid password. Check credentials or use Reset Password.');
    const sessionUser = { ...found, source: 'demo', permissions: PERMISSIONS[found.role] || [] };
    setUser(sessionUser);
    auditLogin(sessionUser);
    setLoading(false);
    return { success: true };
  }, [loadProfile]);

  const logout = useCallback(() => {
    if (user) {
      AUDIT_LOG.unshift({
        id: `AL${Date.now()}`,
        action: 'LOGOUT',
        userId: user.id,
        detail: `${user.name} logged out`,
        timestamp: new Date().toISOString(),
      });
    }
    if (isSupabaseConfigured) supabase.auth.signOut();
    setUser(null);
  }, [user]);

  const resetPassword = useCallback(async (email, newPassword) => {
    // Supabase: send a password-reset e-mail (resetPasswordForEmail)
    if (isSupabaseConfigured) {
      const { error: rErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + window.location.pathname,
      });
      if (rErr) return { success: false, message: rErr.message };
      return { success: true, message: 'A password reset link has been sent to your e-mail.' };
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const found = USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (found) {
      found.password = newPassword;
      AUDIT_LOG.unshift({
        id: `AL${Date.now()}`,
        action: 'PASSWORD_RESET',
        userId: found.id,
        detail: `Password reset successfully for ${found.name} (${found.email})`,
        timestamp: new Date().toISOString(),
      });
      setLoading(false);
      return { success: true, message: 'Password has been reset successfully' };
    }
    setLoading(false);
    return { success: false, message: 'No registered user found with that email' };
  }, []);

  const can = useCallback((permission) => {
    if (!user) return false;
    return user.permissions.includes(permission);
  }, [user]);

  // canDo('stock.adjust') -> true only if the logged-in role may use that button
  const canDo = useCallback((action) => {
    if (!user) return false;
    return (ACTIONS[user.role] || []).includes(action);
  }, [user]);

  const roleInfo = user ? ROLES[user.role] : null;

  return (
    <AuthContext.Provider value={{ user, login, logout, resetPassword, can, canDo, loading, error, roleInfo, authMode: isSupabaseConfigured ? 'supabase' : 'demo' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
