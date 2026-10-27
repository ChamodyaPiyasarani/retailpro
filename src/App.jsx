import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import SalesPage from './pages/SalesPage';
import InvoicesPage from './pages/InvoicesPage';
import CustomersPage from './pages/CustomersPage';
import StockPage from './pages/StockPage';
import SuppliersPage from './pages/SuppliersPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import ServiceJobsPage from './pages/ServiceJobsPage';
import ServiceHistoryPage from './pages/ServiceHistoryPage';
import ReturnsPage from './pages/ReturnsPage';
import PaymentsPage from './pages/PaymentsPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import WarrantyPage from './pages/WarrantyPage';

function ProtectedRoute({ children, perm }) {
  const { user, can } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (perm && !can(perm)) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h2 style={{ fontSize: 20, marginBottom: 8, color: 'var(--text-primary)' }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
          Your role (<strong>{user.role}</strong>) does not have permission to view this section.
        </p>
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Main Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute perm="dashboard">
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Sales & POS */}
            <Route
              path="/pos"
              element={
                <ProtectedRoute perm="pos">
                  <POSPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales"
              element={
                <ProtectedRoute perm="sales">
                  <SalesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute perm="invoices">
                  <InvoicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute perm="customers">
                  <CustomersPage />
                </ProtectedRoute>
              }
            />

            {/* Inventory */}
            <Route path="/products" element={<Navigate to="/stock" replace />} />
            <Route
              path="/stock"
              element={
                <ProtectedRoute perm="stock">
                  <StockPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock-movements"
              element={
                <ProtectedRoute perm="stock-movements">
                  <StockPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/warranty"
              element={
                <ProtectedRoute perm="warranty">
                  <WarrantyPage />
                </ProtectedRoute>
              }
            />

            {/* Purchasing */}
            <Route
              path="/suppliers"
              element={
                <ProtectedRoute perm="suppliers">
                  <SuppliersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/purchase-orders"
              element={
                <ProtectedRoute perm="purchase-orders">
                  <PurchaseOrdersPage />
                </ProtectedRoute>
              }
            />

            {/* Service & Returns */}
            <Route
              path="/service-jobs"
              element={
                <ProtectedRoute perm="service-jobs">
                  <ServiceJobsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/service-history"
              element={
                <ProtectedRoute perm="service-history">
                  <ServiceHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/returns"
              element={
                <ProtectedRoute perm="returns">
                  <ReturnsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complaints"
              element={
                <ProtectedRoute perm="complaints">
                  <ReturnsPage />
                </ProtectedRoute>
              }
            />

            {/* Finance */}
            <Route
              path="/payments"
              element={
                <ProtectedRoute perm="payments">
                  <PaymentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payables"
              element={
                <ProtectedRoute perm="payables">
                  <PaymentsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/users"
              element={
                <ProtectedRoute perm="users">
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute perm="reports">
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute perm="settings">
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Default fallback */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  </ThemeProvider>
);
}
