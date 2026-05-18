'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import type { Invoice, InvoiceItem } from '@/types/invoice';
import type { Client } from '@/types/client';
import { formatIDR } from '@/lib/utils';

interface InvoicePDFTemplateProps {
  invoice: Invoice;
  client: Client | null;
  projectTitle?: string;
}

const STATUS_COLORS: Record<string, string> = {
  paid: '#16a34a',
  sent: '#2563eb',
  pending: '#d97706',
  draft: '#6b7280',
  overdue: '#dc2626',
  cancelled: '#9ca3af',
};

export function InvoicePDFTemplate({
  invoice,
  client,
  projectTitle,
}: InvoicePDFTemplateProps) {
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

  return (
    <div
      id="invoice-pdf-template"
      className="print-root"
      style={{
        width: '210mm',
        minHeight: '297mm',
        background: '#fafaf9',
        fontFamily: "'DM Sans', 'Helvetica Neuei', Helvetica, Arial, sans-serif",
        color: '#1c1917',
        padding: '0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Top accent bar ──────────────────────────────────────────── */}
      <div style={{ height: '4px', background: `linear-gradient(90deg, #1c1917 0%, #57534e 50%, #a8a29e 100%)` }} />

      {/* ── Main content wrapper ─────────────────────────────────────── */}
      <div style={{ padding: '40px 44px 36px' }}>

        {/* Header row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '40px',
          gap: '16px',
        }}>
          {/* Left: wordmark + label */}
          <div>
            <div style={{
              fontSize: '9px',
              fontWeight: '600',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#a8a29e',
              marginBottom: '6px',
            }}>
              Invoice
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1c1917',
              letterSpacing: '-0.02em',
              lineHeight: '1',
            }}>
              FREELANCER
              <br />
              <span style={{ color: '#78716c' }}>OS</span>
            </div>
          </div>

          {/* Right: meta block */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '3px',
          }}>
            <div style={{
              fontSize: '11px',
              color: '#78716c',
              fontWeight: '400',
            }}>
              Invoice No.
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#1c1917',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.02em',
            }}>
              {invoice.invoiceNumber}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, #1c1917 0%, #e7e5e4 60%, transparent 100%)',
          marginBottom: '32px',
        }} />

        {/* Bill To + Details grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0',
          marginBottom: '36px',
        }}>
          {/* Bill To */}
          <div>
            <div style={{
              fontSize: '9px',
              fontWeight: '600',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#a8a29e',
              marginBottom: '12px',
            }}>
              Bill To
            </div>
            {client ? (
              <div>
                <div style={{
                  fontSize: '17px',
                  fontWeight: '700',
                  color: '#1c1917',
                  marginBottom: '3px',
                  letterSpacing: '-0.01em',
                }}>
                  {client.name}
                </div>
                {client.company && (
                  <div style={{ fontSize: '12px', color: '#78716c', marginBottom: '6px' }}>
                    {client.company}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {client.email && (
                    <span style={{ fontSize: '11px', color: '#57534e' }}>{client.email}</span>
                  )}
                  {client.whatsapp && (
                    <span style={{ fontSize: '11px', color: '#57534e' }}>{client.whatsapp}</span>
                  )}
                  {client.address && (
                    <span style={{ fontSize: '11px', color: '#57534e' }}>{client.address}</span>
                  )}
                </div>
              </div>
            ) : (
              <span style={{ fontSize: '12px', color: '#a8a29e', fontStyle: 'italic' }}>No client</span>
            )}
          </div>

          {/* Invoice details — right aligned */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto auto',
              gap: '2px 24px',
              alignItems: 'end',
            }}>
              <span style={{ fontSize: '10px', color: '#a8a29e', fontWeight: '500' }}>Date</span>
              <span style={{ fontSize: '11px', color: '#1c1917', fontWeight: '600', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {format(invoice.createdAt.toDate(), 'dd MMM yyyy', { locale: id })}
              </span>

              <span style={{ fontSize: '10px', color: '#a8a29e', fontWeight: '500' }}>Due</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
                color: dueDate < new Date() && invoice.status !== 'paid' ? statusColor : '#1c1917',
              }}>
                {format(dueDate, 'dd MMM yyyy', { locale: id })}
              </span>

              {projectTitle && (
                <>
                  <span style={{ fontSize: '10px', color: '#a8a29e', fontWeight: '500' }}>Project</span>
                  <span style={{ fontSize: '11px', color: '#1c1917', textAlign: 'right' }}>{projectTitle}</span>
                </>
              )}

              {paidDate && (
                <>
                  <span style={{ fontSize: '10px', color: '#a8a29e', fontWeight: '500' }}>Paid On</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', textAlign: 'right' }}>
                    {format(paidDate, 'dd MMM yyyy', { locale: id })}
                  </span>
                </>
              )}

              {/* Status pill */}
              <span style={{ fontSize: '10px', color: '#a8a29e', fontWeight: '500' }}>Status</span>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '100px',
                background: statusColor + '18',
                border: `1px solid ${statusColor}40`,
              }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusColor, display: 'block' }} />
                <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', color: statusColor }}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line items section */}
        <div style={{ marginBottom: '28px' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 56px 96px 96px',
            gap: '0',
            paddingBottom: '8px',
            borderBottom: '2px solid #1c1917',
            marginBottom: '0',
          }}>
            <span style={{
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#78716c',
            }}>Description</span>
            <span style={{
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#78716c',
              textAlign: 'right',
            }}>Qty</span>
            <span style={{
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#78716c',
              textAlign: 'right',
            }}>Unit Price</span>
            <span style={{
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#78716c',
              textAlign: 'right',
            }}>Amount</span>
          </div>

          {/* Table rows */}
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 56px 96px 96px',
                gap: '0',
                paddingTop: '10px',
                paddingBottom: '10px',
                borderBottom: '1px solid #e7e5e4',
              }}
            >
              <span style={{ fontSize: '12px', color: '#1c1917', lineHeight: '1.4', paddingRight: '16px' }}>
                {item.description}
              </span>
              <span style={{ fontSize: '12px', color: '#57534e', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {item.quantity}
              </span>
              <span style={{ fontSize: '12px', color: '#57534e', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {formatIDR(item.unitPrice)}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#1c1917', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {formatIDR(item.total)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals block — right aligned */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '32px',
        }}>
          <div style={{ width: '220px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingBottom: '6px',
              marginBottom: '6px',
              borderBottom: '1px solid #e7e5e4',
            }}>
              <span style={{ fontSize: '11px', color: '#78716c' }}>Subtotal</span>
              <span style={{ fontSize: '12px', color: '#1c1917', fontVariantNumeric: 'tabular-nums' }}>{formatIDR(subtotal)}</span>
            </div>
            {tax > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: '6px',
                marginBottom: '6px',
                borderBottom: '1px solid #e7e5e4',
              }}>
                <span style={{ fontSize: '11px', color: '#78716c' }}>PPN 11%</span>
                <span style={{ fontSize: '12px', color: '#1c1917', fontVariantNumeric: 'tabular-nums' }}>{formatIDR(tax)}</span>
              </div>
            )}
            {discount > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: '6px',
                marginBottom: '6px',
                borderBottom: '1px solid #e7e5e4',
              }}>
                <span style={{ fontSize: '11px', color: '#78716c' }}>Discount</span>
                <span style={{ fontSize: '12px', color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>–{formatIDR(discount)}</span>
              </div>
            )}
            {/* Grand total — accent block */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#1c1917',
              borderRadius: '6px',
              padding: '10px 14px',
              marginTop: '2px',
            }}>
              <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a8a29e' }}>
                Total
              </span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#fafaf9', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                {formatIDR(total)}
              </span>
            </div>
            {/* Terbilang */}
            <div style={{ marginTop: '6px', textAlign: 'right' }}>
              <span style={{ fontSize: '10px', color: '#a8a29e', fontStyle: 'italic' }}>
                {numberToWords(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes block */}
        {invoice.notes && (
          <div style={{
            background: '#f5f4f1',
            borderLeft: '3px solid #1c1917',
            borderRadius: '0 6px 6px 0',
            padding: '14px 16px',
            marginBottom: '32px',
          }}>
            <div style={{
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#a8a29e',
              marginBottom: '8px',
            }}>
              Payment Terms &amp; Notes
            </div>
            <p style={{ fontSize: '11px', color: '#57534e', lineHeight: '1.6', margin: '0', whiteSpace: 'pre-wrap' }}>
              {invoice.notes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #e7e5e4',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '10px', color: '#a8a29e' }}>
            Powered by Freelancer OS
          </span>
          <span style={{
            fontSize: '10px',
            color: '#c4bfbb',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {format(new Date(), 'dd MMM yyyy', { locale: id })}
          </span>
        </div>
      </div>

      {/* ── Bottom accent bar ─────────────────────────────────────────── */}
      <div style={{ height: '4px', background: `linear-gradient(90deg, #a8a29e 0%, #1c1917 100%)` }} />
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

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