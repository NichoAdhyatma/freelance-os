'use client';

import type { Invoice } from '@/types/invoice';
import type { Client } from '@/types/client';
import type { BankDetails } from '@/types/user';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatIDR } from '@/lib/utils';
import type { InvoiceItem } from '@/types/invoice';

interface InvoicePDFTemplateProps {
  invoice: Invoice;
  client: Client | null;
  projectTitle?: string;
  userName?: string;
  userCompany?: string;
  userPhone?: string;
  userAddress?: string;
  userLogo?: string;
  bankDetails?: BankDetails;
  issueDate?: Date;
  terms?: string;
}

const DEFAULT_TERMS = 'Pembayaran harap dilakukan sesuai batas waktu yang tertera. Terima kasih atas kepercayaan Anda.';

/** Pure HTML string — no Tailwind, no CSS vars, no oklch().
 *  Rendered inside a sandboxed iframe so html2canvas captures a clean image.
 */
export function buildInvoiceHTML(props: InvoicePDFTemplateProps): string {
  const {
    invoice,
    client,
    userName,
    userCompany,
    userPhone,
    userAddress,
    userLogo,
    bankDetails,
    issueDate = new Date(),
    terms = DEFAULT_TERMS,
  } = props;

  const subtotal = invoice.amount ?? 0;
  const tax = invoice.tax ?? 0;
  const discount = invoice.discount ?? 0;
  const total = subtotal + tax - discount;

  const items: InvoiceItem[] = invoice.items?.length ? invoice.items : [{
    description: invoice.title || 'Professional Services',
    quantity: 1,
    unitPrice: subtotal,
    total: subtotal,
  }];

  const dueDate = invoice.dueDate.toDate();
  const isDraft = invoice.status === 'draft';

  // Logo HTML
  const logoHtml = userLogo
    ? `<img src="${userLogo}" alt="Logo" style="max-height:48px;max-width:160px;object-fit:contain;" onerror="this.style.display='none'" />`
    : '';

  // Line items rows
  const rowsHtml = items.map((item, index) => {
    const bgStyle = index % 2 === 0 ? '#ffffff' : '#fafaf9';
    return `
    <tr style="background:${bgStyle};">
      <td style="padding:12px 16px 12px 0;font-size:13px;color:#1c1917;vertical-align:middle;border-bottom:1px solid #e7e5e4;">
        ${item.description || '<span style="color:#a8a29e;font-style:italic">Untitled item</span>'}
      </td>
      <td style="padding:12px 0;text-align:center;font-size:13px;color:#57534e;vertical-align:middle;border-bottom:1px solid #e7e5e4;width:60px;">${item.quantity}</td>
      <td style="padding:12px 0;text-align:right;font-size:13px;color:#57534e;vertical-align:middle;border-bottom:1px solid #e7e5e4;width:120px;font-variant-numeric:tabular-nums;">${formatIDR(item.unitPrice)}</td>
      <td style="padding:12px 0;text-align:right;font-size:13px;font-weight:600;color:#1c1917;vertical-align:middle;border-bottom:1px solid #e7e5e4;width:120px;font-variant-numeric:tabular-nums;">${formatIDR(item.total)}</td>
    </tr>`;
  }).join('');

  // Totals section
  let totalsHtml = `
    <div style="margin-left:auto;width:240px;display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#57534e;">
        <span>Subtotal</span>
        <span style="font-variant-numeric:tabular-nums;">${formatIDR(subtotal)}</span>
      </div>`;

  if (tax > 0) {
    totalsHtml += `
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#57534e;">
        <span>Pajak (Tax)</span>
        <span style="font-variant-numeric:tabular-nums;">+ ${formatIDR(tax)}</span>
      </div>`;
  }

  if (discount > 0) {
    totalsHtml += `
      <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#57534e;">
        <span>Diskon (Discount)</span>
        <span style="font-variant-numeric:tabular-nums;color:#16a34a;">- ${formatIDR(discount)}</span>
      </div>`;
  }

  totalsHtml += `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#1c1917;border-radius:8px;margin-top:4px;">
        <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#d6d3d1;">Total</span>
        <span style="font-size:18px;font-weight:800;color:#fafaf9;font-variant-numeric:tabular-nums;">${formatIDR(total)}</span>
      </div>
    </div>`;

  // Notes section
  const notesHtml = invoice.notes ? `
    <div style="padding:20px 44px 0;">
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#78716c;margin:0 0 8px 0;">Catatan</p>
      <p style="font-size:12px;color:#57534e;line-height:1.7;margin:0;padding:12px 16px;background:#fafaf9;border-radius:8px;border-left:3px solid #1c1917;">${invoice.notes}</p>
    </div>` : '';

  // Terms section
  const termsHtml = `
    <div style="padding:20px 44px 0;">
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#78716c;margin:0 0 8px 0;">Syarat & Ketentuan</p>
      <p style="font-size:11px;color:#78716c;line-height:1.6;margin:0;padding:12px 16px;background:#fafaf9;border-radius:8px;">${terms}</p>
    </div>`;

  // Bank details section
  const bankDetailsHtml = bankDetails?.bankName ? `
    <div style="padding:20px 44px 0;">
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#78716c;margin:0 0 8px 0;">Informasi Pembayaran</p>
      <div style="padding:12px 16px;background:#fafaf9;border-radius:8px;display:flex;flex-direction:column;gap:6px;">
        <div style="display:flex;justify-content:space-between;font-size:12px;">
          <span style="color:#78716c;">Bank</span>
          <span style="font-weight:600;color:#1c1917;">${bankDetails.bankName}</span>
        </div>
        ${bankDetails.accountName ? `
        <div style="display:flex;justify-content:space-between;font-size:12px;">
          <span style="color:#78716c;">Nama Rekening</span>
          <span style="font-weight:600;color:#1c1917;">${bankDetails.accountName}</span>
        </div>` : ''}
        ${bankDetails.accountNumber ? `
        <div style="display:flex;justify-content:space-between;font-size:12px;">
          <span style="color:#78716c;">Nomor Rekening</span>
          <span style="font-weight:700;color:#1c1917;font-family:monospace;letter-spacing:0.05em;">${bankDetails.accountNumber}</span>
        </div>` : ''}
      </div>
    </div>` : '';

  // Draft watermark
  const watermarkHtml = isDraft ? `
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);opacity:0.08;font-size:120px;font-weight:900;color:#1c1917;pointer-events:none;z-index:1;white-space:nowrap;text-transform:uppercase;letter-spacing:0.1em;">DRAFT</div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { width: 210mm; min-height: 297mm; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1c1917; }
  .page { padding: 0 0 40px; position: relative; }
  .top-bar { height: 4px; background: #1c1917; }
  /* Header */
  .header { background: #ffffff; border-bottom: 2px solid #e7e5e4; padding: 28px 44px; display: flex; align-items: center; justify-content: space-between; }
  .header-left { display: flex; align-items: center; gap: 16px; }
  .header-left h2 { font-size: 28px; font-weight: 800; color: #1c1917; letter-spacing: -0.03em; margin: 0; }
  .header-left p { font-size: 13px; color: #78716c; font-family: monospace; margin: 4px 0 0 0; }
  .header-right { display: flex; align-items: center; gap: 16px; }
  .header-right img { max-height: 48px; max-width: 160px; object-fit: contain; }
  /* Meta section */
  .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding: 28px 44px; background: #fafaf9; border-bottom: 1px solid #e7e5e4; }
  .section-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #a8a29e; margin-bottom: 8px; }
  .client-name { font-size: 15px; font-weight: 700; color: #1c1917; margin-bottom: 4px; }
  .client-detail { font-size: 12px; color: #78716c; margin-top: 2px; }
  /* Dates row */
  .dates-row { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding: 14px 44px; background: #ffffff; border-bottom: 1px solid #f5f5f4; }
  .date-item { font-size: 13px; color: #57534e; }
  .date-item strong { font-weight: 600; color: #1c1917; }
  /* Line items */
  .items-section { padding: 0 44px; }
  .items-table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 8px; overflow: hidden; }
  .items-table th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #78716c; padding: 16px 16px 12px 0; text-align: left; background: #fafaf9; border-bottom: 2px solid #e7e5e4; }
  .items-table th:nth-child(2) { text-align: center; }
  .items-table th:nth-child(3) { text-align: right; }
  .items-table th:nth-child(4) { text-align: right; }
  /* Totals */
  .totals-section { padding: 24px 44px 0; }
  /* Footer */
  .footer { padding: 24px 44px 0; border-top: 1px solid #e7e5e4; margin-top: 32px; }
  .footer-text { font-size: 10px; color: #a8a29e; text-align: center; }
</style>
</head>
<body>
<div class="page">
  ${watermarkHtml}
  <div class="top-bar"></div>

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div>
        <h2>INVOICE</h2>
        <p>${invoice.invoiceNumber}</p>
      </div>
    </div>
    <div class="header-right">
      ${logoHtml}
    </div>
  </div>

  <!-- From / Bill To -->
  <div class="meta">
    <div>
      <div class="section-label">From</div>
      <div class="client-name">${userCompany || 'Freelancer OS'}</div>
      ${userName ? `<div class="client-detail">${userName}</div>` : ''}
      ${userPhone ? `<div class="client-detail">${userPhone}</div>` : ''}
      ${userAddress ? `<div class="client-detail">${userAddress}</div>` : ''}
    </div>
    <div>
      <div class="section-label">Bill To</div>
      ${client ? `
        <div class="client-name">${client.name}</div>
        ${client.company ? `<div class="client-detail">${client.company}</div>` : ''}
        ${client.email ? `<div class="client-detail">${client.email}</div>` : ''}
        ${client.whatsapp ? `<div class="client-detail">${client.whatsapp}</div>` : ''}
      ` : '<div class="client-detail" style="font-style:italic;color:#a8a29e;">Select client</div>'}
    </div>
  </div>

  <!-- Dates -->
  <div class="dates-row">
    <div class="date-item"><strong>Tanggal Terbit:</strong> ${format(issueDate, 'dd MMMM yyyy', { locale: id })}</div>
    <div class="date-item"><strong>Jatuh Tempo:</strong> ${format(dueDate, 'dd MMMM yyyy', { locale: id })}</div>
  </div>

  <!-- Line Items -->
  <div class="items-section">
    <table class="items-table">
      <thead>
        <tr>
          <th>Deskripsi</th>
          <th>Qty</th>
          <th>Harga</th>
          <th>Jumlah</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  </div>

  <!-- Totals -->
  <div class="totals-section">
    ${totalsHtml}
  </div>

  <!-- Bank Details -->
  ${bankDetailsHtml}

  <!-- Notes -->
  ${notesHtml}

  <!-- Terms -->
  ${termsHtml}

  <!-- Footer -->
  <div class="footer">
    <p class="footer-text">Powered by Freelancer OS</p>
  </div>
</div>
</body>
</html>`;
}

export function InvoicePDFTemplate(_props: InvoicePDFTemplateProps) {
  return null; // unused — we render via iframe instead
}
