// Invoice details in a window: customer, items (or service job), discount, payments made,
// warranty of each item, and any return / refund. Used by Invoices, Sales history, Payments and Customers.
import Invoice from '../classes/Invoice';
import { money } from '../classes/db';
import { Modal, Badge, useLoad, Loading, Empty } from './ui';

export default function InvoiceView({ invoiceId, onClose }) {
  const { data: d, error } = useLoad(() => Invoice.getDetails(invoiceId), [invoiceId]);
  const footer = <><button className="btn btn-outline" onClick={() => window.print()}>Print</button><button className="btn btn-primary" onClick={onClose}>Close</button></>;
  if (!d) return <Modal title={`Invoice INV-${invoiceId}`} onClose={onClose}><Loading error={error} /></Modal>;
  const i = d.invoice;
  return (
    <Modal wide title={`Invoice INV-${i.invoice_id}`} onClose={onClose} footer={footer}>
      <div id="invoice-detail">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
          <div>
            <div><b>Rajida Holdings</b></div>
            <div>{d.order ? `Sales order SO-${d.order.order_id}` : `Service job JOB-${d.job?.job_id}`} {d.order && <Badge text={d.order.status} />}</div>
            <div>Invoice date: {i.invoice_date} · Due: {i.due_date}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div><b>{d.customer?.name || '—'}</b></div><div>{d.customer?.phone}</div><div>{d.customer?.email}</div>
            <div style={{ marginTop: 4 }}>{i.overdue ? <Badge text="Overdue" /> : <Badge text={i.status} />}</div>
          </div>
        </div>

        {d.order ? (
          <table className="table"><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Subtotal</th><th>Warranty until</th></tr></thead>
            <tbody>{d.items.map(it => <tr key={it.item_id}><td>{it.product_name}</td><td>{it.quantity}</td><td>{money(it.unit_price)}</td><td>{money(it.subtotal)}</td>
              <td>{it.warranty ? <>{it.warranty.end_date} <Badge text={it.warranty.end_date >= new Date().toISOString().slice(0, 10) ? 'Active' : 'Expired'} /></> : '—'}</td></tr>)}</tbody></table>
        ) : d.job && (
          <table className="table"><tbody>
            <tr><td>Service</td><td>{d.job.job_type} – {d.job.product_name}</td></tr><tr><td>Fault</td><td>{d.job.fault}</td></tr>
            <tr><td>Completed</td><td>{d.job.completed_date || '—'}</td></tr><tr><td>Service charge</td><td>{money(d.job.service_charge)}</td></tr></tbody></table>
        )}

        <div style={{ textAlign: 'right', margin: '10px 0' }}>
          {d.order && <div>Subtotal: {money(d.order.subtotal)}</div>}
          {d.order && Number(d.order.discount_amount) > 0 && <div className="text-success">Discount {d.discount?.discount_code} ({Number(d.discount?.rate)}%): − {money(d.order.discount_amount)}</div>}
          <div style={{ fontSize: 18, fontWeight: 800 }}>Invoice amount: {money(i.amount)}</div>
          <div>Paid: {money(i.paid_amount)} · <b>Balance: {money(i.balance)}</b></div>
        </div>

        <div className="chart-title" style={{ fontSize: 14 }}>Payments for this invoice</div>
        {d.payments.length === 0 ? <Empty text="No payments yet" /> : (
          <table className="table"><thead><tr><th>Date</th><th>Receipt</th><th>Method</th><th>Received by</th><th>Amount</th></tr></thead>
            <tbody>{d.payments.map(p => <tr key={p.payment_id}><td>{p.payment_date}</td><td>{p.receipt_no}</td><td>{p.method}</td><td>{p.user_name}</td><td>{money(p.amount)}</td></tr>)}</tbody></table>
        )}

        {d.returns.length > 0 && (<>
          <div className="chart-title" style={{ fontSize: 14, marginTop: 12 }}>Returns</div>
          <table className="table"><thead><tr><th>Request</th><th>Date</th><th>Product</th><th>Reason</th><th>Status</th><th>Refund</th></tr></thead>
            <tbody>{d.returns.map(r => <tr key={r.request_id}><td>RET-{r.request_id}</td><td>{r.request_date}</td><td>{r.product_name}</td><td>{r.reason}</td><td><Badge text={r.status} /></td>
              <td>{r.refund ? `${money(r.refund.amount)} (${r.refund.refund_date})` : '—'}</td></tr>)}</tbody></table>
        </>)}
      </div>
    </Modal>
  );
}
