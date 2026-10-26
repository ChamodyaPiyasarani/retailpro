import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Sun, Moon, Shield, Sparkles, CheckCircle2, KeyRound, Mail, Lock, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { USERS, ROLES } from '../data/mockData';

function ResetPasswordModal({ onClose, onReset }) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Passwords do not match!' });
      return;
    }
    setSubmitting(true);
    const res = await onReset(email, newPassword);
    setSubmitting(false);
    if (res.success) {
      setMsg({ type: 'success', text: res.message });
      setTimeout(onClose, 1400);
    } else {
      setMsg({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <KeyRound size={20} color="var(--primary-400)" />
          <div className="modal-title">Reset Internal Account Password</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Enter your registered staff email address to authenticate and set a new password.
            </p>

            <div className="form-group">
              <label className="form-label">Registered Staff Email *</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. sales@retailpro.lk"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter new strong password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {msg && (
              <div className={`alert alert-${msg.type === 'success' ? 'success' : 'danger'}`} style={{ fontSize: 13 }}>
                {msg.type === 'success' ? '✓ ' : '⚠️ '}{msg.text}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !email || !newPassword}>
              {submitting ? 'Resetting…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login, resetPassword, loading, error } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@retailpro.lk');
  const [password, setPassword] = useState('admin123');
  const [showPw, setShowPw] = useState(false);
  const [selectedRole, setSelectedRole] = useState('admin');
  const [showResetModal, setShowResetModal] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    const u = USERS.find(x => x.role === roleKey);
    if (u) {
      setEmail(u.email);
      setPassword(u.password);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  const handleResetPassword = async (em, pw) => {
    const res = await resetPassword(em, pw);
    if (res.success) {
      toast.success('Password updated! You can now sign in.');
      setPassword(pw);
    }
    return res;
  };

  const rolePills = [
    { key: 'admin', label: 'Admin / Manager', icon: '👨‍💼', desc: 'Overall Control & Audits' },
    { key: 'sales', label: 'Sales / Cashier', icon: '🛒', desc: 'POS, Invoices, Orders' },
    { key: 'storekeeper', label: 'Storekeeper', icon: '📦', desc: 'Stock & Serial Inventory' },
    { key: 'purchase', label: 'Purchasing', icon: '🚚', desc: 'Suppliers & Goods Receipt' },
    { key: 'finance', label: 'Finance Manager', icon: '💳', desc: 'Receivables & Payables' },
    { key: 'technician', label: 'Technician', icon: '🔧', desc: 'Service Jobs & Repairs' },
  ];

  return (
    <div className="login-fullscreen">
      {/* Left Visual Brand Panel */}
      <div className="login-hero-panel">
        <div>
          <div className="login-hero-badge">
            <Sparkles size={14} color="#60a5fa" />
            <span>RetailPro Enterprise v2.4 · Internal Operations</span>
          </div>

          <h1 className="login-hero-title">
            Unified Retail, Service & Inventory Management
          </h1>

          <p className="login-hero-desc">
            An interconnected internal platform powering sales checkout, warehouse serial tracking,
            technician service job dispatch, warranty verification, and real-time financial reconciliation.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 540 }}>
            <div className="login-feature-card">
              <div className="login-feature-icon">⚡</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#ffffff', marginBottom: 2 }}>
                  Point of Sale & Invoicing
                </div>
                <div style={{ fontSize: 12.5, color: '#94a3b8' }}>
                  Fast barcode search, automated VAT calculation, credit sales, and receipt printing.
                </div>
              </div>
            </div>

            <div className="login-feature-card">
              <div className="login-feature-icon">📦</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#ffffff', marginBottom: 2 }}>
                  Warehouse & Serial Number Tracking
                </div>
                <div style={{ fontSize: 12.5, color: '#94a3b8' }}>
                  Live stock sync, goods discrepancy inspection, safety stock alerts, and return triage.
                </div>
              </div>
            </div>

            <div className="login-feature-card">
              <div className="login-feature-icon">🛠️</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#ffffff', marginBottom: 2 }}>
                  Field Engineer Service Dispatch
                </div>
                <div style={{ fontSize: 12.5, color: '#94a3b8' }}>
                  Installation tracking, fault logging, spare parts issuance, and customer sign-off.
                </div>
              </div>
            </div>

            <div className="login-feature-card">
              <div className="login-feature-icon">📈</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#ffffff', marginBottom: 2 }}>
                  Financial Audit & Structured PDF Reporting
                </div>
                <div style={{ fontSize: 12.5, color: '#94a3b8' }}>
                  Customer payments, supplier payables settlement, and executive PDF statement exports.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Hero Stats */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#60a5fa' }}>100%</div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Integrated Records</div>
          </div>
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#34d399' }}>6 Roles</div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>RBAC Security</div>
          </div>
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#bfdbfe', fontSize: 12 }}>
            <Shield size={16} color="#60a5fa" />
            <span>Encrypted Staff Session</span>
          </div>
        </div>
      </div>

      {/* Right Login Console */}
      <div className="login-form-panel">
        {/* Top bar controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🏪</span>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: -0.3, color: 'var(--text-primary)' }}>RetailPro</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="btn btn-ghost btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {theme === 'dark' ? <Sun size={15} color="var(--warning-400)" /> : <Moon size={15} color="var(--primary-600)" />}
              <span style={{ fontSize: 12 }}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>

        {/* Form Header */}
        <div className="login-form-header">
          <h2 className="login-form-title">Staff Portal Sign In</h2>
          <p className="login-form-subtitle">
            Select your assigned role or enter your credentials to open your authorized workspace.
          </p>
        </div>

        {/* Quick Role Selection Tabs */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚡ Select Role to Auto-Fill Credentials:</span>
          </div>
          <div className="login-role-selector">
            {rolePills.map(rp => (
              <button
                key={rp.key}
                type="button"
                onClick={() => handleRoleSelect(rp.key)}
                className={`login-role-btn ${selectedRole === rp.key ? 'active' : ''}`}
                title={rp.desc}
              >
                <span style={{ fontSize: 16 }}>{rp.icon}</span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rp.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Staff Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  placeholder="e.g. admin@retailpro.lk"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="login-password">Password</label>
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-400)', fontSize: 12, cursor: 'pointer', padding: 0, fontWeight: 600 }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: 38, paddingRight: 40 }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                Keep me signed in on this station
              </label>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Active SSL Session</span>
            </div>

            {error && (
              <div className="alert alert-danger" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner" style={{ width: 16, height: 16 }} /> Verifying Credentials...</>
              ) : (
                <><LogIn size={16} /> Sign In to Workspace</>
              )}
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div style={{ marginTop: 28, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0 }}>
            Protected Internal System · Authorized Personnel Only · All Actions Audited
          </p>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <ResetPasswordModal
          onClose={() => setShowResetModal(false)}
          onReset={handleResetPassword}
        />
      )}
    </div>
  );
}
