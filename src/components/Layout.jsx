import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, CreditCard, Users, ShieldCheck, Undo2, Receipt, HandCoins, Warehouse, Package, Tags, Truck, FileText, ShoppingBag, Wrench, ClipboardList, History, BarChart3, UserCog, KeyRound, Percent, LogOut, Sun, Moon, Menu, X, Circle } from 'lucide-react';
const Icons = { LayoutDashboard, ShoppingCart, CreditCard, Users, ShieldCheck, Undo2, Receipt, HandCoins, Warehouse, Package, Tags, Truck, FileText, ShoppingBag, Wrench, ClipboardList, History, BarChart3, UserCog, KeyRound, Percent, LogOut, Sun, Moon, Menu, X, Circle };
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MENU, ALL_PAGES } from '../config/menu';

// Side menu (only the pages the role is allowed to use) + top bar
export default function Layout({ children }) {
  const { user, logout, canAny } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const title = ALL_PAGES.find(p => location.pathname.startsWith(p.path))?.label || 'Rajida Holdings';

  return (
    <div className="app-shell">
      {open && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 199 }} onClick={() => setOpen(false)} />}
      <nav className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">
            <div className="sidebar-brand-icon">🖥️</div>
            <div className="sidebar-brand-text">
              <div className="sidebar-brand-name">Rajida Holdings</div>
              <div className="sidebar-brand-tagline">Retail Management System</div>
            </div>
          </div>
        </div>
        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-name">{user.name}</div>
            <span className="sidebar-user-role">{user.role.role_name}</span>
          </div>
        )}
        <div className="sidebar-nav">
          {MENU.map(section => {
            const items = section.items.filter(i => canAny(i.perms));
            if (!items.length) return null;
            return (
              <div key={section.section} className="sidebar-nav-section">
                <div className="sidebar-nav-heading">{section.section}</div>
                {items.map(item => {
                  const Icon = Icons[item.icon] || Icons.Circle;
                  const active = location.pathname.startsWith(item.path);
                  return (
                    <div key={item.path} id={`nav${item.path.replace(/\//g, '-')}`} className={`sidebar-nav-item ${active ? 'active' : ''}`}
                      onClick={() => { navigate(item.path); setOpen(false); }}>
                      <Icon className="sidebar-nav-icon" /><span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="sidebar-footer">
          {/* SD "Log out" */}
          <div className="sidebar-nav-item" id="nav-logout" style={{ color: 'var(--danger-400)' }} onClick={async () => { await logout(); navigate('/login'); }}>
            <Icons.LogOut className="sidebar-nav-icon" /><span>Log out</span>
          </div>
        </div>
      </nav>
      <div className="main-content">
        <header className="topbar">
          <button className="btn btn-ghost btn-icon" onClick={() => setOpen(!open)} id="topbar-menu-btn">{open ? <Icons.X size={20} /> : <Icons.Menu size={20} />}</button>
          <span className="topbar-title">{title}</span>
          <div className="topbar-actions">
            <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Light / dark">
              {theme === 'dark' ? <Icons.Sun size={18} color="var(--warning-400)" /> : <Icons.Moon size={18} color="var(--primary-600)" />}
            </button>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</span>
          </div>
        </header>
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
}
