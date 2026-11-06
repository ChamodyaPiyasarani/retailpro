// Sales Order Form – SD "Create sales order" and the sales history
// (include: Check stock, Generate invoice   extend: Apply discount)
import { useState } from 'react';
import { Plus, Trash2, Tag, Check, Eye, Search } from 'lucide-react';
import InvoiceView from '../components/InvoiceView';
import SalesOrder from '../classes/SalesOrder';
import Product from '../classes/Product';
import Customer from '../classes/Customer';
import { money } from '../classes/db';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Modal, Field, Badge, useLoad, useAction, Loading, Empty } from '../components/ui';

function NewOrderTab() {
  const { user } = useAuth();
  const { data, error, reload } = useLoad(async () => ({ customers: await Customer.getAll(), products: (await Product.getAll()).filter(p => p.is_active) }));
  const { act, busy } = useAction();
  const [order, setOrder] = useState(SalesOrder.create(null));
  const [pick, setPick] = useState({ product_id: '', quantity: 1 });
  const [code, setCode] = useState('');
  const [done, setDone] = useState(null);
  if (!data) return <Loading error={error} />;

  const add = async () => { const o = await act(() => SalesOrder.addItem(order, pick.product_id, pick.quantity)); if (o) { setOrder(o); setPick({ product_id: '', quantity: 1 }); } };
  const discount = async () => { const o = await act(() => SalesOrder.applyDiscount(order, code), 'Discount applied'); if (o) setOrder(o); };
  const confirm = async () => {
    const r = await act(() => SalesOrder.save(order, user.user_id), 'Order saved');
    if (r) { setDone({ ...r, customer: data.customers.find(c => c.customer_id === order.customer_id), lines: order.items }); setOrder(SalesOrder.create(null)); setCode(''); reload(); }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-row-2">
          <Field label="Customer *"><select id="so-customer" className="form-select" value={order.customer_id || ''} onChange={e => setOrder({ ...order, customer_id: Number(e.target.value) || null })}>
            <option value="">— select customer —</option>{data.customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.name} ({c.phone})</option>)}</select></Field>
          <div />
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 240 }}><Field label="Product"><select id="so-product" className="form-select" value={pick.product_id} onChange={e => setPick({ ...pick, product_id: e.target.value })}>
            <option value="">— select product —</option>{data.products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name} – {money(p.unit_price)} (stock {p.stock_qty})</option>)}</select></Field></div>
          <div style={{ width: 110 }}><Field label="Quantity"><input id="so-qty" type="number" min="1" className="form-input" value={pick.quantity} onChange={e => setPick({ ...pick, quantity: e.target.value })} /></Field></div>
          <div className="form-group"><button id="so-add" className="btn btn-outline" disabled={!pick.product_id || busy} onClick={add}><Plus size={15} /> Add item</button></div>
        </div>
      </div>
      <div className="card">
        {order.items.length === 0 ? <Empty text="No products added yet" /> : (
          <table className="table"><thead><tr><th>Product</th><th>Unit price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead>
            <tbody>{order.items.map(i => <tr key={i.product_id}><td>{i.product_name}</td><td>{money(i.unit_price)}</td><td>{i.quantity}</td><td>{money(i.subtotal)}</td>
              <td><button className="btn btn-ghost btn-sm text-danger" onClick={() => setOrder(SalesOrder.removeItem(order, i.product_id))}><Trash2 size={14} /></button></td></tr>)}</tbody></table>
        )}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 14 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input id="so-discount" className="form-input" style={{ width: 160 }} placeholder="Discount code" value={code} onChange={e => setCode(e.target.value)} />
            <button id="so-apply" className="btn btn-outline" disabled={!code || !order.items.length || busy} onClick={discount}><Tag size={14} /> Apply</button>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div>Subtotal: {money(order.subtotal)}</div>
            {order.discount && <div className="text-success">Discount {order.discount.discount_code} ({Number(order.discount.rate)}%): − {money(order.discount_amount)}</div>}
            <div id="so-total" style={{ fontSize: 22, fontWeight: 800 }}>Total: {money(order.total_amount)}</div>
            <button id="so-confirm" className="btn btn-primary" style={{ marginTop: 8 }} disabled={!order.items.length || !order.customer_id || busy} onClick={confirm}><Check size={15} /> Confirm order</button>
          </div>
        </div>
      </div>
      {done && (
        <Modal title={`Invoice INV-${done.invoice.invoice_id}`} onClose={() => setDone(null)} footer={<><button className="btn btn-outline" onClick={() => window.print()}>Print</button><button className="btn btn-primary" onClick={() => setDone(null)}>Done</button></>}>
          <div id="invoice-view">
            <p><b>Rajida Holdings</b> – Sales order SO-{done.order.order_id}, {done.order.order_date}</p>
            <p>Customer: {done.customer?.name}</p>
            <table className="table"><tbody>{done.lines.map(i => <tr key={i.product_id}><td>{i.product_name} × {i.quantity}</td><td className="text-right">{money(i.subtotal)}</td></tr>)}</tbody></table>
            {Number(done.order.discount_amount) > 0 && <p>Discount: − {money(done.order.discount_amount)}</p>}
            <p style={{ fontSize: 18, fontWeight: 800 }}>Amount to pay: {money(done.invoice.amount)}</p>
            <p className="text-muted">Due date: {done.invoice.due_date}. Pay at the cashier with this invoice number.</p>
          </div>
        </Modal>
      )}
    </div>
  );
}

