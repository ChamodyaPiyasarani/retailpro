// Refund Form – SD "Process approved refund"
import { useState } from 'react';
import Refund from '../classes/Refund';
import { readAll, money } from '../classes/db';
import { PageHeader, Modal, Field, useLoad, useAction, Loading, Empty, nameOf } from '../components/ui';

export default function RefundsPage() {
  const { data, error, reload } = useLoad(async () => ({ reqs: await readAll('return_request', { status: 'Approved' }, 'request_id'), products: await readAll('product'), refunds: await readAll('refund'), items: await readAll('sales_order_item') }));
  const { act, busy } = useAction();
  const [sel, setSel] = useState(null);
  if (!data) return <Loading error={error} />;
  const price = (r) => data.items.find(i => i.order_id === r.order_id && i.product_id === r.product_id)?.unit_price || 0;
  const submit = async () => { if (await act(() => Refund.process({ request_id: sel.request_id, amount: sel.amount, method: sel.method }), 'Refund processed')) { setSel(null); reload(); } };
  return (
    <div>
      <PageHeader title="Refunds" subtitle="Return requests approved by the manager" />
      {data.reqs.length === 0 ? <Empty text="No approved requests to refund" /> : (
        <div className="table-container"><table className="table">
          <thead><tr><th>Request</th><th>Approved</th><th>Order</th><th>Product</th><th>Sold for</th><th></th></tr></thead>
          <tbody>{data.reqs.map(r => <tr key={r.request_id}><td>RET-{r.request_id}</td><td>{r.approved_date}</td><td>SO-{r.order_id}</td><td>{nameOf(data.products, 'product_id', r.product_id, 'product_name')}</td><td>{money(price(r))}</td>
            <td><button className="btn btn-primary btn-sm" onClick={() => setSel({ ...r, amount: price(r), method: 'Cash' })}>Refund</button></td></tr>)}</tbody>
        </table></div>
      )}
      <div className="card" style={{ marginTop: 16 }}><div className="chart-title">Refunds paid</div>
        <table className="table"><thead><tr><th>Refund</th><th>Date</th><th>Request</th><th>Method</th><th>Amount</th></tr></thead>
          <tbody>{data.refunds.map(r => <tr key={r.refund_id}><td>RF-{r.refund_id}</td><td>{r.refund_date}</td><td>RET-{r.request_id}</td><td>{r.method}</td><td>{money(r.amount)}</td></tr>)}</tbody></table></div>
      {sel && (
        <Modal title={`Refund RET-${sel.request_id}`} onClose={() => setSel(null)} footer={<><button className="btn btn-outline" onClick={() => setSel(null)}>Cancel</button><button id="refund-submit" className="btn btn-primary" disabled={busy} onClick={submit}>Process refund</button></>}>
          <Field label="Refund amount (Rs.)"><input id="refund-amount" type="number" className="form-input" value={sel.amount} onChange={e => setSel({ ...sel, amount: e.target.value })} /></Field>
          <Field label="Refund method"><select id="refund-method" className="form-select" value={sel.method} onChange={e => setSel({ ...sel, method: e.target.value })}><option>Cash</option><option>Bank transfer</option></select></Field>
        </Modal>
      )}
    </div>
  );
}
