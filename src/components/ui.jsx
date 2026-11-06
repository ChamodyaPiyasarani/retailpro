// Small building blocks used by every form (page)
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div><h1 className="page-title">{title}</h1>{subtitle && <p className="page-subtitle">{subtitle}</p>}</div>
      {children && <div className="page-header-actions">{children}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide }) {
  // the Esc key closes the window
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-lg' : ''}`} role="dialog" aria-label={title}>
        <div className="modal-header"><div className="modal-title">{title}</div>
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={onClose} aria-label="Close">✕</button></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return <div className="form-group"><label className="form-label">{label}</label>{children}{hint && <div className="form-hint">{hint}</div>}</div>;
}

const COLORS = { Completed: 'success', Paid: 'success', Accepted: 'success', Approved: 'success', Active: 'success', Issued: 'success', Received: 'primary',
  Resolved: 'success', Refunded: 'primary', Pending: 'warning', Requested: 'warning', Unpaid: 'warning', Assigned: 'primary', 'In Progress': 'accent',
  Open: 'danger', 'Low stock': 'danger', Overdue: 'danger', Rejected: 'danger', Expired: 'danger', Cancelled: 'gray', Locked: 'danger', Customer: 'primary', Supplier: 'accent' };
export const Badge = ({ text }) => <span className={`badge badge-${COLORS[text] || 'gray'}`}>{text}</span>;

export function Empty({ text }) {
  return <div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-title">{text}</div></div>;
}

// load data from the database when the page opens; reload() reads it again after a change
export function useLoad(loader, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(() => loader().then(d => { setData(d); setError(null); }).catch(e => setError(e.message)), deps);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, reload, loading: data === null && !error };
}

// run an action, show the message, return true when it worked
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const act = useCallback(async (fn, okMessage) => {
    setBusy(true);
    try { const r = await fn(); if (okMessage) toast.success(typeof okMessage === 'function' ? okMessage(r) : okMessage); return r ?? true; }
    catch (e) { toast.error(e.message); return false; }
    finally { setBusy(false); }
  }, [toast]);
  return { act, busy };
}

export function Loading({ error }) {
  if (error) return <div className="alert alert-danger">⚠️ {error}</div>;
  return <div style={{ padding: 30, color: 'var(--text-muted)' }}>Loading…</div>;
}

export const nameOf = (list, key, id, field) => list?.find(x => x[key] === id)?.[field] ?? '—';
