// Payment Form – SD "Process customer payment" (include: Print receipt),
// SD "Record supplier payment" and SD "View all payments"
import { useState } from 'react';
import { Search, Eye } from 'lucide-react';
import InvoiceView from '../components/InvoiceView';
import CustomerPayment from '../classes/CustomerPayment';
import SupplierPayment from '../classes/SupplierPayment';
import Payment from '../classes/Payment';
import Invoice from '../classes/Invoice';
import { readAll, money, today, addDays } from '../classes/db';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Modal, Field, Badge, useLoad, useAction, Loading, Empty, nameOf } from '../components/ui';

function CustomerTab() {
  const { user } = useAuth();
  const { act, busy } = useAction();
  const [no, setNo] = useState('');
  const [inv, setInv] = useState(null);
  const [pay, setPay] = useState({ amount: '', method: 'Cash' });
  const [receipt, setReceipt] = useState(null);
  const [view, setView] = useState(null);
  const find = async () => {
    const i = await act(async () => {
      const x = await Invoice.find(Number(String(no).replace(/\D/g, '')));
      if (!x) throw new Error('No invoice with this number.');
      return { ...x, payments: await readAll('payment', { invoice_id: x.invoice_id }, 'payment_id') };
    });
    if (i) { setInv(i); setPay({ amount: (Number(i.amount) - Number(i.paid_amount)).toFixed(2), method: 'Cash' }); }
  };
  const submit = async () => {
    const r = await act(() => CustomerPayment.pay({ invoice_id: inv.invoice_id, amount: pay.amount, method: pay.method, user_id: user.user_id }), 'Payment successful');
    if (r) { setReceipt(r.receipt); setInv(null); setNo(''); }
  };
  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <Field label="Invoice number"><input id="pay-invoice" className="form-input" placeholder="e.g. 12 or INV-12" value={no} onChange={e => setNo(e.target.value)} /></Field>
        <div className="form-group"><button id="pay-find" className="btn btn-outline" disabled={!no || busy} onClick={find}><Search size={14} /> Find</button></div>
      </div>
      {inv && (<>
        <p>Invoice INV-{inv.invoice_id} ({inv.order_id ? `sales order SO-${inv.order_id}` : `service job JOB-${inv.job_id}`}) – amount {money(inv.amount)}, paid {money(inv.paid_amount)} <Badge text={inv.status} /></p>
        <button className="btn btn-ghost btn-sm" onClick={() => setView(inv.invoice_id)}><Eye size={14} /> View invoice</button>
        {inv.payments.length > 0 && (
          <table className="table" style={{ maxWidth: 620, margin: '8px 0' }}><thead><tr><th>Earlier payment</th><th>Receipt</th><th>Method</th><th>Amount</th></tr></thead>
            <tbody>{inv.payments.map(p => <tr key={p.payment_id}><td>{p.payment_date}</td><td>{p.receipt_no}</td><td>{p.method}</td><td>{money(p.amount)}</td></tr>)}</tbody></table>
        )}
        {inv.status === 'Paid' ? <div className="alert alert-success">This invoice is fully paid.</div> : (<>
        <p id="pay-due" style={{ fontSize: 18, fontWeight: 700 }}>Amount to pay: {money(Number(inv.amount) - Number(inv.paid_amount))}</p>
        <div className="form-row-2">
          <Field label="Amount (Rs.)"><input id="pay-amount" type="number" className="form-input" value={pay.amount} onChange={e => setPay({ ...pay, amount: e.target.value })} /></Field>
          <Field label="Payment method"><select id="pay-method" className="form-select" value={pay.method} onChange={e => setPay({ ...pay, method: e.target.value })}><option>Cash</option><option>Card</option><option>Bank transfer</option></select></Field>
        </div>
        <button id="pay-submit" className="btn btn-primary" disabled={busy} onClick={submit}>Record payment</button>
        </>)}
      </>)}
      {view && <InvoiceView invoiceId={view} onClose={() => setView(null)} />}
      {receipt && (
        <Modal title="Receipt" onClose={() => setReceipt(null)} footer={<><button className="btn btn-outline" onClick={() => window.print()}>Print</button><button className="btn btn-primary" onClick={() => setReceipt(null)}>Done</button></>}>
          <div id="receipt-view"><p><b>Rajida Holdings – Receipt {receipt.receipt_no}</b></p><p>Date: {receipt.date}</p><p>For: {receipt.invoice}</p><p>Paid: {money(receipt.amount)} by {receipt.method}</p><p>Balance: {money(receipt.balance)}</p></div>
        </Modal>
      )}
    </div>
  );
}

