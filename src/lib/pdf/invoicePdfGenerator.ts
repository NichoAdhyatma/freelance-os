import jsPDF from 'jspdf';
import type { Invoice, InvoiceItem } from '@/types/invoice';
import type { Client } from '@/types/client';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatIDR } from '@/lib/utils';

interface PdfOptions {
  invoice: Invoice;
  client: Client | null;
  projectTitle?: string;
}

const STATUS_COLORS: Record<string, string> = {
  paid: '#16a34a', sent: '#2563eb', pending: '#d97706',
  draft: '#6b7280', overdue: '#dc2626', cancelled: '#9ca3af',
};

export function generateInvoicePDF({ invoice, client, projectTitle }: PdfOptions): jsPDF {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const W = 210;
  const H = 297;
  const margin = 20;
  const contentW = W - margin * 2;

  const subtotal = invoice.amount ?? 0;
  const tax = invoice.tax ?? 0;
  const discount = invoice.discount ?? 0;
  const total = subtotal + tax - discount;
  const dueDate = invoice.dueDate.toDate();
  const paidDate = invoice.paidAt?.toDate();
  const statusColor = STATUS_COLORS[invoice.status] ?? STATUS_COLORS.draft;

  const items: InvoiceItem[] = invoice.items?.length ? invoice.items : [{
    description: invoice.title || projectTitle || 'Professional Services',
    quantity: 1,
    unitPrice: subtotal,
    total: subtotal,
  }];

  let y = 0;

  // ── Top bar ──────────────────────────────────────────────────────────────────
  pdf.setFillColor(28, 25, 23);
  pdf.rect(0, y, W, 2, 'F');
  y = 10;

  // ── Header ─────────────────────────────────────────────────────────────────
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(168, 162, 158);
  pdf.text('INVOICE', margin, y);

  pdf.setFontSize(22);
  pdf.setTextColor(28, 25, 23);
  pdf.text('FREELANCER', margin, y + 8);
  pdf.setFontSize(22);
  pdf.setTextColor(120, 113, 108);
  pdf.text('OS', margin + pdf.getTextWidth('FREELANCER') + 1, y + 8);

  // Invoice number — right
  const invNumWidth = pdf.getTextWidth(invoice.invoiceNumber);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(120, 113, 108);
  pdf.text('Invoice No.', W - margin - invNumWidth, y);
  pdf.setFontSize(11);
  pdf.setTextColor(28, 25, 23);
  pdf.text(invoice.invoiceNumber, W - margin - invNumWidth, y + 5);
  y += 22;

  // ── Divider ───────────────────────────────────────────────────────────────
  pdf.setDrawColor(231, 229, 228);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, W - margin, y);
  y += 12;

  // ── Bill To + Details ─────────────────────────────────────────────────────
  const col2 = W / 2 + 2;

  // Bill To
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(168, 162, 158);
  pdf.text('BILL TO', margin, y);
  y += 5;

  if (client) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(28, 25, 23);
    pdf.text(client.name, margin, y);
    y += 5;

    if (client.company) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(120, 113, 108);
      pdf.text(client.company, margin, y);
      y += 4;
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(87, 83, 78);
    const details = [client.email, client.whatsapp, client.address].filter(Boolean);
    details.forEach((d) => {
      pdf.text(d!, margin, y);
      y += 3.5;
    });
  } else {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(168, 162, 158);
    pdf.text('No client', margin, y);
  }

  // Details — right side
  const rightDetails: [string, string, boolean?][] = [
    ['DATE', format(invoice.createdAt.toDate(), 'dd MMM yyyy', { locale: id }), false],
    ['DUE', format(dueDate, 'dd MMM yyyy', { locale: id }), dueDate < new Date() && invoice.status !== 'paid'],
    ...(projectTitle ? [['PROJECT', projectTitle, false] as [string, string, boolean?]] : []),
    ...(paidDate ? [['PAID ON', format(paidDate, 'dd MMM yyyy', { locale: id }), true] as [string, string, boolean?]] : []),
    ['STATUS', invoice.status.toUpperCase(), false],
  ];

  let ry = y - (y - 17); // align with left
  const labelX = W - margin - 55;
  const valueX = W - margin - 35;

  rightDetails.forEach(([label, value, warning]: [string, string, boolean?]) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(168, 162, 158);
    pdf.text(label, labelX, ry);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    if (warning) {
      const r = parseInt(statusColor.slice(1, 3), 16);
      const g = parseInt(statusColor.slice(3, 5), 16);
      const b = parseInt(statusColor.slice(5, 7), 16);
      pdf.setTextColor(r, g, b);
    } else {
      pdf.setTextColor(28, 25, 23);
    }
    pdf.text(value, valueX, ry, { align: 'right', maxWidth: 55 });
    ry += 4.5;
  });

  y = Math.max(y, ry + 2);

  // Status pill (draw manually)
  const pillText = invoice.status.toUpperCase();
  const pillW = pdf.getTextWidth(pillText) + 10;
  const pillH = 5;
  const pillX = labelX;
  const pillY = ry - 1;
  const r = parseInt(statusColor.slice(1, 3), 16);
  const g = parseInt(statusColor.slice(3, 5), 16);
  const b = parseInt(statusColor.slice(5, 7), 16);
  pdf.setFillColor(r, g, b, 0.12);
  pdf.setDrawColor(r, g, b, 0.25);
  pdf.setLineWidth(0.2);
  pdf.roundedRect(pillX, pillY, pillW, pillH, 2.5, 2.5, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(r, g, b);
  pdf.text(pillText, pillX + 3, pillY + 3.2);

  y = Math.max(y, pillY + pillH + 8);

  // ── Line items table ──────────────────────────────────────────────────────
  // Header row
  const cols = {
    desc: margin,
    qty: margin + contentW * 0.6,
    price: margin + contentW * 0.75,
    amt: W - margin,
  };

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(120, 113, 108);
  pdf.text('DESCRIPTION', cols.desc, y);
  pdf.text('QTY', cols.qty, y, { align: 'right' });
  pdf.text('UNIT PRICE', cols.price, y, { align: 'right' });
  pdf.text('AMOUNT', cols.amt, y, { align: 'right' });
  y += 3;

  // Header underline
  pdf.setDrawColor(28, 25, 23);
  pdf.setLineWidth(0.4);
  pdf.line(margin, y, W - margin, y);
  y += 5;

  // Rows
  pdf.setFont('helvetica', 'normal');
  items.forEach((item) => {
    pdf.setFontSize(9);
    pdf.setTextColor(28, 25, 23);
    const descLines = pdf.splitTextToSize(item.description, cols.qty - cols.desc - 2);
    pdf.text(descLines, cols.desc, y);
    const rowH = descLines.length * 4;

    pdf.setFontSize(9);
    pdf.setTextColor(87, 83, 78);
    pdf.text(String(item.quantity), cols.qty, y, { align: 'right' });
    pdf.text(formatIDR(item.unitPrice), cols.price, y, { align: 'right' });
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatIDR(item.total), cols.amt, y, { align: 'right' });

    y += rowH + 4;

    // Row divider
    pdf.setDrawColor(231, 229, 228);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y - 1, W - margin, y - 1);
  });

  y += 8;

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totalsX = W - margin - 55;

  const drawTotalRow = (label: string, value: string, highlight = false) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(highlight ? 250 : 120, highlight ? 250 : 113, highlight ? 250 : 108);
    pdf.text(label, totalsX, y);
    pdf.setFont(highlight ? 'helvetica' : 'helvetica', highlight ? 'bold' : 'normal');
    pdf.text(value, W - margin, y, { align: 'right' });
    y += 5;
    pdf.setDrawColor(231, 229, 228);
    pdf.setLineWidth(0.1);
    pdf.line(totalsX, y - 2, W - margin, y - 2);
  };

  drawTotalRow('Subtotal', formatIDR(subtotal));
  if (tax > 0) drawTotalRow('PPN 11%', formatIDR(tax));
  if (discount > 0) drawTotalRow('Diskon', `–${formatIDR(discount)}`);

  y += 2;

  // Grand total — dark box
  const boxH = 9;
  pdf.setFillColor(28, 25, 23);
  pdf.roundedRect(totalsX - 2, y, (W - margin - totalsX + 2) + 55, boxH, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(168, 162, 158);
  pdf.text('TOTAL', totalsX + 1, y + 5.5);
  pdf.setFontSize(13);
  pdf.setTextColor(250, 250, 249);
  pdf.text(formatIDR(total), W - margin - 2, y + 5.5, { align: 'right' });
  y += boxH + 5;

  // Terbilang
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.setTextColor(168, 162, 158);
  pdf.text(numberToWords(total), W - margin, y, { align: 'right' });
  y += 8;

  // ── Notes ──────────────────────────────────────────────────────────────────
  if (invoice.notes) {
    pdf.setFillColor(245, 244, 241);
    pdf.roundedRect(margin, y, contentW, 20, 2, 2, 'F');
    // left accent bar
    pdf.setFillColor(28, 25, 23);
    pdf.rect(margin, y, 1.5, 20, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(168, 162, 158);
    pdf.text('PAYMENT TERMS & NOTES', margin + 5, y + 6);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(87, 83, 78);
    const noteLines = pdf.splitTextToSize(invoice.notes, contentW - 12);
    pdf.text(noteLines, margin + 5, y + 11);
    y += 24;
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  pdf.setDrawColor(231, 229, 228);
  pdf.setLineWidth(0.2);
  pdf.line(margin, y, W - margin, y);
  y += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(168, 162, 158);
  pdf.text('Powered by Freelancer OS', margin, y);
  pdf.text(format(new Date(), 'dd MMM yyyy', { locale: id }), W - margin, y, { align: 'right' });

  // Bottom bar
  pdf.setFillColor(28, 25, 23);
  pdf.rect(0, H - 4, W, 4, 'F');

  return pdf;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function numberToWords(num: number): string {
  if (num === 0) return 'nol rupiah';
  const units = ['', 'ribu', 'juta', 'milyar', 'trilyun'];
  const numStr = Math.round(num).toString();
  const len = numStr.length;
  let words = '';
  let section = Math.ceil(len / 3) - 1;
  let n = parseInt(numStr, 10);
  while (n > 0) {
    const hundreds = n % 1000;
    if (hundreds) words = threeDigits(hundreds) + ' ' + units[section] + ' ' + words;
    n = Math.floor(n / 1000);
    section--;
  }
  return (words.trim() + ' rupiah').trim();
}

function threeDigits(n: number): string {
  const ones = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
  const tens = ['', '', 'dua puluh', 'tiga puluh', 'empat puluh', 'lima puluh', 'enam puluh', 'tujuh puluh', 'delapan puluh', 'sembilan puluh'];
  if (n < 10) return ones[n];
  if (n < 100) {
    const r = n % 10; const q = Math.floor(n / 10);
    return r === 0 ? tens[q] : tens[q] + ' ' + ones[r];
  }
  const r = n % 100; const q = Math.floor(n / 100);
  return (q === 1 ? 'seratus' : ones[q] + ' ratus') + ' ' + threeDigits(r);
}