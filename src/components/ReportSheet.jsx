// On-screen report that looks the same as the downloaded PDF report:
// company header, report title, summary cards, grouped tables with
// subtotals and a dark grand-total row, and the confidential footer.
import { format } from 'date-fns';
import './ReportSheet.css';

export default function ReportSheet({ report, reportType, generatedBy }) {
  const now = new Date();
  const reportId = `RP-${reportType.toUpperCase()}-${format(now, 'yyyyMMdd-HHmm')}`;

  return (
    <div className="rp-sheet" id="report-preview">
      <div className="rp-topbar" />

      <header className="rp-head">
        <div>
          <div className="rp-company">Rajida Holdings</div>
          <div className="rp-tagline">Computer Hardware, IT Parts &amp; Services</div>
        </div>
        <div className="rp-meta">
          <div>Report ID: {reportId}</div>
          <div>Generated: {format(now, 'MMMM dd, yyyy · hh:mm a')}</div>
          <div>Prepared By: {generatedBy}</div>
        </div>
      </header>

      <div className="rp-title">{report.title}</div>
      <div className="rp-subtitle">{report.subtitle}</div>

      <div className="rp-kpis">
        {report.kpis.map(k => (
          <div key={k.label} className="rp-kpi" style={{ '--kpi': k.color }}>
            <div className="rp-kpi-label">{k.label}</div>
            <div className="rp-kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      {report.sections.map(sec => (
        <section key={sec.heading} className="rp-section">
          <h3 className="rp-section-title">{sec.heading}</h3>
          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr>{sec.headers.map((h, i) => <th key={h} style={{ textAlign: sec.align[i] }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {sec.rows.map((r, ri) => r.group ? (
                  <tr key={ri} className="rp-group"><td colSpan={sec.headers.length}>{r.group}</td></tr>
                ) : (
                  <tr key={ri} className={r.subtotal ? 'rp-subtotal' : undefined}>
                    {(r.subtotal || r).map((c, ci) => <td key={ci} style={{ textAlign: sec.align[ci] }}>{c}</td>)}
                  </tr>
                ))}
              </tbody>
              {sec.total && (
                <tfoot>
                  <tr>{sec.total.map((c, ci) => <td key={ci} style={{ textAlign: sec.align[ci] }}>{c}</td>)}</tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      ))}

      <footer className="rp-foot">
        <span>Rajida Holdings · Confidential management report</span>
        <span>{reportId}</span>
      </footer>
    </div>
  );
}
