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

  return (
    <div
      id="invoice-pdf-template"
      className="bg-white text-gray-900 p-8 max-w-[210mm] mx-auto"
      style={{
        width: '210mm',
        minHeight: '297mm',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-8 border-b border-gray-200 pb-6">
        <div>
          <h1
            className="font-bold text-3xl tracking-tight text-gray-900"
            style={{ fontFamily: 'system-ui' }}
          >
            INVOICE
          </h1>
          <p className="text-sm text-gray-500 mt-1">{invoice.invoiceNumber}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-base text-gray-900">Freelancer OS</p>
          <p className="text-xs text-gray-500 mt-0.5">Business / Personal</p>
        </div>
      </div>

      {/* Meta Row */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Bill To */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Bill To
          </p>
          {client ? (
            <div>
              <p className="font-semibold text-sm text-gray-900">{client.name}</p>
              {client.company && (
                <p className="text-sm text-gray-600">{client.company}</p>
              )}
              {client.email && (
                <p className="text-xs text-gray-500 mt-1">{client.email}</p>
              )}
              {client.whatsapp && (
                <p className="text-xs text-gray-500">{client.whatsapp}</p>
              )}
              {client.address && (
                <p className="text-xs text-gray-500 mt-1">{client.address}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No client</p>
          )}
        </div>

        {/* Invoice Details */}
        <div className="text-right">
          <div className="space-y-1">
            <div className="flex justify-end gap-8">
              <span className="text-xs text-gray-400">Invoice Date</span>
              <span className="text-xs text-gray-700 font-medium">
                {format(invoice.createdAt.toDate(), 'dd MMM yyyy', { locale: id })}
              </span>
            </div>
            <div className="flex justify-end gap-8">
              <span className="text-xs text-gray-400">Due Date</span>
              <span className={`text-xs font-medium ${dueDate < new Date() && invoice.status !== 'paid' ? 'text-red-500' : 'text-gray-700'}`}>
                {format(dueDate, 'dd MMM yyyy', { locale: id })}
              </span>
            </div>
            <div className="flex justify-end gap-8">
              <span className="text-xs text-gray-400">Status</span>
              <span className={`text-xs font-semibold uppercase tracking-wide ${
                invoice.status === 'paid' ? 'text-green-600' :
                invoice.status === 'overdue' ? 'text-red-500' :
                invoice.status === 'cancelled' ? 'text-gray-400' :
                'text-yellow-600'
              }`}>
                {invoice.status}
              </span>
            </div>
            {projectTitle && (
              <div className="flex justify-end gap-8">
                <span className="text-xs text-gray-400">Project</span>
                <span className="text-xs text-gray-700">{projectTitle}</span>
              </div>
            )}
            {paidDate && (
              <div className="flex justify-end gap-8">
                <span className="text-xs text-gray-400">Paid On</span>
                <span className="text-xs text-green-600 font-medium">
                  {format(paidDate, 'dd MMM yyyy', { locale: id })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="mb-6">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 border-b-2 border-gray-300 pb-2 mb-2">
          <div className="col-span-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Description
          </div>
          <div className="col-span-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Qty
          </div>
          <div className="col-span-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Unit Price
          </div>
          <div className="col-span-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total
          </div>
        </div>

        {/* Table Rows */}
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 py-2 border-b border-gray-100">
            <div className="col-span-6 text-sm text-gray-800">
              {item.description}
            </div>
            <div className="col-span-2 text-right text-sm text-gray-600">
              {item.quantity}
            </div>
            <div className="col-span-2 text-right text-sm text-gray-600">
              {formatIDR(item.unitPrice)}
            </div>
            <div className="col-span-2 text-right text-sm font-medium text-gray-900">
              {formatIDR(item.total)}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Subtotal</span>
            <span className="text-sm text-gray-700">{formatIDR(subtotal)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Tax</span>
              <span className="text-sm text-gray-700">{formatIDR(tax)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Discount</span>
              <span className="text-sm text-green-600">-{formatIDR(discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-gray-300 pt-2 mt-1">
            <span className="font-semibold text-base text-gray-900">Total</span>
            <span className="font-bold text-base text-gray-900">{formatIDR(total)}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400 italic">
              Terbilang: {numberToWords(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="mb-8 border border-gray-200 rounded p-4 bg-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Notes / Payment Terms
          </p>
          <p className="text-xs text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-4 mt-auto">
        <p className="text-center text-xs text-gray-400">
          Generated by Freelancer OS — {format(new Date(), 'dd MMM yyyy', { locale: id })}
        </p>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    if (hundreds) {
      words = threeDigits(hundreds) + ' ' + units[section] + ' ' + words;
    }
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
    const r = n % 10;
    const q = Math.floor(n / 10);
    return r === 0 ? tens[q] : tens[q] + ' ' + ones[r];
  }
  const r = n % 100;
  const q = Math.floor(n / 100);
  return (q === 1 ? 'seratus' : ones[q] + ' ratus') + ' ' + threeDigits(r);
}