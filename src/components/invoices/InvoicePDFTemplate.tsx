'use client';

import { useEffect, useRef } from 'react';
import type { Invoice } from '@/types/invoice';
import type { Client } from '@/types/client';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatIDR } from '@/lib/utils';
import type { InvoiceItem } from '@/types/invoice';

interface InvoicePDFTemplateProps {
  invoice: Invoice;
  client: Client | null;
  projectTitle?: string;
}

const STATUS_COLORS: Record<string, string> = {
  paid: '#16a34a', sent: '#2563eb', pending: '#d97706',
  draft: '#6b7280', overdue: '#dc2626', cancelled: '#9ca3af',
};

/** Pure HTML string — no Tailwind, no CSS vars, no oklch().
 *  Rendered inside a sandboxed iframe so html2canvas captures a clean image.
 */
export function buildInvoiceHTML(props: InvoicePDFTemplateProps): string {
  const { invoice, client, projectTitle } = props;
  const subtotal = invoice.amount ?? 0;
  const tax = invoice.tax ?? 0;
  const discount = invoice.discount ?? 0;
  const total = subtotal + tax - discount;

  const items: InvoiceItem[] = invoice.items?.length ? invoice.items : [{
    description: invoice.title || projectTitle || 'Professional Services',
    quantity: 1,
    unitPrice: subtotal,
    total: subtotal,
  }];

  const dueDate = invoice.dueDate.toDate();
  const paidDate = invoice.paidAt?.toDate();
  const statusColor = STATUS_COLORS[invoice.status] ?? STATUS_COLORS.draft;

  const statusPill = `
    <span style="
      display:inline-flex;align-items:center;gap:5px;
      padding:2px 8px;border-radius:100px;
      background:${statusColor}18;border:1px solid ${statusColor}40;
    ">
      <span style="width:5px;height:5px;border-radius:50%;background:${statusColor};display:block"></span>
      <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:${statusColor}">${invoice.status}</span>
    </span>`;

  const rowsHtml = items.map((item, i) => `
    <div style="display:grid;grid-template-columns:1fr 56px 96px 96px;padding:10px 0;border-bottom:1px solid #e7e5e4;">
      <span style="font-size:12px;color:#1c1917;line-height:1.4;padding-right:16px">${item.description}</span>
      <span style="font-size:12px;color:#57534e;text-align:right;font-variant-numeric:tabular-nums">${item.quantity}</span>
      <span style="font-size:12px;color:#57534e;text-align:right;font-variant-numeric:tabular-nums">${formatIDR(item.unitPrice)}</span>
      <span style="font-size:12px;font-weight:600;color:#1c1917;text-align:right;font-variant-numeric:tabular-nums">${formatIDR(item.total)}</span>
    </div>`).join('');

  const subtotalRows = `
    <div style="display:flex;justify-content:space-between;padding-bottom:6px;margin-bottom:6px;border-bottom:1px solid #e7e5e4;">
      <span style="font-size:11px;color:#78716c">Subtotal</span>
      <span style="font-size:12px;color:#1c1917;font-variant-numeric:tabular-nums">${formatIDR(subtotal)}</span>
    </div>`;
  const taxRow = tax > 0 ? `
    <div style="display:flex;justify-content:space-between;padding-bottom:6px;margin-bottom:6px;border-bottom:1px solid #e7e5e4;">
      <span style="font-size:11px;color:#78716c">PPN 11%</span>
      <span style="font-size:12px;color:#1c1917;font-variant-numeric:tabular-nums">${formatIDR(tax)}</span>
    </div>` : '';
  const discountRow = discount > 0 ? `
    <div style="display:flex;justify-content:space-between;padding-bottom:6px;margin-bottom:6px;border-bottom:1px solid #e7e5e4;">
      <span style="font-size:11px;color:#78716c">Diskon</span>
      <span style="font-size:12px;color:#16a34a;font-variant-numeric:tabular-nums">–${formatIDR(discount)}</span>
    </div>` : '';
  const grandTotal = `
    <div style="display:flex;justify-content:space-between;align-items:center;
      background:#1c1917;border-radius:6px;padding:10px 14px;margin-top:2px;">
      <span style="font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#a8a29e">Total</span>
      <span style="font-size:16px;font-weight:800;color:#fafaf9;font-variant-numeric:tabular-nums">${formatIDR(total)}</span>
    </div>`;
  const palabras = `<div style="margin-top:6px;text-align:right;">
    <span style="font-size:10px;color:#a8a29e;font-style:italic">${numberToWords(total)}</span>
  </div>`;

  const notesHtml = invoice.notes ? `
    <div style="background:#f5f4f1;border-left:3px solid #1c1917;border-radius:0 6px 6px 0;padding:14px 16px;margin-bottom:32px;">
      <div style="font-size:9px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#a8a29e;margin-bottom:8px">Payment Terms &amp; Notes</div>
      <p style="font-size:11px;color:#57534e;line-height:1.6;margin:0;white-space:pre-wrap">${invoice.notes}</p>
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 210mm; min-height: 297mm; background: #fafaf9; font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif; color: #1c1917; }
  .page { padding: 40px 44px 36px; }
  .top-bar { height: 4px; background: #1c1917; }
  .bottom-bar { height: 4px; background: #1c1917; margin-top: -4px; }
  .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 40px; gap: 16px; }
  .wordmark-label { font-size: 9px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #a8a29e; margin-bottom: 6px; }
  .wordmark { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; }
  .wordmark .sub { color: #78716c; }
  .meta { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
  .meta-label { font-size: 11px; color: #78716c; }
  .meta-value { font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .divider { height: 1px; background: #e7e5e4; margin-bottom: 32px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-bottom: 36px; }
  .section-label { font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #a8a29e; margin-bottom: 12px; }
  .client-name { font-size: 17px; font-weight: 700; color: #1c1917; margin-bottom: 3px; letter-spacing: -0.01em; }
  .client-company { font-size: 12px; color: #78716c; margin-bottom: 6px; }
  .client-detail { font-size: 11px; color: #57534e; }
  .details-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0; }
  .detail-row { display: grid; grid-template-columns: auto auto; gap: 2px 24px; align-items: end; }
  .detail-key { font-size: 10px; color: #a8a29e; font-weight: 500; }
  .detail-val { font-size: 11px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .table-header { display: grid; grid-template-columns: 1fr 56px 96px 96px; padding-bottom: 8px; border-bottom: 2px solid #1c1917; margin-bottom: 0; }
  .th { font-size: 9px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #78716c; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
  .totals-box { width: 220px; }
  .footer { border-top: 1px solid #e7e5e4; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; }
  .footer-text { font-size: 10px; color: #a8a29e; }
  .footer-date { font-size: 10px; color: #c4bfbb; font-variant-numeric: tabular-nums; }
</style>
</head>
<body>
<div class="page">
  <div class="top-bar"></div>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="wordmark-label">Invoice</div>
      <div class="wordmark">FREELANCER<span class="sub">OS</span></div>
    </div>
    <div class="meta">
      <div class="meta-label">Invoice No.</div>
      <div class="meta-value">${invoice.invoiceNumber}</div>
    </div>
  </div>

  <!-- Divider -->
  <div class="divider"></div>

  <!-- Bill To + Details -->
  <div class="grid">
    <div>
      <div class="section-label">Bill To</div>
      ${client ? `
        <div class="client-name">${client.name}</div>
        ${client.company ? `<div class="client-company">${client.company}</div>` : ''}
        <div style="display:flex;flex-direction:column;gap:2px">
          ${client.email ? `<span class="client-detail">${client.email}</span>` : ''}
          ${client.whatsapp ? `<span class="client-detail">${client.whatsapp}</span>` : ''}
          ${client.address ? `<span class="client-detail">${client.address}</span>` : ''}
        </div>` : '<span style="font-size:12px;color:#a8a29e;font-style:italic">No client</span>'}
    </div>
    <div class="details-right">
      <div class="detail-row">
        <span class="detail-key">Date</span>
        <span class="detail-val">${format(invoice.createdAt.toDate(), 'dd MMM yyyy', { locale: id })}</span>
        <span class="detail-key">Due</span>
        <span class="detail-val" style="color:${dueDate < new Date() && invoice.status !== 'paid' ? statusColor : '#1c1917'}">${format(dueDate, 'dd MMM yyyy', { locale: id })}</span>
        ${projectTitle ? `<span class="detail-key">Project</span><span class="detail-val" style="font-weight:400">${projectTitle}</span>` : ''}
        ${paidDate ? `<span class="detail-key">Paid On</span><span class="detail-val" style="color:#16a34a;font-weight:700">${format(paidDate, 'dd MMM yyyy', { locale: id })}</span>` : ''}
        <span class="detail-key">Status</span>
        <span>${statusPill}</span>
      </div>
    </div>
  </div>

  <!-- Line Items -->
  <div class="table-header">
    <span class="th">Description</span>
    <span class="th" style="text-align:right">Qty</span>
    <span class="th" style="text-align:right">Unit Price</span>
    <span class="th" style="text-align:right">Amount</span>
  </div>
  <div>${rowsHtml}</div>

  <!-- Totals -->
  <div class="totals">
    <div class="totals-box">
      ${subtotalRows}
      ${taxRow}
      ${discountRow}
      ${grandTotal}
      ${palabras}
    </div>
  </div>

  ${notesHtml}

  <!-- Footer -->
  <div class="footer">
    <span class="footer-text">Powered by Freelancer OS</span>
    <span class="footer-date">${format(new Date(), 'dd MMM yyyy', { locale: id })}</span>
  </div>
</div>
<div class="bottom-bar"></div>
</body>
</html>`;
}

export function InvoicePDFTemplate(_props: InvoicePDFTemplateProps) {
  return null; // unused — we render via iframe instead
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