function SupplierTab() {
  const { user } = useAuth();
  const { act, busy } = useAction();
  const { data, error, reload } = useLoad(async () => ({ pos: await readAll('purchase_order', { status: 'Received' }), sups: await readAll('supplier'), allPos: await readAll('purchase_order'), paid: (await readAll('payment', { payment_type: 'Supplier' }, 'payment_id')).reverse() }));
  const [sel, setSel] = useState(null);
  if (!data) return <Loading error={error} />;
  const submit = async () => { if (await act(() => SupplierPayment.recordCheque({ po_id: sel.po_id, amount: sel.amount, cheque_no: sel.cheque_no, user_id: user.user_id }), 'Supplier paid')) { setSel(null); reload(); } };
  return (
    <div className="card">
      <p className="text-muted">Received purchase orders that are not paid yet</p>
      {data.pos.length === 0 ? <Empty text="Nothing to pay" /> : (
        <table className="table"><thead><tr><th>PO</th><th>Supplier</th><th>Date</th><th>Amount</th><th></th></tr></thead>
          <tbody>{data.pos.map(p => <tr key={p.po_id}><td>PO-{p.po_id}</td><td>{nameOf(data.sups, 'supplier_id', p.supplier_id, 'supplier_name')}</td><td>{p.order_date}</td><td>{money(p.total_amount)}</td>
            <td><button className="btn btn-primary btn-sm" onClick={() => setSel({ ...p, amount: p.total_amount, cheque_no: '' })}>Pay</button></td></tr>)}</tbody></table>
      )}
      <div className="chart-title" style={{ marginTop: 18 }}>Supplier payment history</div>
      {data.paid.length === 0 ? <Empty text="No supplier payments yet" /> : (
        <table className="table" id="supplier-pay-history"><thead><tr><th>Date</th><th>PO</th><th>Supplier</th><th>Cheque no</th><th>Amount</th></tr></thead>
          <tbody>{data.paid.slice(0, 30).map(p => <tr key={p.payment_id}><td>{p.payment_date}</td><td>PO-{p.po_id}</td>
            <td>{nameOf(data.sups, 'supplier_id', data.allPos.find(x => x.po_id === p.po_id)?.supplier_id, 'supplier_name')}</td><td>{p.cheque_no}</td><td>{money(p.amount)}</td></tr>)}</tbody></table>
      )}
      {sel && (
        <Modal title={`Pay PO-${sel.po_id}`} onClose={() => setSel(null)} footer={<><button className="btn btn-outline" onClick={() => setSel(null)}>Cancel</button><button id="spay-submit" className="btn btn-primary" disabled={busy} onClick={submit}>Record payment</button></>}>
          <Field label="Amount (Rs.)"><input id="spay-amount" type="number" className="form-input" value={sel.amount} onChange={e => setSel({ ...sel, amount: e.target.value })} /></Field>
          <Field label="Cheque number *"><input id="spay-cheque" className="form-input" value={sel.cheque_no} onChange={e => setSel({ ...sel, cheque_no: e.target.value })} /></Field>
        </Modal>
      )}
    </div>
  );
}

function AllTab() {
  const [view, setView] = useState(null);
  const [f, setF] = useState({ type: '', from: addDays(today(), -30), to: today() });
  const { data, error } = useLoad(() => Payment.viewAll(f), [f.type, f.from, f.to]);
  return (
    <div className="card">
      <div className="form-row-3">
        <Field label="Type"><select id="allpay-type" className="form-select" value={f.type} onChange={e => setF({ ...f, type: e.target.value })}><option value="">Customer and supplier</option><option>Customer</option><option>Supplier</option></select></Field>
        <Field label="From"><input type="date" className="form-input" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} /></Field>
        <Field label="To"><input type="date" className="form-input" value={f.to} onChange={e => setF({ ...f, to: e.target.value })} /></Field>
      </div>
      {!data ? <Loading error={error} /> : data.rows.length === 0 ? <Empty text="No payments for these dates" /> : (<>
        <p id="allpay-total" style={{ fontWeight: 700 }}>{data.rows.length} payment(s), total {money(data.total)}</p>
        <table className="table"><thead><tr><th>Date</th><th>Type</th><th>For</th><th>Method</th><th>Receipt / cheque</th><th>Amount</th></tr></thead>
          <tbody>{data.rows.map(p => <tr key={p.payment_id}><td>{p.payment_date}</td><td><Badge text={p.payment_type} /></td><td>{p.invoice_id ? <button className="btn btn-ghost btn-sm" onClick={() => setView(p.invoice_id)}>INV-{p.invoice_id}</button> : `PO-${p.po_id}`}</td><td>{p.method}</td><td>{p.receipt_no || p.cheque_no}</td><td>{money(p.amount)}</td></tr>)}</tbody></table>
      </>)}
      {view && <InvoiceView invoiceId={view} onClose={() => setView(null)} />}
    </div>
  );
}

export default function PaymentsPage() {
  const { can } = useAuth();
  const tabs = [['customer', 'Customer payment', 'Process customer payment', CustomerTab], ['supplier', 'Supplier payment', 'Record supplier payment', SupplierTab], ['all', 'All payments', 'View all payments', AllTab]].filter(t => can(t[2]));
  const [tab, setTab] = useState(tabs[0][0]);
  const Tab = tabs.find(t => t[0] === tab)[3];
  return (
    <div>
      <PageHeader title="Payments" />
      <div className="tabs" style={{ marginBottom: 14 }}>{tabs.map(t => <button key={t[0]} id={`tab-${t[0]}`} className={`tab-btn ${tab === t[0] ? 'active' : ''}`} onClick={() => setTab(t[0])}>{t[1]}</button>)}</div>
      <Tab />
    </div>
  );
}
