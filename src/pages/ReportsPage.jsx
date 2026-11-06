// Report Form – SD "Generate business report", "Generate stock report", "Generate financial report"
// Each of the 3 report use cases has several reports (see REPORTS in classes/Report.js).
import { useState } from 'react';
import { Download, FileBarChart, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Report, { REPORTS } from '../classes/Report';
import { today, addDays, money } from '../classes/db';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Field, Badge, useLoad, useAction, Loading, Empty } from '../components/ui';

const STATUS = ['Low stock', 'Completed', 'Pending', 'Approved', 'Rejected', 'Refunded', 'Assigned', 'In Progress', 'Received', 'Paid'];
const notMoney = (rep) => /Quantity|Jobs|Items|Return requests|Stock against/.test(rep.chart?.title || '');

export default function ReportsPage() {
  const { user, can } = useAuth();
  const mine = REPORTS.filter(r => can(r.perm));
  const groups = [...new Set(mine.map(r => r.group))];
  const [f, setF] = useState({ key: mine[0]?.key, from: addDays(today(), -30), to: today() });
  const [rep, setRep] = useState(null);
  const { act, busy } = useAction();
  const { data: saved, reload } = useLoad(async () => (await Report.getAll()).filter(r => r.def && can(r.def.perm)));
  const show = (r) => { setRep(r); window.scrollTo?.({ top: 0, behavior: 'smooth' }); };
  const generate = async () => { const r = await act(() => Report.generate({ ...f, userId: user.user_id }), x => `${x.name} ready`); if (r) { show(r); reload(); } };
  // open a saved report again (reads the data again for the same dates, does not save a new report)
  const reopen = async (s) => {
    const r = await act(async () => ({ ...(await Report.calculateTotals(s.def.key, s.from_date, s.to_date)), key: s.def.key, name: s.def.name, group: s.def.group, from: s.from_date, to: s.to_date, report: s }));
    if (r) show(r);
  };
  const chosen = REPORTS.find(r => r.key === f.key);
  const many = (rep?.chart?.data?.length || 0) > 7;
  return (
    <div>
      <PageHeader title="Reports" subtitle={`${mine.length} reports you can make`} />
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-row-3">
          <Field label="Report"><select id="rep-type" className="form-select" value={f.key} onChange={e => setF({ ...f, key: e.target.value })}>
            {groups.map(g => <optgroup key={g} label={`${g} reports`}>{mine.filter(r => r.group === g).map(r => <option key={r.key} value={r.key}>{r.name}</option>)}</optgroup>)}</select></Field>
          <Field label="From"><input id="rep-from" type="date" className="form-input" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} /></Field>
          <Field label="To"><input id="rep-to" type="date" className="form-input" value={f.to} max={today()} onChange={e => setF({ ...f, to: e.target.value })} /></Field>
        </div>
        {chosen && <p className="text-muted" style={{ marginTop: 0 }}>{chosen.about}</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button id="rep-generate" className="btn btn-primary" disabled={busy || !f.key} onClick={generate}><FileBarChart size={15} /> Generate report</button>
          {[['Last 7 days', 7], ['Last 30 days', 30], ['Last 90 days', 90], ['Last year', 365]].map(([l, d]) => (
            <button key={d} className="btn btn-ghost btn-sm" onClick={() => setF({ ...f, from: addDays(today(), -d), to: today() })}>{l}</button>))}
        </div>
      </div>

      {rep && (
        <div className="card" id="report-view" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div><div className="chart-title" style={{ marginBottom: 2 }}>{rep.name}</div><div className="text-muted" style={{ fontSize: 13 }}>{rep.group} report · {rep.from} to {rep.to}{rep.report?.report_id ? ` · RPT-${rep.report.report_id}` : ''}</div></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => window.print()}>Print</button>
              <button id="rep-export" className="btn btn-outline btn-sm" onClick={() => Report.export(rep)}><Download size={14} /> Export PDF</button>
            </div>
          </div>
          <div className="stat-grid" style={{ margin: '14px 0' }}>
            {rep.summary.map(([k, v]) => <div key={k} className="stat-card"><div className="stat-card-label">{k}</div><div className="stat-card-value" style={{ fontSize: 20 }}>{v}</div></div>)}
          </div>
          {rep.chart?.data?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="chart-title" style={{ fontSize: 14 }}>{rep.chart.title}</div>
              <ResponsiveContainer width="100%" height={many ? 280 : 240}>
                <BarChart data={rep.chart.data}>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={many ? -35 : 0} textAnchor={many ? 'end' : 'middle'} height={many ? 70 : 30} />
                  <YAxis width={80} />
                  <Tooltip formatter={v => (notMoney(rep) ? v : money(v))} />
                  {rep.chart.labels && <Legend />}
                  <Bar dataKey="value" name={rep.chart.labels?.[0] || rep.chart.title} fill="#3b82f6" />
                  {rep.chart.labels && <Bar dataKey="value2" name={rep.chart.labels[1]} fill="#f59e0b" />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {rep.rows.length === 0 ? <Empty text="No records for these dates" /> : (
            <div className="table-container"><table className="table"><thead><tr>{rep.head.map(h => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>{rep.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{STATUS.includes(c) ? <Badge text={c} /> : c}</td>)}</tr>)}</tbody></table></div>
          )}
        </div>
      )}

      <div className="card">
        <div className="chart-title">Report history</div>
        {!saved ? <Loading /> : saved.length === 0 ? <Empty text="No reports made yet" /> : (
          <div className="table-container"><table className="table">
            <thead><tr><th>No</th><th>Report</th><th>From</th><th>To</th><th>Made on</th><th>Made by</th><th></th></tr></thead>
            <tbody>{saved.slice(0, 30).map(r => <tr key={r.report_id}><td>RPT-{r.report_id}</td><td>{r.def.name}</td><td>{r.from_date}</td><td>{r.to_date}</td><td>{r.created_date}</td><td>{r.user_name}</td>
              <td><button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => reopen(r)}><Eye size={14} /> Open</button></td></tr>)}</tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
