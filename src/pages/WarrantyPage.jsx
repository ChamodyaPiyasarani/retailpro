// Warranty Form – SD "Check warranty status"
import { useState } from 'react';
import { ShieldCheck, ShieldX } from 'lucide-react';
import Warranty from '../classes/Warranty';
import { readAll, run, table } from '../classes/db';
import { PageHeader, Field, useAction } from '../components/ui';

// the products of an invoice (to choose from)
export async function productsOfInvoice(invoiceNo) {
  const id = Number(String(invoiceNo).replace(/\D/g, ''));
  const inv = (await run(table('invoice').select('*').eq('invoice_id', id)))[0];
  if (!inv?.order_id) return [];
  const items = await readAll('sales_order_item', { order_id: inv.order_id });
  const products = await readAll('product');
  return items.map(i => ({ product_id: i.product_id, product_name: products.find(p => p.product_id === i.product_id)?.product_name }));
}

export default function WarrantyPage() {
  const { act, busy } = useAction();
  const [no, setNo] = useState('');
  const [items, setItems] = useState([]);
  const [pid, setPid] = useState('');
  const [res, setRes] = useState(null);
  const loadItems = async (v) => { setNo(v); setRes(null); setPid(''); setItems(v ? await productsOfInvoice(v).catch(() => []) : []); };
  const check = async () => { const r = await act(() => Warranty.checkStatus(Number(no.replace(/\D/g, '')), Number(pid))); if (r) setRes(r); };
  return (
    <div>
      <PageHeader title="Warranty Check" subtitle="Enter the invoice number and choose the product" />
      <div className="card" style={{ maxWidth: 560 }}>
        <Field label="Invoice number"><input id="w-invoice" className="form-input" placeholder="e.g. 12 or INV-12" value={no} onChange={e => loadItems(e.target.value)} /></Field>
        <Field label="Product"><select id="w-product" className="form-select" value={pid} onChange={e => setPid(e.target.value)}>
          <option value="">{items.length ? '— choose —' : 'enter a sales invoice number first'}</option>{items.map(i => <option key={i.product_id} value={i.product_id}>{i.product_name}</option>)}</select></Field>
        <button id="w-check" className="btn btn-primary" disabled={!no || !pid || busy} onClick={check}><ShieldCheck size={15} /> Check warranty</button>
        {res && (
          <div id="w-result" className={`alert alert-${res.valid ? 'success' : 'danger'}`} style={{ marginTop: 14 }}>
            {res.valid ? <ShieldCheck size={16} /> : <ShieldX size={16} />} {res.message}{res.warranty && <> (started {res.warranty.start_date})</>}
          </div>
        )}
      </div>
    </div>
  );
}
