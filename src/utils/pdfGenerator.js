import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Generates an executive, well-structured PDF report for RetailPro
 */
export function generateStructuredPDF({
  title,
  subtitle,
  reportType,
  generatedBy = 'System Admin',
  kpis = [],
  headers = [],
  rows = [],
  totals = null,
  fileName = 'report.pdf'
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const dateStr = format(now, 'MMMM dd, yyyy · hh:mm a');

  // --- 1. Top Decorative Brand Bar ---
  doc.setFillColor(37, 99, 235); // Royal Blue #2563eb
  doc.rect(0, 0, pageWidth, 5, 'F');

  // --- 2. Company Header ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('RetailPro Business Suite', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('Enterprise Retail & Service Management System · No. 45 Galle Road, Colombo, Sri Lanka', 14, 23);

  // Top right metadata badge
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Report ID: RP-${reportType.toUpperCase()}-${format(now, 'yyyyMMdd-HHmm')}`, pageWidth - 14, 16, { align: 'right' });
  doc.text(`Generated: ${dateStr}`, pageWidth - 14, 21, { align: 'right' });
  doc.text(`Prepared By: ${generatedBy}`, pageWidth - 14, 26, { align: 'right' });

  // Divider line
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.line(14, 30, pageWidth - 14, 30);

  // --- 3. Report Title Block ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 58, 138); // Primary dark #1e3a8a
  doc.text(title, 14, 39);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 44);
  }

  let currentY = subtitle ? 50 : 45;

  // --- 4. Executive Summary KPI Cards ---
  if (kpis && kpis.length > 0) {
    const cardGap = 4;
    const totalGap = cardGap * (kpis.length - 1);
    const cardWidth = (pageWidth - 28 - totalGap) / kpis.length;
    const cardHeight = 18;

    kpis.forEach((kpi, idx) => {
      const cardX = 14 + idx * (cardWidth + cardGap);
      // Background box
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.setDrawColor(203, 213, 225); // Slate 300
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

      // Top colored accent strip
      doc.setFillColor(kpi.color || '#3b82f6');
      doc.roundedRect(cardX, currentY, cardWidth, 1.5, 1, 1, 'F');

      // Label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(kpi.label.toUpperCase(), cardX + 4, currentY + 6.5);

      // Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(String(kpi.value), cardX + 4, currentY + 13.5);
    });

    currentY += cardHeight + 8;
  }

  // --- 5. Data Table ---
  autoTable(doc, {
    startY: currentY,
    head: [headers],
    body: rows,
    theme: 'striped',
    margin: { left: 14, right: 14, bottom: 24 },
    headStyles: {
      fillColor: [30, 64, 175], // #1e40af
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
      cellPadding: 3.5
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
      cellPadding: 3,
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Very light soft blue-gray
    },
    didDrawPage: (data) => {
      // Footer on every page
      const pageNum = doc.internal.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);

      // Left footer
      doc.text('RetailPro Confidential · Generated from RetailPro Management Portal', 14, pageHeight - 10);
      // Right footer
      doc.text(`Page ${pageNum}`, pageWidth - 14, pageHeight - 10, { align: 'right' });

      // Footer line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
    }
  });

  // --- 6. Summary Totals or Signature Block ---
  const finalY = doc.lastAutoTable?.finalY || currentY;

  if (totals && finalY < pageHeight - 35) {
    const summaryBoxX = pageWidth - 90;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(summaryBoxX, finalY + 4, 76, 16, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(totals.label || 'Grand Total:', summaryBoxX + 4, finalY + 13);

    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text(totals.value || '', summaryBoxX + 72, finalY + 13, { align: 'right' });
  }

  // Save the PDF file
  doc.save(fileName);
}
