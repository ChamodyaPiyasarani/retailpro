import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Settings, ShoppingCart, Package, Warehouse,
  Truck, Wrench, CreditCard, BarChart3, ArrowLeftRight, MessageSquare,
  LogOut, ChevronRight, Bell, Search, Menu, X, ShoppingBag, FileText,
  Receipt, UserCheck, ClipboardList, AlertTriangle, Sun, Moon, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getLowStockProducts, getOverduePOs, getOutstandingInvoices } from '../data/mockData';

const NAV_SECTIONS = [
  {
    title: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',    path: '/dashboard',    perm: 'dashboard' },
    ]
  },
  {
    title: 'Sales',
    items: [
      { icon: ShoppingCart,    label: 'Point of Sale', path: '/pos',         perm: 'pos' },
      { icon: FileText,        label: 'Sales Orders',  path: '/sales',       perm: 'sales' },
      { icon: Receipt,         label: 'Invoices',      path: '/invoices',    perm: 'invoices' },
      { icon: Users,           label: 'Customers',     path: '/customers',   perm: 'customers' },
      { icon: ShieldCheck,     label: 'Warranty Check', path: '/warranty',   perm: 'warranty' },
    ]
  },
  {
    title: 'Inventory',
    items: [
      { icon: Package,         label: 'Products',      path: '/products',    perm: 'products' },
      { icon: Warehouse,       label: 'Stock',         path: '/stock',       perm: 'stock' },
      { icon: ArrowLeftRight,  label: 'Movements',     path: '/stock-movements', perm: 'stock-movements' },
    ]
  },
  {
    title: 'Purchasing',
    items: [
      { icon: Truck,           label: 'Suppliers',     path: '/suppliers',   perm: 'suppliers' },
      { icon: ShoppingBag,     label: 'Purchase Orders',path:'/purchase-orders', perm:'purchase-orders' },
    ]
  },
  {
    title: 'Service',
    items: [
      { icon: Wrench,          label: 'Service Jobs',  path: '/service-jobs',perm: 'service-jobs' },
      { icon: ClipboardList,   label: 'Service History',path:'/service-history', perm:'service-history' },
      { icon: ArrowLeftRight,  label: 'Returns & Exchanges', path:'/returns', perm:'returns' },
      { icon: MessageSquare,   label: 'Complaints',    path: '/complaints',  perm: 'complaints' },
    ]
  },
  {
    title: 'Finance',
    items: [
      { icon: CreditCard,      label: 'Payments',      path: '/payments',    perm: 'payments' },
      { icon: Receipt,         label: 'Payables',      path: '/payables',    perm: 'payables' },
    ]
  },
  {
    title: 'Intelligence',
    items: [
      { icon: BarChart3,       label: 'Reports & Audits', path: '/reports',  perm: 'reports' },
    ]
  },
  {
    title: 'Administration',
    items: [
      { icon: UserCheck,       label: 'Users & Roles', path: '/users',       perm: 'users' },
      { icon: Settings,        label: 'Settings',      path: '/settings',    perm: 'settings' },
    ]
  },
];

function RoleBadge({ role }) {
  const map = {
    admin:'role-badge-admin', sales:'role-badge-sales', storekeeper:'role-badge-store',
    purchase:'role-badge-purchase', finance:'role-badge-finance', technician:'role-badge-tech'
  };
  const labels = {
    admin:'Admin', sales:'Sales', storekeeper:'Store', purchase:'Purchasing', finance:'Finance', technician:'Technician'
  };
  return <span className={`sidebar-user-role ${map[role]||''}`}>{labels[role]||role}</span>;
}

export default function Layout({ children }) {
  const { user, logout, can } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const lowStock = getLowStockProducts().length;
  const overduePos = getOverduePOs().length;
  const outstanding = getOutstandingInvoices().length;

  const badgeFor = (path) => {
    if (path === '/stock' && lowStock > 0) return lowStock;
    if (path === '/purchase-orders' && overduePos > 0) return overduePos;
    if (path === '/invoices' && outstanding > 0) return outstanding;
    return null;
  };

  const currentTitle = () => {
    const all = NAV_SECTIONS.flatMap(s => s.items);
    const found = all.find(i => location.pathname === i.path || location.pathname.startsWith(i.path + '/'));
    return found?.label || 'RetailPro';
  };

  return (
    <div className="app-shell">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:199 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">
            <div className="sidebar-brand-icon">🏪</div>
            <div className="sidebar-brand-text">
              <div className="sidebar-brand-name">RetailPro</div>
              <div className="sidebar-brand-tagline">Business Suite</div>
            </div>
          </div>
        </div>

        {/* User */}
        {user && (
          <div className="sidebar-user">
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:22 }}>{user.avatar}</span>
              <div>
                <div className="sidebar-user-name">{user.name}</div>
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <div className="sidebar-nav">
          {NAV_SECTIONS.map(section => {
            const visibleItems = section.items.filter(item => can(item.perm));
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.title} className="sidebar-nav-section">
                <div className="sidebar-nav-heading">{section.title}</div>
                {visibleItems.map(item => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                  const badge = badgeFor(item.path);
                  return (
                    <div
                      key={item.path}
                      className={`sidebar-nav-item ${active ? 'active' : ''}`}
                      onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                      id={`nav-${item.path.replace(/\//g,'-').slice(1)}`}
                    >
                      <Icon className="sidebar-nav-icon" />
                      <span>{item.label}</span>
                      {badge && <span className="sidebar-nav-badge">{badge}</span>}
                      {active && <ChevronRight size={14} style={{ marginLeft:'auto', opacity:0.5 }} />}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <div
            className="sidebar-nav-item"
            onClick={logout}
            id="nav-logout"
            style={{ color: 'var(--danger-400)' }}
          >
            <LogOut className="sidebar-nav-icon" />
            <span>Sign Out</span>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ display:'flex' }}
            id="topbar-menu-btn"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="topbar-title">{currentTitle()}</span>

          {/* Alerts summary */}
          {lowStock > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:6, color:'var(--warning-400)', fontSize:13 }}>
              <AlertTriangle size={15} />
              <span>{lowStock} low stock</span>
            </div>
          )}

          <div className="topbar-actions">
            {/* Theme Toggle Button (Light / Dark) */}
            <button
              className="btn btn-ghost btn-icon"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              id="topbar-theme-toggle-btn"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {theme === 'dark' ? <Sun size={18} color="var(--warning-400)" /> : <Moon size={18} color="var(--primary-600)" />}
            </button>

            <button
              className="btn btn-ghost btn-icon"
              style={{ position:'relative' }}
              id="topbar-notifications-btn"
            >
              <Bell size={18} />
              {(lowStock + overduePos) > 0 && (
                <span style={{
                  position:'absolute', top:2, right:2, width:8, height:8,
                  background:'var(--danger-500)', borderRadius:'50%'
                }} />
              )}
            </button>
            <div style={{ width:1, height:24, background:'var(--border-subtle)' }} />
            <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'default' }}>
              <span style={{ fontSize:20 }}>{user?.avatar}</span>
              <div style={{ fontSize:13 }}>
                <div style={{ fontWeight:600, color:'var(--text-primary)' }}>{user?.name?.split(' ')[0]}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
}
