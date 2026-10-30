import { useState } from 'react';
import { Save, Shield, Settings, Bell, Database, RefreshCw, FileText, Sun, Moon } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function SettingsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [settings, setSettings] = useState({
    businessName: 'RetailPro Computer Hardware & Services',
    taxId: 'VAT-88492019-LK',
    currency: 'LKR (Rs.)',
    taxRate: 15,
    invoicePrefix: 'INV-',
    poPrefix: 'PO-',
    servicePrefix: 'SRV-',
    lowStockThreshold: 5,
    warrantyPeriodDays: 365,
    returnWindowDays: 14,
    enableWarrantyCheck: true,
    autoAssignTechnician: false,
    emailAlerts: true,
    smsAlerts: false
  });

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('System settings updated successfully');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">Configure business profiles, tax rates, warranty terms, and operational rules</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Appearance & Theme Mode */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            {theme === 'dark' ? <Moon size={20} color="var(--accent-400)" /> : <Sun size={20} color="var(--warning-400)" />}
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Interface Theme & Appearance</h3>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Choose your preferred color theme. This setting is remembered automatically on your device.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Dark Mode card */}
            <button
              type="button"
              onClick={() => theme !== 'dark' && toggleTheme()}
              style={{
                padding: '16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                borderRadius: 'var(--radius-lg)',
                border: theme === 'dark' ? '2px solid var(--primary-500)' : '2px solid var(--border-default)',
                background: theme === 'dark'
                  ? 'linear-gradient(135deg, var(--primary-600), var(--primary-500))'
                  : 'var(--bg-elevated)',
                color: theme === 'dark' ? '#fff' : 'var(--text-primary)',
                cursor: theme === 'dark' ? 'default' : 'pointer',
                boxShadow: theme === 'dark' ? '0 4px 16px rgba(37,99,235,.4)' : 'none',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Moon size={22} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Dark Mode</span>
              <span style={{ fontSize: 11, opacity: 0.75 }}>Sleek slate dark aesthetic</span>
            </button>

            {/* Light Mode card */}
            <button
              type="button"
              onClick={() => theme !== 'light' && toggleTheme()}
              style={{
                padding: '16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                borderRadius: 'var(--radius-lg)',
                border: theme === 'light' ? '2px solid var(--primary-500)' : '2px solid var(--border-default)',
                background: theme === 'light'
                  ? 'linear-gradient(135deg, var(--primary-600), var(--primary-500))'
                  : 'var(--bg-elevated)',
                color: theme === 'light' ? '#fff' : 'var(--text-primary)',
                cursor: theme === 'light' ? 'default' : 'pointer',
                boxShadow: theme === 'light' ? '0 4px 16px rgba(37,99,235,.4)' : 'none',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Sun size={22} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Light Mode</span>
              <span style={{ fontSize: 11, opacity: 0.75 }}>Crisp high-contrast day mode</span>
            </button>
          </div>
        </div>

        {/* Business Profile */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Settings size={20} color="var(--primary-400)" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Company & Store Profile</h3>
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Business Name</label>
            <input
              type="text"
              className="form-input"
              value={settings.businessName}
              onChange={e => handleChange('businessName', e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">VAT / Tax Registration Number</label>
            <input
              type="text"
              className="form-input"
              value={settings.taxId}
              onChange={e => handleChange('taxId', e.target.value)}
            />
          </div>
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Currency</label>
              <input
                type="text"
                className="form-input"
                value={settings.currency}
                disabled
              />
            </div>
            <div className="form-group">
              <label className="form-label">Standard VAT / Tax Rate (%)</label>
              <input
                type="number"
                className="form-input"
                value={settings.taxRate}
                onChange={e => handleChange('taxRate', +e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Invoice & Order Prefixes */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <FileText size={20} color="var(--accent-400)" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Document Identifiers</h3>
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Invoice Number Prefix</label>
            <input
              type="text"
              className="form-input"
              value={settings.invoicePrefix}
              onChange={e => handleChange('invoicePrefix', e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Purchase Order Prefix</label>
            <input
              type="text"
              className="form-input"
              value={settings.poPrefix}
              onChange={e => handleChange('poPrefix', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Service Job Card Prefix</label>
            <input
              type="text"
              className="form-input"
              value={settings.servicePrefix}
              onChange={e => handleChange('servicePrefix', e.target.value)}
            />
          </div>
        </div>

        {/* Warranty & Return Policy */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Shield size={20} color="var(--success-400)" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Warranty & Returns Policy</h3>
          </div>
          <div className="form-row-2" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="form-label">Default Warranty (Days)</label>
              <input
                type="number"
                className="form-input"
                value={settings.warrantyPeriodDays}
                onChange={e => handleChange('warrantyPeriodDays', +e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Return Window (Days)</label>
              <input
                type="number"
                className="form-input"
                value={settings.returnWindowDays}
                onChange={e => handleChange('returnWindowDays', +e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={settings.enableWarrantyCheck}
                onChange={e => handleChange('enableWarrantyCheck', e.target.checked)}
              />
              Enforce strict warranty validation before processing free replacements
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={settings.autoAssignTechnician}
                onChange={e => handleChange('autoAssignTechnician', e.target.checked)}
              />
              Auto-assign service tickets to available technicians
            </label>
          </div>
        </div>

        {/* System & Alerts */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Bell size={20} color="var(--warning-400)" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Inventory Alerts & Backups</h3>
          </div>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Default Low-Stock Warning Threshold</label>
            <input
              type="number"
              className="form-input"
              value={settings.lowStockThreshold}
              onChange={e => handleChange('lowStockThreshold', +e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={settings.emailAlerts}
                onChange={e => handleChange('emailAlerts', e.target.checked)}
              />
              Send instant email alerts to Storekeeper on critical low stock
            </label>
          </div>
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => toast.info('System database backup snapshot created')}
            >
              <Database size={15} /> Create Backup
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => toast.success('Mock data cache refreshed')}
            >
              <RefreshCw size={15} /> Refresh Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
