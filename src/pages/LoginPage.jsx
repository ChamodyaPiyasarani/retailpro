// Login Form – SD "Log in" (extend: Reset password)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import User from '../classes/User';
import { homeOf } from '../config/menu';
import { DEMO_ACCOUNTS } from '../config/demoAccounts';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { Modal, Field } from '../components/ui';

export default function LoginPage() {
  const { login, recovery, setRecovery } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPw, setNewPw] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { const u = await login(email, password); navigate(homeOf(u.permissions)); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const sendReset = async (e) => {
    e.preventDefault();
    try { toast.success(await User.resetPassword(resetEmail)); setForgot(false); } catch (err) { toast.error(err.message); }
  };
  const saveNewPassword = async (e) => {
    e.preventDefault();
    try { await User.changePassword(newPw); toast.success('Password changed. Please log in.'); setRecovery(false); await User.logout(); } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="login-simple">
      <form className="login-simple-card" onSubmit={submit}>
        <div className="login-simple-logo">🖥️</div>
        <h1 className="login-simple-title">Rajida Holdings</h1>
        <p className="login-simple-subtitle">Retail Management System</p>
        {!isSupabaseConfigured && <div className="alert alert-danger" style={{ fontSize: 13 }}>The database is not connected – add the Supabase keys to the .env file.</div>}
        <Field label="E-mail"><input id="login-email" type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@gmail.com" /></Field>
        <Field label="Password">
          <div style={{ position: 'relative' }}>
            <input id="login-password" type={show ? 'text' : 'password'} className="form-input" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" className="login-simple-eye" onClick={() => setShow(!show)} aria-label="Show password">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>
        </Field>
        {error && <div id="login-error" className="alert alert-danger" style={{ fontSize: 13 }}>⚠️ {error}</div>}
        <button id="login-submit" type="submit" className="btn btn-primary w-full" disabled={busy}><LogIn size={16} /> {busy ? 'Checking…' : 'Log in'}</button>
        <button type="button" id="forgot-password" className="login-simple-link" onClick={() => { setResetEmail(email); setForgot(true); }}>Forgot password?</button>
        <div className="login-demo">
          <div className="login-demo-title">Staff accounts (password 123456)</div>
          <div className="login-demo-list">
            {DEMO_ACCOUNTS.map(a => (
              <button type="button" key={a.email} className="login-demo-user" onClick={() => { setEmail(a.email); setPassword(a.password); }}>
                <span className="login-demo-avatar">{a.avatar}</span><span className="login-demo-text"><span className="login-demo-role">{a.label}</span><span className="login-demo-email">{a.email}</span></span>
              </button>
            ))}
          </div>
        </div>
      </form>

      {forgot && (
        <Modal title="Reset password" onClose={() => setForgot(false)}
          footer={<><button className="btn btn-outline" onClick={() => setForgot(false)}>Cancel</button><button id="send-reset" className="btn btn-primary" onClick={sendReset}>Send reset link</button></>}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Enter your e-mail. A link to set a new password will be sent to it.</p>
          <Field label="E-mail"><input id="reset-email" type="email" className="form-input" value={resetEmail} onChange={e => setResetEmail(e.target.value)} /></Field>
        </Modal>
      )}
      {recovery && (
        <Modal title="Set a new password" onClose={() => setRecovery(false)}
          footer={<button className="btn btn-primary" onClick={saveNewPassword}>Save password</button>}>
          <Field label="New password (at least 6 characters)"><input type="password" className="form-input" value={newPw} onChange={e => setNewPw(e.target.value)} /></Field>
        </Modal>
      )}
    </div>
  );
}
