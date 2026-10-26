import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { USERS, ROLES } from '../data/mockData';

function ResetPasswordModal({ onClose, onReset, emailOnly }) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOnly && newPassword !== confirmPassword) {
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
              {emailOnly
                ? 'Enter your staff email address. We will send you a link to set a new password.'
                : 'Enter your registered staff email address to authenticate and set a new password.'}
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

            {!emailOnly && (<>
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

            </>)}

            {msg && (
              <div className={`alert alert-${msg.type === 'success' ? 'success' : 'danger'}`} style={{ fontSize: 13 }}>
                {msg.type === 'success' ? '✓ ' : '⚠️ '}{msg.text}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !email || (!emailOnly && !newPassword)}>
              {submitting ? 'Sending…' : emailOnly ? 'Send Reset Link' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login, resetPassword, loading, error, authMode } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Demo accounts: click one to fill in its email and password
  const fillUser = (u) => {
    setEmail(u.email);
    setPassword(u.password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) navigate('/dashboard');
  };

  const handleResetPassword = async (em, pw) => {
    const res = await resetPassword(em, pw);
    if (res.success) toast.success('Password updated. You can now sign in.');
    return res;
  };

  return (
    <div className="login-simple">
      <form className="login-simple-card" onSubmit={handleSubmit}>
        <div className="login-simple-logo">🖥️</div>
        <h1 className="login-simple-title">Rajida Holdings</h1>
        <p className="login-simple-subtitle">Inventory, Sales &amp; Purchase System</p>
        <div className={`login-mode ${authMode}`}>
          {authMode === 'supabase' ? 'Signing in with Supabase' : 'Demo mode (sample data)'}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            className="form-input"
            placeholder="you@retailpro.lk"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="login-password">Password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              className="form-input"
              style={{ paddingRight: 40 }}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="login-simple-eye"
              onClick={() => setShowPw(!showPw)}
              title={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger" style={{ fontSize: 13 }}>{error}</div>}

        <button
          id="login-submit-btn"
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={loading}
        >
          {loading ? 'Signing in…' : <><LogIn size={16} /> Sign In</>}
        </button>

        <button type="button" className="login-simple-link" onClick={() => setShowResetModal(true)}>
          Forgot password?
        </button>

        <div className="login-demo">
          <div className="login-demo-title">Demo accounts — click to fill in</div>
          <div className="login-demo-list">
            {USERS.filter(u => u.active).map(u => (
              <button
                key={u.id}
                type="button"
                className={`login-demo-user ${email === u.email ? 'active' : ''}`}
                onClick={() => fillUser(u)}
                title={`${u.email} / ${u.password}`}
              >
                <span className="login-demo-avatar">{u.avatar}</span>
                <span className="login-demo-text">
                  <span className="login-demo-role">{ROLES[u.role]?.label || u.role}</span>
                  <span className="login-demo-email">{u.email}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </form>

      {showResetModal && (
        <ResetPasswordModal
          onClose={() => setShowResetModal(false)}
          onReset={handleResetPassword}
          emailOnly={authMode === 'supabase'}
        />
      )}
    </div>
  );
}
