import { createContext, useContext, useState, useCallback } from 'react';
import { USERS, ROLES, AUDIT_LOG } from '../data/mockData';

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
    'products', 'stock',
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
    'user.manage', 'settings.manage', 'report.export',
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
    'po.create', 'po.receive',
    'supplier.add', 'supplier.edit',
    'report.export',
  ],
  finance: [
    'payment.record', 'payment.remind', 'payment.flagOverdue', 'payable.pay',
    'refund.pay', 'customer.edit', // customer.edit = approve credit limit
    'report.export',
  ],
  technician: [
    'service.updateStatus', 'service.logVisit',
  ],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    await new Promise(r => setTimeout(r, 400)); // simulate network

    const found = USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) {
      setError('User account not found. Please check your email.');
      setLoading(false);
      return { success: false, message: 'User account not found' };
    }

    if (!found.active) {
      setError('Your account has been locked by Administrator. Contact management.');
      setLoading(false);
      return { success: false, message: 'Account is locked' };
    }

    if (found.password !== password) {
      setError('Invalid password. Check credentials or use Reset Password.');
      setLoading(false);
      return { success: false, message: 'Invalid password' };
    }

    const sessionUser = { ...found, permissions: PERMISSIONS[found.role] || [] };
    setUser(sessionUser);
    AUDIT_LOG.unshift({
      id: `AL${Date.now()}`,
      action: 'LOGIN',
      userId: found.id,
      detail: `${found.name} (${ROLES[found.role]?.label || found.role}) signed in successfully`,
      timestamp: new Date().toISOString(),
    });
    setLoading(false);
    return { success: true };
  }, []);

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
    setUser(null);
  }, [user]);

  const resetPassword = useCallback(async (email, newPassword) => {
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
    <AuthContext.Provider value={{ user, login, logout, resetPassword, can, canDo, loading, error, roleInfo }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
