import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import { ALL_PAGES, homeOf } from './config/menu';

// one form (page) for each group of use cases
const PAGES = {
  '/dashboard': lazy(() => import('./pages/DashboardPage')), '/sales-order': lazy(() => import('./pages/SalesOrderPage')),
  '/payments': lazy(() => import('./pages/PaymentsPage')), '/customers': lazy(() => import('./pages/CustomersPage')),
  '/warranty': lazy(() => import('./pages/WarrantyPage')), '/returns': lazy(() => import('./pages/ReturnsPage')),
  '/invoices': lazy(() => import('./pages/InvoicesPage')), '/refunds': lazy(() => import('./pages/RefundsPage')),
  '/stock': lazy(() => import('./pages/StockPage')), '/products': lazy(() => import('./pages/ProductsPage')),
  '/categories': lazy(() => import('./pages/CategoriesPage')), '/suppliers': lazy(() => import('./pages/SuppliersPage')),
  '/quotations': lazy(() => import('./pages/QuotationsPage')), '/purchase-orders': lazy(() => import('./pages/PurchaseOrdersPage')),
  '/service-jobs': lazy(() => import('./pages/ServiceJobsPage')), '/my-jobs': lazy(() => import('./pages/MyJobsPage')),
  '/service-history': lazy(() => import('./pages/ServiceHistoryPage')), '/reports': lazy(() => import('./pages/ReportsPage')),
  '/users': lazy(() => import('./pages/UsersPage')), '/roles': lazy(() => import('./pages/RolesPage')), '/discounts': lazy(() => import('./pages/DiscountsPage')),
};

function Protected({ page }) {
  const { user, canAny, restoring } = useAuth();
  if (restoring) return <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!canAny(page.perms)) return <Navigate to={homeOf(user.permissions)} replace />;
  const Page = PAGES[page.path];
  return <Layout><Suspense fallback={<div style={{ padding: 30 }}>Loading…</div>}><Page /></Suspense></Layout>;
}

function Home() {
  const { user, restoring } = useAuth();
  if (restoring) return <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>;
  return <Navigate to={user ? homeOf(user.permissions) : '/login'} replace />;
}

function NoAccess() {
  const { logout } = useAuth();
  return <div style={{ padding: 40, textAlign: 'center' }}><h2>No pages for your role</h2><p>Ask the Admin to give permissions to your role.</p>
    <button className="btn btn-primary" onClick={logout}>Log out</button></div>;
}

export default function App() {
  return (
    <ThemeProvider><AuthProvider><ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/no-access" element={<NoAccess />} />
          {ALL_PAGES.map(p => <Route key={p.path} path={p.path} element={<Protected page={p} />} />)}
          <Route path="*" element={<Home />} />
        </Routes>
      </HashRouter>
    </ToastProvider></AuthProvider></ThemeProvider>
  );
}
