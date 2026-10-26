import { useState } from 'react';
import { USERS, ROLES, AUDIT_LOG } from '../data/mockData';
import { Plus, Shield, Lock, Unlock, Search, Edit2, Trash2, KeyRound, UserPlus } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState(user || {
    name: '',
    email: '',
    password: 'Password@123',
    role: 'sales',
    avatar: '🧑‍💼',
    active: true
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const avatarOptions = ['👩‍💼', '🧑‍💼', '🧑‍🏭', '🧑‍💻', '👩‍💻', '🧑‍🔧', '👨‍🔧', '👨‍💼'];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <UserPlus size={20} color="var(--primary-400)" />
          <div className="modal-title">{user ? 'Edit User Account' : 'Create New User Account'}</div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Kasun Fernando"
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="name@retailpro.lk"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password {user ? '(Leave to keep current)' : '*'}</label>
              <input
                type="text"
                className="form-input"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Set password"
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Role Assignment *</label>
              <select
                className="form-select"
                value={form.role}
                onChange={e => set('role', e.target.value)}
              >
                {Object.entries(ROLES).map(([key, r]) => (
                  <option key={key} value={key}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Avatar Emoji</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {avatarOptions.map(av => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => set('avatar', av)}
                    style={{
                      fontSize: 18,
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: form.avatar === av ? '2px solid var(--primary-500)' : '1px solid var(--border-default)',
                      background: form.avatar === av ? 'var(--primary-50)' : 'var(--bg-elevated)',
                      cursor: 'pointer'
                    }}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={!form.name || !form.email}
            onClick={() => onSave(form)}
          >
            {user ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState(USERS);
  const [q, setQ] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [modal, setModal] = useState(null); // null | 'new' | user object

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(q.toLowerCase()) ||
    u.email.toLowerCase().includes(q.toLowerCase()) ||
    u.role.toLowerCase().includes(q.toLowerCase())
  );

  const toggleActive = (userId) => {
    const u = USERS.find(x => x.id === userId);
    if (!u) return;
    const newStatus = !u.active;
    u.active = newStatus;
    setUsers(us => us.map(x => x.id === userId ? { ...x, active: newStatus } : x));

    AUDIT_LOG.unshift({
      id: `AL${Date.now()}`,
      action: newStatus ? 'UNLOCK_ACCOUNT' : 'LOCK_ACCOUNT',
      userId: u.id,
      detail: `Account ${u.name} (${u.email}) was ${newStatus ? 'unlocked' : 'locked'}`,
      timestamp: new Date().toISOString(),
    });

    toast.info(`User account ${u.name} is now ${newStatus ? 'Active' : 'Locked'}`);
  };

  const handleSaveUser = (form) => {
    if (modal === 'new') {
      const newU = {
        ...form,
        id: `U00${users.length + 1}`,
        active: true
      };
      USERS.push(newU);
      setUsers(us => [...us, newU]);

      AUDIT_LOG.unshift({
        id: `AL${Date.now()}`,
        action: 'CREATE_USER',
        userId: newU.id,
        detail: `New user account created: ${newU.name} as ${ROLES[newU.role]?.label || newU.role}`,
        timestamp: new Date().toISOString(),
      });

      toast.success(`User ${newU.name} created successfully`);
    } else {
      const updated = { ...modal, ...form };
      setUsers(us => us.map(u => u.id === modal.id ? updated : u));
      const i = USERS.findIndex(u => u.id === modal.id);
      if (i !== -1) USERS[i] = updated;

      AUDIT_LOG.unshift({
        id: `AL${Date.now()}`,
        action: 'UPDATE_USER',
        userId: modal.id,
        detail: `Updated user profile and credentials for ${updated.name}`,
        timestamp: new Date().toISOString(),
      });

      toast.success(`User ${updated.name} updated`);
    }
    setModal(null);
  };

  const handleDeleteUser = (u) => {
    if (users.length <= 1) {
      toast.error('Cannot delete the last remaining user account');
      return;
    }
    if (confirm(`Are you sure you want to delete user ${u.name}?`)) {
      setUsers(us => us.filter(x => x.id !== u.id));
      const idx = USERS.findIndex(x => x.id === u.id);
      if (idx !== -1) USERS.splice(idx, 1);

      AUDIT_LOG.unshift({
        id: `AL${Date.now()}`,
        action: 'DELETE_USER',
        userId: u.id,
        detail: `Deleted user ${u.name} (${u.email})`,
        timestamp: new Date().toISOString(),
      });

      toast.success(`User ${u.name} deleted`);
    }
  };

  const roleColors = {
    admin: 'accent', sales: 'primary', storekeeper: 'success',
    purchase: 'warning', finance: 'danger', technician: 'accent'
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users & Role Permissions</h1>
          <p className="page-subtitle">{users.length} registered accounts · {users.filter(u => u.active).length} active</p>
        </div>
        <div className="page-header-actions">
          <button id="btn-add-user" className="btn btn-primary" onClick={() => setModal('new')}>
            <Plus size={15} /> Add User
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <div className="tabs">
          <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>👥 Users</button>
          <button className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>📋 Audit Log</button>
          <button className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>🛡️ Roles & Permissions</button>
        </div>
        <div className="search-bar" style={{ marginLeft: 'auto' }}>
          <Search size={14} color="var(--text-muted)" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search users…" style={{ width: 200 }} />
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>User Profile</th>
                <th>Email Address</th>
                <th>Role & Scope</th>
                <th>Account Status</th>
                <th>Credentials</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{u.avatar}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.email}</td>
                  <td>
                    <span className={`badge badge-${roleColors[u.role] || 'gray'}`}>
                      <Shield size={10} /> {ROLES[u.role]?.label || u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${u.active ? 'success' : 'danger'}`}>
                      {u.active ? '✓ Active' : '✕ Locked'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                      ••••••••
                    </span>
                  </td>
                  <td>
                    <div className="table-action-cell">
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        title="Edit User & Credentials"
                        onClick={() => setModal(u)}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className={`btn btn-sm ${u.active ? 'btn-outline' : 'btn-success'}`}
                        onClick={() => toggleActive(u.id)}
                        title={u.active ? 'Lock Account' : 'Unlock Account'}
                      >
                        {u.active ? <><Lock size={12} /> Lock</> : <><Unlock size={12} /> Unlock</>}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        style={{ color: 'var(--danger-400)' }}
                        title="Delete User"
                        onClick={() => handleDeleteUser(u)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Timestamp</th><th>Action Code</th><th>User</th><th>Audit Event Details</th></tr>
            </thead>
            <tbody>
              {AUDIT_LOG.map(a => {
                const u = USERS.find(x => x.id === a.userId);
                return (
                  <tr key={a.id}>
                    <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {format(new Date(a.timestamp), 'MMM d, yyyy · HH:mm')}
                    </td>
                    <td>
                      <span className="badge badge-primary" style={{ fontSize: 10 }}>{a.action}</span>
                    </td>
                    <td style={{ fontSize: 13 }}>{u?.avatar || '👤'} {u?.name || a.userId}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{a.detail}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {Object.entries(ROLES).map(([key, role]) => {
            const roleUsers = USERS.filter(u => u.role === key);
            const PERMISSIONS_MAP = {
              admin: ['Dashboard', 'Users & Security', 'Settings', 'Consolidated Reports', 'Service Job Assignments', 'Refund Approvals', 'Warranty Policy', 'Complaint Escalations', 'All POS & Sales', 'All Inventory & Stock', 'Purchasing & Suppliers', 'Finance & Cash Flow'],
              sales: ['POS Checkout', 'Sales Orders', 'Invoices', 'Customers', 'Warranty Verification', 'Installation Requests', 'Process Returns & Refunds', 'Log Complaints', 'Sales Reports'],
              storekeeper: ['Real-time Stock Levels', 'Product Information', 'Categories', 'Stock In (Receiving)', 'Stock Out (Adjustments)', 'Batch & Serial Numbers', 'Stock Consistency Verification', 'Service Spare Parts Issuance', 'Return Inspections', 'Stock Reports'],
              purchase: ['Supplier Directory', 'Purchase Orders', 'Select Supplier & Quotes', 'Track PO Status', 'Stock Receiving with Auto-Increment', 'Notify Finance Payable', 'Urgent Reorder for Exchanged Products'],
              finance: ['Customer Payments', 'Supplier Payables', 'Outstanding Invoices Tracking', 'Payment Reminders', 'Approve Credit Limits', 'Process Approved Refunds', 'Reconcile Sales & Purchases', 'Financial Reports'],
              technician: ['Assigned Service Jobs', 'Installation Completion', 'Maintenance Visit Logs', 'Repair & Fault Logging', 'Request Store Spare Parts', 'Exchange Recommendations', 'Service Visit History'],
            };
            return (
              <div key={key} className="card-elevated" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{role.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{roleUsers.length} staff member{roleUsers.length !== 1 ? 's' : ''}</div>
                  </div>
                  <span className={`badge badge-${role.color}`}>{key}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {(PERMISSIONS_MAP[key] || []).map(p => (
                    <span key={p} className="badge badge-gray" style={{ fontSize: 10 }}>{p}</span>
                  ))}
                </div>
                <div className="divider" style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Assigned Staff:</span>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {roleUsers.map(u => (
                      <span key={u.id} style={{ fontSize: 18 }} title={`${u.name} (${u.email})`}>{u.avatar}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <UserModal
          user={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}
