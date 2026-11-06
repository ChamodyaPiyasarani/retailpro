// Invoice Form – SD "View outstanding invoices" (extend: Send payment reminder) and the invoice history
import { useState } from 'react';
import { Mail, Eye, Search } from 'lucide-react';
import Invoice from '../classes/Invoice';
import { money } from '../classes/db';
import { useAuth } from '../context/AuthContext';
import InvoiceView from '../components/InvoiceView';
import { PageHeader, Field, Badge, useLoad, useAction, Loading, Empty } from '../components/ui';

function OutstandingTab({ onView }) {
  const { data, error } = useLoad(() => Invoice.getAll({ status: 'Unpaid' }));
  const { act } = useAction();
  if (!data) return <Loading error={error} />;
  const rows = [...data].sort((a, b) => a.due_date.localeCompare(b.due_date));
  const total = rows.reduce((s, i) => s + i.balance, 0);
  const overdue = rows.filter(i => i.overdue);
  return (<>
    <div className="stat-grid" style={{ marginBottom: 14 }}>
      <div className="stat-card"><div className="stat-card-label">Unpaid invoices</div><div className="stat-card-value">{rows.length}</div></div>
      <div className="stat-card"><div className="stat-card-label">Still to receive</div><div className="stat-card-value">{money(total)}</div></div>
      <div className="stat-card"><div className="stat-card-label">Overdue invoices</div><div className="stat-card-value text-danger">{overdue.length}</div></div>
      <div className="stat-card"><div className="stat-card-label">Overdue amount</div><div className="stat-card-value text-danger">{money(overdue.reduce((s, i) => s + i.balance, 0))}</div></div>
    </div>
    {rows.length === 0 ? <Empty text="All invoices are paid" /> : (
      <div className="table-container"><table className="table">
        <thead><tr><th>Invoice</th><th>For</th><th>Customer</th><th>Date</th><th>Due</th><th>Amount</th><th>Balance</th><th>Status</th><th></th></tr></thead>
        <tbody>{rows.map(i => (
          <tr key={i.invoice_id}><td>INV-{i.invoice_id}</td><td>{i.order_id ? `SO-${i.order_id}` : `JOB-${i.job_id}`}</td><td>{i.customer_name}</td><td>{i.invoice_date}</td><td>{i.due_date}</td>
            <td>{money(i.amount)}</td><td>{money(i.balance)}</td><td>{i.overdue ? <Badge text="Overdue" /> : <Badge text="Unpaid" />}</td>
            <td className="table-action-cell"><button className="btn btn-ghost btn-sm" onClick={() => onView(i.invoice_id)}><Eye size={14} /> View</button>
              {i.overdue && <button className="btn btn-ghost btn-sm" onClick={() => act(() => Invoice.sendReminder(i, i.customer), 'Reminder sent')}><Mail size={14} /> Send reminder</button>}</td></tr>
        ))}</tbody>
      </table></div>
    )}
  </>);
}

function HistoryTab({ onView }) {
  const [f, setF] = useState({ text: '', status: '', from: '', to: '' });
  const { data, error } = useLoad(() => Invoice.getAll(f), [f.text, f.status, f.from, f.to]);
  return (<>
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="form-row-3" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
        <Field label="Search"><div className="search-bar"><Search size={15} /><input id="inv-search" placeholder="Invoice number, customer name or phone" value={f.text} onChange={e => setF({ ...f, text: e.target.value })} /></div></Field>
        <Field label="Status"><select id="inv-status" className="form-select" value={f.status} onChange={e => setF({ ...f, status: e.target.value })}><option value="">All</option><option>Paid</option><option>Unpaid</option><option>Overdue</option></select></Field>
        <Field label="From"><input type="date" className="form-input" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} /></Field>
        <Field label="To"><input type="date" className="form-input" value={f.to} onChange={e => setF({ ...f, to: e.target.value })} /></Field>
      </div>
    </div>
    {!data ? <Loading error={error} /> : data.length === 0 ? <Empty text="No invoices found" /> : (<>
      <p className="text-muted">{data.length} invoice(s) · total {money(data.reduce((s, i) => s + Number(i.amount), 0))} · received {money(data.reduce((s, i) => s + Number(i.paid_amount), 0))}</p>
      <div className="table-container"><table className="table" id="invoice-history">
        <thead><tr><th>Invoice</th><th>Date</th><th>For</th><th>Customer</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th><th></th></tr></thead>
        <tbody>{data.map(i => (
          <tr key={i.invoice_id}><td>INV-{i.invoice_id}</td><td>{i.invoice_date}</td><td>{i.order_id ? `Sale SO-${i.order_id}` : `Service JOB-${i.job_id}`}</td><td>{i.customer_name}</td>
            <td>{money(i.amount)}</td><td>{money(i.paid_amount)}</td><td>{money(i.balance)}</td><td>{i.overdue ? <Badge text="Overdue" /> : <Badge text={i.status} />}{i.order_status === 'Cancelled' && <> <Badge text="Cancelled" /></>}</td>
            <td><button className="btn btn-ghost btn-sm" onClick={() => onView(i.invoice_id)}><Eye size={14} /> View</button></td></tr>
        ))}</tbody>
      </table></div>
    </>)}
  </>);
}

export default function InvoicesPage() {
  const { can } = useAuth();
  const tabs = [['outstanding', 'Outstanding invoices', can('View outstanding invoices'), OutstandingTab], ['history', 'Invoice history', true, HistoryTab]].filter(t => t[2]);
  const [tab, setTab] = useState(tabs[0][0]);
  const [view, setView] = useState(null);
  const Tab = tabs.find(t => t[0] === tab)[3];
  return (
    <div>
      <PageHeader title="Invoices" subtitle="Sales invoices and service invoices" />
      <div className="tabs" style={{ marginBottom: 14 }}>{tabs.map(t => <button key={t[0]} id={`tab-${t[0]}`} className={`tab-btn ${tab === t[0] ? 'active' : ''}`} onClick={() => setTab(t[0])}>{t[1]}</button>)}</div>
      <Tab onView={setView} />
      {view && <InvoiceView invoiceId={view} onClose={() => setView(null)} />}
    </div>
  );
}