function HistoryTab() {
  const [f, setF] = useState({ text: '', status: '', from: '', to: '' });
  const { data, error } = useLoad(() => SalesOrder.getHistory(f), [f.text, f.status, f.from, f.to]);
  const [view, setView] = useState(null);
  return (<>
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="form-row-3" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
        <Field label="Search"><div className="search-bar"><Search size={15} /><input id="so-search" placeholder="Order number, customer name or phone" value={f.text} onChange={e => setF({ ...f, text: e.target.value })} /></div></Field>
        <Field label="Status"><select id="so-status" className="form-select" value={f.status} onChange={e => setF({ ...f, status: e.target.value })}><option value="">All</option><option>Completed</option><option>Cancelled</option><option value="Unpaid">Not paid</option><option>Paid</option></select></Field>
        <Field label="From"><input type="date" className="form-input" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} /></Field>
        <Field label="To"><input type="date" className="form-input" value={f.to} onChange={e => setF({ ...f, to: e.target.value })} /></Field>
      </div>
    </div>
    {!data ? <Loading error={error} /> : data.length === 0 ? <Empty text="No sales orders found" /> : (<>
      <p className="text-muted">{data.length} order(s) · total {money(data.filter(o => o.status === 'Completed').reduce((s, o) => s + Number(o.total_amount), 0))}</p>
      <div className="table-container"><table className="table" id="sales-history">
        <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Discount</th><th>Total</th><th>Cashier</th><th>Order</th><th>Invoice</th><th></th></tr></thead>
        <tbody>{data.map(o => (
          <tr key={o.order_id}><td>SO-{o.order_id}</td><td>{o.order_date}</td><td>{o.customer_name}</td><td>{o.item_count}</td><td>{Number(o.discount_amount) > 0 ? money(o.discount_amount) : '—'}</td>
            <td>{money(o.total_amount)}</td><td>{o.cashier}</td><td><Badge text={o.status} /></td><td>{o.invoice ? <>INV-{o.invoice.invoice_id} <Badge text={o.invoice.status} /></> : '—'}</td>
            <td>{o.invoice && <button className="btn btn-ghost btn-sm" onClick={() => setView(o.invoice.invoice_id)}><Eye size={14} /> View</button>}</td></tr>
        ))}</tbody>
      </table></div>
    </>)}
    {view && <InvoiceView invoiceId={view} onClose={() => setView(null)} />}
  </>);
}

export default function SalesOrderPage() {
  const [tab, setTab] = useState('new');
  return (
    <div>
      <PageHeader title="Sales Orders" subtitle={tab === 'new' ? 'Select the customer, add products, then confirm the order' : 'All sales orders and their invoices'} />
      <div className="tabs" style={{ marginBottom: 14 }}>
        <button id="tab-new" className={`tab-btn ${tab === 'new' ? 'active' : ''}`} onClick={() => setTab('new')}>New sales order</button>
        <button id="tab-sales-history" className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Sales history</button>
      </div>
      {tab === 'new' ? <NewOrderTab /> : <HistoryTab />}
    </div>
  );
}
