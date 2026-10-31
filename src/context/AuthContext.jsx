import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { USERS, ROLES, AUDIT_LOG, newAuditId } from '../data/store';
import { roleKeyFrom } from '../lib/db/schemaMap';
import { loadCompanyData, startAutoSave, closeCompanyData } from '../lib/db/sync';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const auditLogin = (u) => AUDIT_LOG.unshift({
  id: newAuditId(), action: 'LOGIN', userId: u.id,
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
    'po.approveEscalated', // approve purchase orders escalated above the approval limit
    'refund.adminApprove', // approve refunds above the refund approval limit
    'complaint.toServiceJob', // escalate an unresolved complaint to a service job
    'credit.approveEscalated', // approve credit limits above Finance's authority
  ],
  sales: [
    'sale.create',
    'customer.add', 'customer.edit', 'customer.delete',
    'service.create',
    'return.create', 'complaint.create', 'complaint.escalate',
    'refund.send', // send an approved refund to Finance
    'report.export',
  ],
  storekeeper: [
    'product.add', 'product.edit', 'product.delete',
    'stock.adjust', 'stock.verify', 'stock.alert',
    'service.issueParts', 'return.inspect',
    'stock.receive', 'stock.batch', 'product.obsolete',
    'report.export',
  ],
  purchase: [
    'po.create', 'po.receive', 'po.approve', 'po.edit', 'po.reorder', 'po.remind', 'quote.request', 'quote.price', 'supplier.rate',
    'supplier.add', 'supplier.edit', 'supplier.deactivate', // deactivate = soft delete (mark inactive)
    'report.export',
  ],
  finance: [
    'payment.record', 'payment.remind', 'payment.flagOverdue', 'payable.pay',
    'refund.pay', 'customer.edit', // customer.edit = approve credit limit
    'service.bill', 'payment.reconcile', 'report.schedule', 'credit.approve',
    'report.export',
  ],
  technician: [
    'service.updateStatus', 'service.logVisit', 'service.recordRepair', 'service.requestParts',
  ],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // true while a saved Supabase session is being restored after a page refresh
  const [restoring, setRestoring] = useState(isSupabaseConfigured);

  // Load the staff profile ("user" + role tables) for a Supabase Auth user,
  // then read all company data from the database
  const loadProfile = useCallback(async (authUser) => {
    const { data: profile, error: pErr } = await supabase
      .from('user').select('*').eq('user_id', authUser.id).maybeSingle();
    if (pErr) return { error: 'Could not load your staff profile. ' + pErr.message };
    if (!profile) return { error: 'No staff profile exists for this account. Ask the Administrator.' };
    if (profile.is_locked || profile.is_active === false) {
      return { error: 'Your account has been locked by Administrator. Contact management.' };
    }
    let roleName = null;
    if (profile.role_id) {
      const { data: r } = await supabase.from('role').select('role_name, is_active').eq('role_id', profile.role_id).maybeSingle();
      roleName = r?.role_name || null;
    }
    const role = roleKeyFrom(roleName) || roleKeyFrom(profile.user_type);
    if (!role) return { error: 'No role is assigned to this account. Ask the Administrator to assign one.' };
    try {
      await loadCompanyData();
    } catch (e) {
      return { error: 'Could not load the company data from the database. ' + e.message };
    }
    const me = USERS.find(u => u.id === authUser.id) || {};
    return {
      user: {
        ...me,
        id: authUser.id,
        authId: authUser.id,
        name: profile.full_name || authUser.email,
        email: authUser.email,
        avatar: me.avatar || '👤',
        role,
        source: 'supabase',
        permissions: PERMISSIONS[role] || [],
      },
    };
  }, []);

  // Keep the user signed in after a page refresh (Supabase session)
  useEffect(() => {
    if (!isSupabaseConfigured) { setRestoring(false); return; }
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      if (data?.session?.user) {
        const res = await loadProfile(data.session.user);
        if (!cancelled && res.user) { setUser(res.user); startAutoSave(); }
      }
      if (!cancelled) setRestoring(false);
    }).catch(() => { if (!cancelled) setRestoring(false); });
    return () => { cancelled = true; };
  }, [loadProfile]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    const fail = (message) => { setError(message); setLoading(false); return { success: false, message }; };
    if (!isSupabaseConfigured) return fail('The database is not connected. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the .env file.');

    // Supabase Auth checks the e-mail and password
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authErr) {
      const msg = authErr.message === 'Invalid login credentials' ? 'Invalid email or password.'
        : /not confirmed/i.test(authErr.message) ? 'This account is not active yet. Please ask the Administrator.'
        : authErr.message;
      return fail(msg);
    }
    const res = await loadProfile(data.user);
    if (res.error) { await supabase.auth.signOut(); return fail(res.error); }
    await supabase.from('user').update({ last_login_at: new Date().toISOString() }).eq('user_id', data.user.id);
    setUser(res.user);
    auditLogin(res.user);
    startAutoSave();
    setLoading(false);
    return { success: true };
  }, [loadProfile]);

  const logout = useCallback(async () => {
    if (user) {
      AUDIT_LOG.unshift({
        id: newAuditId(),
        action: 'LOGOUT',
        userId: user.id,
        detail: `${user.name} logged out`,
        timestamp: new Date().toISOString(),
      });
    }
    setUser(null);
    await closeCompanyData();
    if (isSupabaseConfigured) supabase.auth.signOut();
  }, [user]);

  // Supabase sends a password-reset e-mail (resetPasswordForEmail)
  const resetPassword = useCallback(async (email) => {
    if (!isSupabaseConfigured) return { success: false, message: 'The database is not connected.' };
    const { error: rErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + window.location.pathname,
    });
    if (rErr) return { success: false, message: rErr.message };
    return { success: true, message: 'A password reset link has been sent to your e-mail.' };
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
    <AuthContext.Provider value={{ user, login, logout, resetPassword, can, canDo, loading, restoring, error, roleInfo, authMode: isSupabaseConfigured ? 'supabase' : 'demo' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
